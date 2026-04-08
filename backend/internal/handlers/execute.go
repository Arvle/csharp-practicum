package handlers

import (
	"CSharpPracticum/internal/services"
	"encoding/json"
	"net/http"
	"time"
)

func ExecuteCode() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Code  string `json:"code"`
			Input string `json:"input"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
			return
		}

		compiler := services.NewCompilerService()
		timeout := 30 * time.Second
		result := compiler.CompileAndRun(req.Code, req.Input, timeout)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(result)
	}
}
