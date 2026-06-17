package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

const maxCodeSize = 200_000

type CompilationResult struct {
	Success   bool   `json:"success"`
	Output    string `json:"output"`
	Error     string `json:"error"`
	TimeMs    int64  `json:"timeMs"`
	CompileMs int64  `json:"compileMs"`
	RunMs     int64  `json:"runMs"`
	CacheHit  bool   `json:"cacheHit"`
}

type CompilerService struct {
	cacheDir   string
	cache      map[string]string
	mu         sync.RWMutex
	group      singleflight.Group
	useSandbox bool
}

func NewCompilerService() *CompilerService {
	dir := filepath.Join(os.TempDir(), "csharp-practicum-cache")
	_ = os.MkdirAll(dir, 0755)
	return &CompilerService{
		cacheDir:   dir,
		cache:      make(map[string]string),
		useSandbox: os.Getenv("COMPILER_SANDBOX") != "0",
	}
}

func (s *CompilerService) CompileOnly(code string, timeout time.Duration) (string, int64, bool, error) {
	start := time.Now()
	code, err := normalizeCode(code)
	if err != nil {
		return "", time.Since(start).Milliseconds(), false, err
	}

	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(code)))
	if dllPath, ok := s.cachedDLL(hash); ok {
		return dllPath, time.Since(start).Milliseconds(), true, nil
	}

	v, err, _ := s.group.Do(hash, func() (interface{}, error) {
		dir := filepath.Join(s.cacheDir, hash)
		if err := s.setupProject(dir, code); err != nil {
			return nil, err
		}
		if err := s.buildProject(dir, timeout); err != nil {
			_ = os.RemoveAll(dir)
			return nil, err
		}

		s.mu.Lock()
		s.cache[hash] = dir
		s.mu.Unlock()
		return dir, nil
	})
	if err != nil {
		return "", time.Since(start).Milliseconds(), false, err
	}

	dir := v.(string)
	return filepath.Join(dir, "bin", "Release", "net8.0", "app.dll"), time.Since(start).Milliseconds(), false, nil
}

func (s *CompilerService) GetCachedDLL(code string) (string, error) {
	code, err := normalizeCode(code)
	if err != nil {
		return "", err
	}
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(code)))
	if dllPath, ok := s.cachedDLL(hash); ok {
		return dllPath, nil
	}
	return "", fmt.Errorf("not in cache")
}

func (s *CompilerService) CompileAndRun(code, input string, timeout time.Duration) CompilationResult {
	start := time.Now()
	dllPath, compileMs, cacheHit, err := s.CompileOnly(code, timeout)
	if err != nil {
		return CompilationResult{Success: false, Error: err.Error(), TimeMs: time.Since(start).Milliseconds(), CompileMs: compileMs, CacheHit: cacheHit}
	}

	dir := filepath.Dir(filepath.Dir(filepath.Dir(filepath.Dir(dllPath))))
	res := s.executeProject(dir, input, timeout, start, cacheHit)
	res.CompileMs = compileMs
	res.CacheHit = cacheHit
	return res
}

func normalizeCode(code string) (string, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return "", fmt.Errorf("Пустой код")
	}
	if len(code) > maxCodeSize {
		return "", fmt.Errorf("Исходный код превышает допустимый размер")
	}
	return code, nil
}

func (s *CompilerService) cachedDLL(hash string) (string, bool) {
	s.mu.RLock()
	dir, cached := s.cache[hash]
	s.mu.RUnlock()
	if !cached {
		return "", false
	}

	dllPath := filepath.Join(dir, "bin", "Release", "net8.0", "app.dll")
	if _, err := os.Stat(dllPath); err == nil {
		return dllPath, true
	}

	s.mu.Lock()
	delete(s.cache, hash)
	s.mu.Unlock()
	return "", false
}

func (s *CompilerService) setupProject(dir, code string) error {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	csproj := `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>disable</Nullable><LangVersion>latest</LangVersion></PropertyGroup></Project>`
	if err := os.WriteFile(filepath.Join(dir, "app.csproj"), []byte(csproj), 0644); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "Program.cs"), []byte(code), 0644)
}

func (s *CompilerService) buildProject(dir string, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "dotnet", "build", "-c", "Release", "--verbosity", "q", dir)
	cmd.Env = s.buildEnv(dir)
	var out bytes.Buffer
	cmd.Stdout, cmd.Stderr = &out, &out
	if err := cmd.Run(); err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return fmt.Errorf("⏱️ Превышено время компиляции")
		}
		msg := strings.TrimSpace(out.String())
		if msg == "" {
			msg = err.Error()
		}
		return fmt.Errorf("❌ Ошибка компиляции:\n%s", msg)
	}
	return nil
}

func (s *CompilerService) executeProject(dir, input string, timeout time.Duration, start time.Time, cached bool) CompilationResult {
	dll := filepath.Join(dir, "bin", "Release", "net8.0", "app.dll")
	res := CompilationResult{CacheHit: cached}
	if !s.useSandbox {
		return s.runLocal(dll, input, timeout, start, res)
	}
	return s.runDocker(dir, input, timeout, start, res)
}

func (s *CompilerService) runLocal(dll, input string, timeout time.Duration, start time.Time, res CompilationResult) CompilationResult {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "dotnet", "exec", dll)
	cmd.Stdin = strings.NewReader(input)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr

	runStart := time.Now()
	runErr := cmd.Run()
	res.RunMs = time.Since(runStart).Milliseconds()
	res.TimeMs = time.Since(start).Milliseconds()

	outStr := strings.TrimSpace(stdout.String())
	errStr := strings.TrimSpace(stderr.String())
	if runErr != nil {
		if ctx.Err() == context.DeadlineExceeded {
			res.Error = "⏱️ Превышено время выполнения"
		} else {
			res.Error = "⚠️ Ошибка: " + strings.TrimSpace(errStr+" "+outStr)
		}
		return res
	}

	res.Success = true
	res.Output = outStr
	return res
}

func (s *CompilerService) runDocker(dir, input string, timeout time.Duration, start time.Time, res CompilationResult) CompilationResult {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	args := []string{
		"run", "--rm", "--network=none",
		"--memory=128m", "--cpus=0.5", "--pids-limit=20",
		"--read-only", "--tmpfs=/tmp:rw,size=50m",
		"--security-opt=no-new-privileges:true", "--cap-drop=ALL",
		"-v", dir + ":/app:ro",
		"-w", "/app",
		"mcr.microsoft.com/dotnet/runtime:8.0-alpine",
		"dotnet", "exec", "/app/bin/Release/net8.0/app.dll",
	}

	cmd := exec.CommandContext(ctx, "docker", args...)
	cmd.Stdin = strings.NewReader(input)
	cmd.Env = s.buildEnv(dir)

	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr

	runStart := time.Now()
	runErr := cmd.Run()
	res.RunMs = time.Since(runStart).Milliseconds()
	res.TimeMs = time.Since(start).Milliseconds()

	outStr := strings.TrimSpace(stdout.String())
	errStr := strings.TrimSpace(stderr.String())
	if runErr != nil {
		if ctx.Err() == context.DeadlineExceeded {
			res.Error = "⏱️ Превышено время выполнения"
		} else {
			res.Error = "⚠️ Ошибка: " + strings.TrimSpace(errStr+" "+outStr)
		}
		return res
	}

	res.Success = true
	res.Output = outStr
	return res
}

func (s *CompilerService) buildEnv(dir string) []string {
	env := os.Environ()
	return append(env,
		"DOTNET_NOLOGO=1",
		"DOTNET_CLI_TELEMETRY_OPTOUT=1",
		"DOTNET_CLI_HOME="+filepath.Join(dir, ".dotnet-cli"),
	)
}
