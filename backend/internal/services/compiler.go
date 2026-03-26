package services

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

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
	cacheDir string
	cache    map[string]string // code hash → publish directory with app.dll
}

func NewCompilerService() *CompilerService {
	cacheDir, _ := os.MkdirTemp("", "csharp-run-cache-*")

	return &CompilerService{
		cacheDir: cacheDir,
		cache:    make(map[string]string),
	}
}

func (s *CompilerService) CompileAndRun(code string, timeout time.Duration) CompilationResult {
	start := time.Now()

	if _, err := exec.LookPath("dotnet"); err != nil {
		return CompilationResult{
			Success: false,
			Error:   "dotnet SDK не найден в PATH. Установите .NET 8+ SDK.",
			TimeMs:  time.Since(start).Milliseconds(),
		}
	}

	codeHash := hashCode(code)

	if pubDir, ok := s.cache[codeHash]; ok {
		if _, err := os.Stat(filepath.Join(pubDir, "app.dll")); err == nil {
			result := s.runPublished(pubDir, timeout, start)
			result.CacheHit = true
			result.CompileMs = 0
			return result
		}
		delete(s.cache, codeHash)
	}

	compileStart := time.Now()
	pubDir, err := s.publishNative(code, codeHash, timeout)
	compileTime := time.Since(compileStart).Milliseconds()

	if err != nil {
		return CompilationResult{
			Success:   false,
			Error:     err.Error(),
			TimeMs:    time.Since(start).Milliseconds(),
			CompileMs: compileTime,
		}
	}

	s.cache[codeHash] = pubDir

	result := s.runPublished(pubDir, timeout, start)
	result.CompileMs = compileTime
	result.CacheHit = false

	return result
}

func (s *CompilerService) publishNative(code, codeHash string, timeout time.Duration) (string, error) {
	tmpDir, err := os.MkdirTemp("", "csharp-compile-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmpDir)

	projectDir := filepath.Join(tmpDir, "project")
	if err := os.MkdirAll(projectDir, 0755); err != nil {
		return "", err
	}

	pubDir := filepath.Join(s.cacheDir, codeHash+"-out")
	_ = os.RemoveAll(pubDir)
	if err := os.MkdirAll(pubDir, 0755); err != nil {
		return "", err
	}

	csproj := `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>disable</ImplicitUsings>
    <Nullable>disable</Nullable>
    <RollForward>LatestMajor</RollForward>
  </PropertyGroup>
</Project>`

	if err := os.WriteFile(filepath.Join(projectDir, "app.csproj"), []byte(csproj), 0644); err != nil {
		return "", err
	}

	program := fmt.Sprintf(`
using System;

class Program
{
    static void Main()
    {
        try
        {
            %s
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERROR: " + ex.Message);
        }
    }
}
`, code)

	if err := os.WriteFile(filepath.Join(projectDir, "Program.cs"), []byte(program), 0644); err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "dotnet", "publish",
		"-c", "Release",
		"-o", pubDir,
		"--verbosity", "minimal")
	cmd.Dir = projectDir

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(out.String())
		if msg == "" {
			msg = err.Error()
		}
		_ = os.RemoveAll(pubDir)
		return "", fmt.Errorf("compilation failed: %w\n%s", err, msg)
	}

	dllPath := filepath.Join(pubDir, "app.dll")
	if _, err := os.Stat(dllPath); err != nil {
		_ = os.RemoveAll(pubDir)
		return "", fmt.Errorf("после publish не найден app.dll в %s", pubDir)
	}

	return pubDir, nil
}

func (s *CompilerService) runPublished(pubDir string, timeout time.Duration, start time.Time) CompilationResult {
	runStart := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	dllPath := filepath.Join(pubDir, "app.dll")
	absDLL, err := filepath.Abs(dllPath)
	if err != nil {
		return CompilationResult{
			Success: false,
			Error:   err.Error(),
			TimeMs:  time.Since(start).Milliseconds(),
			RunMs:   0,
		}
	}

	cmd := exec.CommandContext(ctx, "dotnet", absDLL)
	cmd.Dir = pubDir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()
	runTime := time.Since(runStart).Milliseconds()

	result := CompilationResult{
		TimeMs: time.Since(start).Milliseconds(),
		RunMs:  runTime,
	}

	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			result.Error = fmt.Sprintf("Превышено время выполнения (%v)", timeout)
		} else {
			result.Error = strings.TrimSpace(stderr.String())
			if result.Error == "" {
				result.Error = strings.TrimSpace(stdout.String())
			}
			if result.Error == "" {
				result.Error = err.Error()
			}
		}
		result.Success = false
		return result
	}

	result.Success = true
	combined := strings.TrimSpace(stdout.String())
	if combined == "" {
		combined = strings.TrimSpace(stderr.String())
	}
	result.Output = combined
	return result
}

func hashCode(code string) string {
	hash := 0
	for i := 0; i < len(code); i++ {
		hash = (hash << 5) - hash + int(code[i])
	}
	return fmt.Sprintf("%x", hash)
}
