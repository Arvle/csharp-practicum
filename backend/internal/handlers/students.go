package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"database/sql"
	"encoding/json"
	"net/http"
)

func GetStudents(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserFromContext(r)
		if claims == nil || claims.Role != "teacher" {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}
		rows, err := db.Query(`
			SELECT id, username, full_name, student_id, group_name
			FROM users
			WHERE role = 'student' AND group_name = $1
			ORDER BY COALESCE(group_name, ''), COALESCE(full_name, username)
		`, claims.Group)
		if err != nil {
			http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var list []models.StudentPublic
		for rows.Next() {
			var s models.StudentPublic
			if err := rows.Scan(&s.ID, &s.Username, &s.FullName, &s.StudentID, &s.Group); err != nil {
				http.Error(w, `{"error":"Failed to read students"}`, http.StatusInternalServerError)
				return
			}
			list = append(list, s)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(list)
	}
}
