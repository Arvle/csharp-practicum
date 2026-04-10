package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime/debug"
)

// HTTPError — структурированная ошибка HTTP с кодом и сообщением
type HTTPError struct {
	StatusCode int    `json:"-"` // Не включаем в JSON, используется только для HTTP статуса
	Code       string `json:"code"`
	Message    string `json:"message"`
	Details    string `json:"details,omitempty"`
}

func (e *HTTPError) Error() string {
	return e.Message
}

// ErrorHandler восстанавливает после паник и единообразно обрабатывает ошибки
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

// WriteJSON записывает JSON-ответ с указанным статусом
func WriteJSON(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}

// WriteError записывает структурированную ошибку
func WriteError(w http.ResponseWriter, err *HTTPError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(err.StatusCode)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error":   err.Message,
		"code":    err.Code,
		"details": err.Details,
	})
}
