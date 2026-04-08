package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"
)

func StudentLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.StudentLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if strings.TrimSpace(req.StudentID) == "" {
			http.Error(w, `{"error": "studentId is required"}`, http.StatusBadRequest)
			return
		}

		var user models.User
		err := db.QueryRow(`
			SELECT id, username, role, full_name, group_name
			FROM users
			WHERE student_id = $1 AND role = 'student'
		`, strings.TrimSpace(req.StudentID)).Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group)

		if err == sql.ErrNoRows {
			http.Error(w, `{"error": "Student not found. Contact teacher."}`, http.StatusUnauthorized)
			return
		}
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
		_, _ = db.Exec("UPDATE users SET last_login_at = $1 WHERE id = $2", time.Now(), user.ID)

		group := ""
		if user.Group != nil {
			group = *user.Group
		}
		token, err := middleware.GenerateToken(user.ID, user.Username, user.Role, group)
		if err != nil {
			http.Error(w, `{"error": "Failed to generate token"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token": token,
			"user": models.LoginResponse{
				ID:       user.ID,
				Username: user.Username,
				Role:     user.Role,
				FullName: user.FullName,
				Group:    user.Group,
			},
		})
	}
}

func TeacherLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.TeacherLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		validCode := strings.TrimSpace(os.Getenv("TEACHER_ACCESS_CODE"))
		if validCode == "" {
			validCode = "teacher_2026"
		}
		if strings.TrimSpace(req.AccessCode) != validCode {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Invalid access code"})
			return
		}

		var user models.User
		err := db.QueryRow(`
			SELECT id, username, role, full_name, group_name
			FROM users
			WHERE role = 'teacher' AND username = $1
		`, "teacher").Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group)

		if err == sql.ErrNoRows {
			fullName := "Преподаватель"
			group := req.Group
			var id int64
			err = db.QueryRow(`
				INSERT INTO users (username, role, full_name, group_name, created_at, last_login_at)
				VALUES ($1, 'teacher', $2, $3, $4, $5)
				RETURNING id
			`, "teacher", fullName, group, time.Now(), time.Now()).Scan(&id)

			if err != nil {
				http.Error(w, `{"error": "Failed to create teacher"}`, http.StatusInternalServerError)
				return
			}

			user.ID = int(id)
			user.Username = "teacher"
			user.Role = "teacher"
			user.FullName = &fullName
			user.Group = &group
		} else if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		} else {
			_, err = db.Exec("UPDATE users SET group_name = $1, last_login_at = $2 WHERE id = $3", req.Group, time.Now(), user.ID)
			user.Group = &req.Group
		}

		group := ""
		if user.Group != nil {
			group = *user.Group
		}
		token, err := middleware.GenerateToken(user.ID, user.Username, user.Role, group)
		if err != nil {
			http.Error(w, `{"error": "Failed to generate token"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token": token,
			"user": models.LoginResponse{
				ID:       user.ID,
				Username: user.Username,
				Role:     user.Role,
				FullName: user.FullName,
				Group:    user.Group,
			},
		})
	}
}
