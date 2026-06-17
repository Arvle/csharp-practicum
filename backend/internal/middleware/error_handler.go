package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime/debug"
)

type HTTPError struct {
	StatusCode int    `json:"-"`
	Code       string `json:"code"`
	Message    string `json:"message"`
	Details    string `json:"details,omitempty"`
}

func (e *HTTPError) Error() string {
	return e.Message
}

func ErrorHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				stackTrace := string(debug.Stack())
				fmt.Printf("PANIC: %v\n%s\n", err, stackTrace)

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error":   "internal server error",
					"code":    "INTERNAL_ERROR",
					"details": "An unexpected error occurred. Please try again later.",
				})
			}
		}()

		next.ServeHTTP(w, r)
	})
}
