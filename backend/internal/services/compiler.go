package services

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// CompilationResult хранит результат компиляции и выполнения C# кода.
type CompilationResult struct {
	Success   bool   `json:"success"`
	Output    string `json:"output"`
	Error     string `json:"error"`
	TimeMs    int64  `json:"timeMs"`
	CompileMs int64  `json:"compileMs"`
	RunMs     int64  `json:"runMs"`
	CacheHit  bool   `json:"cacheHit"`
}

// CompilerService отвечает за компиляцию и выполнение C# кода.
type CompilerService struct {
	cacheDir string
	cache    map[string]string
	mu       sync.RWMutex
}

// NewCompilerService создаёт новый сервис компиляции с временным кэшем.
func NewCompilerService() *CompilerService {
	cacheDir, err := os.MkdirTemp("", "csharp-run-cache-*")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: failed to create cache dir: %v\n", err)
		cacheDir = os.TempDir()
	}

	return &CompilerService{
		cacheDir: cacheDir,
		cache:    make(map[string]string),
	}
}

// CompileAndRun компилирует и выполняет переданный C# код с указанным вводом.
func (s *CompilerService) CompileAndRun(code, input string, timeout time.Duration) CompilationResult {
	start := time.Now()

	if _, err := exec.LookPath("dotnet"); err != nil {
		return CompilationResult{
			Success: false,
			Error:   "dotnet SDK не найден в PATH. Установите .NET 8+ SDK.",
			TimeMs:  time.Since(start).Milliseconds(),
		}
	}

	// Нормализация кода
	normalized := strings.ReplaceAll(strings.TrimSpace(code), "\r\n", "\n")
	if normalized == "" {
		return CompilationResult{
			Success: false,
			Error:   "Код пустой",
			TimeMs:  0,
		}
	}

	// Определяем, нужно ли оборачивать код
	wrappedCode, needsWrap := prepareCode(normalized)

	// Ключ кэша основан на финальном коде для компиляции
	codeHash := hashCode(wrappedCode)

	s.mu.RLock()
	pubDir, cached := s.cache[codeHash]
	s.mu.RUnlock()

	if cached {
		if _, err := os.Stat(filepath.Join(pubDir, "app.dll")); err == nil {
			result := s.runPublished(pubDir, input, timeout, start)
			result.CacheHit = true
			result.CompileMs = 0
			return result
		}
		s.mu.Lock()
		delete(s.cache, codeHash)
		s.mu.Unlock()
	}

	// Компиляция
	compileStart := time.Now()
	pubDir, compileErr := s.publishNative(wrappedCode, codeHash, timeout)
	compileTime := time.Since(compileStart).Milliseconds()

	if compileErr != nil {
		// Если компиляция не удалась и код был обёрнут, пробуем без обёртки
		if needsWrap {
			pubDir2, compileErr2 := s.publishNative(normalized, hashCode(normalized), timeout)
			if compileErr2 == nil {
				// Эта версия сработала, используем её
				s.mu.Lock()
				s.cache[hashCode(normalized)] = pubDir2
				s.mu.Unlock()

				result := s.runPublished(pubDir2, input, timeout, start)
				result.CompileMs = time.Since(compileStart).Milliseconds()
				result.CacheHit = false
				return result
			}
		}
		// Возвращаем исходную ошибку
		return CompilationResult{
			Success:   false,
			Error:     compileErr.Error(),
			TimeMs:    time.Since(start).Milliseconds(),
			CompileMs: compileTime,
		}
	}

	s.mu.Lock()
	s.cache[codeHash] = pubDir
	s.mu.Unlock()

	result := s.runPublished(pubDir, input, timeout, start)
	result.CompileMs = compileTime
	result.CacheHit = false

	return result
}

// prepareCode определяет, нужно ли оборачивать код в метод Main.
// Возвращает компилируемый код и флаг применения обёртки.
func prepareCode(code string) (string, bool) {
	trimmed := strings.TrimSpace(code)

	// Быстрая проверка: если код содержит "static void Main" или "static async", это полная программа
	isFullProgram := strings.Contains(strings.ToLower(trimmed), "static") &&
		(strings.Contains(strings.ToLower(trimmed), "void main") ||
			strings.Contains(strings.ToLower(trimmed), "task main") ||
			strings.Contains(strings.ToLower(trimmed), "task<int> main"))

	if isFullProgram {
		return trimmed, false
	}

	// Проверяем, есть ли уже класс с методом Main
	// Простая эвристика: ищем "class" и "Main("
	if strings.Contains(trimmed, "class ") && strings.Contains(trimmed, "Main(") {
		return trimmed, false
	}

	// Это фрагмент — оборачиваем
	return wrapInMain(trimmed), true
}

// wrapInMain оборачивает фрагмент кода в полноценную C# программу.
func wrapInMain(code string) string {
	// Проверяем, есть ли уже директивы using
	hasUsing := false
	lines := strings.Split(code, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "using ") {
			hasUsing = true
			break
		}
	}

	// Оборачиваем в try-catch для отлова ошибок времени выполнения
	if hasUsing {
		return fmt.Sprintf(`class Program
{
    static void Main()
    {
        try
        {
%s
        }
        catch (Exception ex)
        {
            Console.WriteLine("⚠️ Ошибка: " + ex.Message);
        }
    }
}
`, code)
	}

	return fmt.Sprintf(`using System;

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
            Console.WriteLine("⚠️ Ошибка: " + ex.Message);
        }
    }
}
`, code)
}

func (s *CompilerService) publishNative(code, codeHash string, timeout time.Duration) (string, error) {
	tmpDir, err := os.MkdirTemp(s.cacheDir, "csharp-compile-")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}

	projectDir := filepath.Join(tmpDir, "project")
	if err := os.MkdirAll(projectDir, 0755); err != nil {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("failed to create project dir: %w", err)
	}

	pubDir := filepath.Join(s.cacheDir, codeHash+"-out")
	_ = os.RemoveAll(pubDir)
	if err := os.MkdirAll(pubDir, 0755); err != nil {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("failed to create publish dir: %w", err)
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
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("failed to write .csproj: %w", err)
	}

	if err := os.WriteFile(filepath.Join(projectDir, "Program.cs"), []byte(code), 0644); err != nil {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("failed to write Program.cs: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "dotnet", "publish",
		"-c", "Release",
		"-o", pubDir,
		"--verbosity", "quiet")
	cmd.Dir = projectDir

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(out.String())
		if msg == "" {
			msg = err.Error()
		}
		os.RemoveAll(tmpDir)
		os.RemoveAll(pubDir)
		return "", fmt.Errorf("compilation failed: %s", msg)
	}

	dllPath := filepath.Join(pubDir, "app.dll")
	if _, err := os.Stat(dllPath); err != nil {
		os.RemoveAll(tmpDir)
		os.RemoveAll(pubDir)
		return "", fmt.Errorf("after publish: app.dll not found")
	}

	os.RemoveAll(tmpDir)
	return pubDir, nil
}

func (s *CompilerService) runPublished(pubDir, input string, timeout time.Duration, start time.Time) CompilationResult {
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
	cmd.Stdin = strings.NewReader(input)

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
