package middleware

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
)

// ValidateStudentID проверяет формат student ID
func ValidateStudentID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			StudentID string `json:"studentId"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "invalid request body",
			})
			return
		}

		// Student ID: 3-20 символов, только буквы и цифры
		validPattern := regexp.MustCompile(`^[a-zA-Z0-9]{3,20}$`)
		if !validPattern.MatchString(strings.TrimSpace(req.StudentID)) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "studentId must be 3-20 alphanumeric characters",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ValidateGroup проверяет формат названия группы
func ValidateGroup(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Group string `json:"group"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "invalid request body",
			})
			return
		}

		// Группа: 3-30 символов, буквы, цифры и дефисы
		validPattern := regexp.MustCompile(`^[a-zA-Z0-9\-]{3,30}$`)
		if !validPattern.MatchString(strings.TrimSpace(req.Group)) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "group must be 3-30 alphanumeric characters or hyphens",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}
