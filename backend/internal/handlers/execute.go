package handlers

import (
	"CSharpPracticum/internal/services"
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

var (
	compilerOnce sync.Once
	compilerSvc  *services.CompilerService
)

func getCompilerService() *services.CompilerService {
	compilerOnce.Do(func() {
		compilerSvc = services.NewCompilerService()
	})
	return compilerSvc
}

func ExecuteCode() http.HandlerFunc {
	return ExecuteCodeWithCompiler(getCompilerService(), 30*time.Second)
}

func ExecuteCodeWithCompiler(compiler *services.CompilerService, timeout time.Duration) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Code  string `json:"code"`
			Input string `json:"input"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		result := compiler.CompileAndRun(req.Code, req.Input, timeout)
		writeJSON(w, http.StatusOK, result)
	}
}
