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
	cacheDir     string
	cache        map[string]string
	wasmtimePath string
}

func NewCompilerService() *CompilerService {
	cacheDir, _ := os.MkdirTemp("", "wasm-cache-*")

	return &CompilerService{
		cacheDir:     cacheDir,
		cache:        make(map[string]string),
		wasmtimePath: findWasmtime(),
	}
}

func findWasmtime() string {
	if path, err := exec.LookPath("wasmtime"); err == nil {
		return path
	}

	localPaths := []string{
		"./bin/wasmtime",
		"./bin/wasmtime.exe",
		"../bin/wasmtime",
		"../bin/wasmtime.exe",
		"bin/wasmtime",
		"bin/wasmtime.exe",
	}

	for _, p := range localPaths {
		if _, err := os.Stat(p); err == nil {
			absPath, _ := filepath.Abs(p)
			return absPath
		}
	}

	return ""
}

func (s *CompilerService) CompileAndRun(code string, timeout time.Duration) CompilationResult {
	start := time.Now()

	if s.wasmtimePath == "" {
		return CompilationResult{
			Success: false,
			Error:   "WebAssembly runtime not found. Install wasmtime or place it in ./bin/",
			TimeMs:  time.Since(start).Milliseconds(),
		}
	}

	codeHash := hashCode(code)

	if cachedPath, ok := s.cache[codeHash]; ok {
		result := s.runWasm(cachedPath, timeout, start)
		result.CacheHit = true
		result.CompileMs = 0
		return result
	}

	compileStart := time.Now()
	wasmPath, err := s.compileToWasm(code, timeout)
	compileTime := time.Since(compileStart).Milliseconds()

	if err != nil {
		return CompilationResult{
			Success:   false,
			Error:     err.Error(),
			TimeMs:    time.Since(start).Milliseconds(),
			CompileMs: compileTime,
		}
	}

	s.cache[codeHash] = wasmPath

	result := s.runWasm(wasmPath, timeout, start)
	result.CompileMs = compileTime
	result.CacheHit = false

	return result
}

func (s *CompilerService) compileToWasm(code string, timeout time.Duration) (string, error) {
	tmpDir, err := os.MkdirTemp("", "wasm-compile-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmpDir)

	projectDir := filepath.Join(tmpDir, "project")
	if err := os.MkdirAll(projectDir, 0755); err != nil {
		return "", err
	}

	csproj := `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <RuntimeIdentifier>wasi-wasm</RuntimeIdentifier>
    <PublishTrimmed>true</PublishTrimmed>
    <PublishSingleFile>true</PublishSingleFile>
    <WasmEmitSourceMap>false</WasmEmitSourceMap>
    <Optimize>true</Optimize>
    <DebugType>none</DebugType>
    <DebugSymbols>false</DebugSymbols>
  </PropertyGroup>
</Project>`

	if err := os.WriteFile(filepath.Join(projectDir, "app.csproj"), []byte(csproj), 0644); err != nil {
		return "", err
	}

	program := fmt.Sprintf(`
using System;
using System.Collections.Generic;
using System.Linq;

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
		"-r", "wasi-wasm",
		"--self-contained",
		"--no-restore",
		"-p:UseAppHost=false",
		"-p:InvariantGlobalization=true")
	cmd.Dir = projectDir

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("compilation failed: %v\n%s", err, stderr.String())
	}

	wasmPath := filepath.Join(projectDir, "bin/Release/net8.0/wasi-wasm/publish/app.wasm")

	if _, err := os.Stat(wasmPath); err != nil {
		return "", fmt.Errorf("WASM file not found")
	}

	cachedPath := filepath.Join(s.cacheDir, hashCode(code)+".wasm")
	if err := os.Rename(wasmPath, cachedPath); err != nil {
		return "", err
	}

	return cachedPath, nil
}

func (s *CompilerService) runWasm(wasmPath string, timeout time.Duration, start time.Time) CompilationResult {
	runStart := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, s.wasmtimePath,
		"run",
		"--disable-cache",
		"--max-memory=67108864",
		"--max-instances=1",
		"--",
		wasmPath,
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	runTime := time.Since(runStart).Milliseconds()

	result := CompilationResult{
		TimeMs: time.Since(start).Milliseconds(),
		RunMs:  runTime,
	}

	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			result.Error = fmt.Sprintf("Превышено время выполнения (%v)", timeout)
		} else {
			result.Error = stderr.String()
			if result.Error == "" {
				result.Error = err.Error()
			}
		}
		result.Success = false
		return result
	}

	result.Success = true
	result.Output = strings.TrimSpace(stdout.String())
	return result
}

func hashCode(code string) string {
	hash := 0
	for i := 0; i < len(code); i++ {
		hash = (hash << 5) - hash + int(code[i])
	}
	return fmt.Sprintf("%x", hash)
}
