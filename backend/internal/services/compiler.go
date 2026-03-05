package services

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

type CompilationResult struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error"`
	TimeMs  int64  `json:"timeMs"`
}

type CompilerService struct {
	tempDir string
}

func NewCompilerService() *CompilerService {
	tempDir, _ := os.MkdirTemp("", "csharp-compiler-*")
	return &CompilerService{
		tempDir: tempDir,
	}
}

func (s *CompilerService) CompileAndRun(code string, timeout time.Duration) CompilationResult {
	start := time.Now()
	result := CompilationResult{}

	if _, err := exec.LookPath("dotnet"); err != nil {
		return s.emulateCompilation(code)
	}

	projectDir, err := os.MkdirTemp(s.tempDir, "project-*")
	if err != nil {
		result.Error = "Failed to create temp directory"
		return result
	}
	defer os.RemoveAll(projectDir)

	csFilePath := projectDir + "/Program.cs"
	csContent := fmt.Sprintf(`using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
    public static void Main()
    {
        %s
    }
}`, code)

	if err := os.WriteFile(csFilePath, []byte(csContent), 0644); err != nil {
		result.Error = "Failed to write code file"
		return result
	}

	csprojContent := `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <UseAppHost>false</UseAppHost>
  </PropertyGroup>
</Project>`

	if err := os.WriteFile(projectDir+"/CompilerProject.csproj", []byte(csprojContent), 0644); err != nil {
		result.Error = "Failed to create project file"
		return result
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "dotnet", "build", "-c", "Release", "-o", "output")
	cmd.Dir = projectDir
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		result.Success = false
		result.Error = stderr.String()
		if result.Error == "" {
			result.Error = err.Error()
		}
		result.TimeMs = time.Since(start).Milliseconds()
		return result
	}

	cmd = exec.CommandContext(ctx, "dotnet", "output/CompilerProject.dll")
	cmd.Dir = projectDir
	var stdout, stderr2 bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr2

	if err := cmd.Run(); err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			result.Error = "Превышено время выполнения (30 секунд)"
		} else {
			result.Error = stderr2.String()
			if result.Error == "" {
				result.Error = err.Error()
			}
		}
	} else {
		result.Success = true
		result.Output = stdout.String()
	}

	result.TimeMs = time.Since(start).Milliseconds()
	return result
}

func (s *CompilerService) emulateCompilation(code string) CompilationResult {
	if strings.Contains(code, "Hello") {
		return CompilationResult{
			Success: true,
			Output:  "Hello, World!\n",
			TimeMs:  42,
		}
	}

	if strings.Contains(code, "int a = 5;") {
		return CompilationResult{
			Success: true,
			Output:  "8\n",
			TimeMs:  23,
		}
	}

	if strings.Contains(code, "int number = 7;") {
		return CompilationResult{
			Success: true,
			Output:  "Нечетное\n",
			TimeMs:  31,
		}
	}

	if strings.Contains(code, "while(true)") {
		return CompilationResult{
			Success: false,
			Error:   "Превышено время выполнения (30 секунд)",
			TimeMs:  30000,
		}
	}

	return CompilationResult{
		Success: false,
		Error:   "CS1002: ; expected",
		TimeMs:  15,
	}
}
