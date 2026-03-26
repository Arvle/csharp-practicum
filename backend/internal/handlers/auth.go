package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func StudentLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.StudentLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if req.StudentID == "" || req.FullName == "" || req.Group == "" {
			http.Error(w, `{"error": "All fields are required"}`, http.StatusBadRequest)
			return
		}

		var user models.User
		err := db.QueryRow(`
			SELECT id, username, role, full_name, group_name, password_hash
			FROM users
			WHERE student_id = ? AND role = 'student'
		`, req.StudentID).Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group, &user.PasswordHash)

		if err == sql.ErrNoRows {
			plainPassword := req.StudentID
			hashed, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
			if err != nil {
				http.Error(w, `{"error": "Failed to create user"}`, http.StatusInternalServerError)
				return
			}

			var id int64
			err = db.QueryRow(`
				INSERT INTO users (username, password_hash, role, full_name, student_id, group_name, created_at, last_login_at)
				VALUES (?, ?, 'student', ?, ?, ?, ?, ?)
				RETURNING id
			`, req.StudentID, string(hashed), req.FullName, req.StudentID, req.Group, time.Now(), time.Now()).Scan(&id)

			if err != nil {
				http.Error(w, `{"error": "Failed to create user"}`, http.StatusInternalServerError)
				return
			}

			user.ID = int(id)
			user.Username = req.StudentID
			user.Role = "student"
			user.FullName = &req.FullName
			user.Group = &req.Group
			user.PasswordHash = string(hashed)
		} else if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		} else {
			if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.StudentID)); err != nil {
				http.Error(w, `{"error": "Invalid credentials"}`, http.StatusUnauthorized)
				return
			}
			
			_, err = db.Exec("UPDATE users SET last_login_at = ? WHERE id = ?", time.Now(), user.ID)
			if err != nil {
				
			}
		}

		token, err := middleware.GenerateToken(user.ID, user.Username, user.Role)
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

		validCode := os.Getenv("TEACHER_ACCESS_CODE")
		if validCode == "" {
			validCode = "teacher_2026" 
		}
		if req.AccessCode != validCode {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid access code"})
			return
		}

		var user models.User
		err := db.QueryRow(`
			SELECT id, username, role, full_name, group_name, password_hash
			FROM users
			WHERE role = 'teacher' AND username = ?
		`, "teacher").Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group, &user.PasswordHash)

		if err == sql.ErrNoRows {
			plainPassword := "teacher_default"
			hashed, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
			if err != nil {
				http.Error(w, `{"error": "Failed to create teacher"}`, http.StatusInternalServerError)
				return
			}

			fullName := "Преподаватель"
			group := req.Group
			var id int64
			err = db.QueryRow(`
				INSERT INTO users (username, password_hash, role, full_name, group_name, created_at, last_login_at)
				VALUES (?, ?, 'teacher', ?, ?, ?, ?)
				RETURNING id
			`, "teacher", string(hashed), fullName, group, time.Now(), time.Now()).Scan(&id)

			if err != nil {
				http.Error(w, `{"error": "Failed to create teacher"}`, http.StatusInternalServerError)
				return
			}

			user.ID = int(id)
			user.Username = "teacher"
			user.Role = "teacher"
			user.FullName = &fullName
			user.Group = &group
			user.PasswordHash = string(hashed)
		} else if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		} else {
			if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte("teacher_default")); err != nil {
				http.Error(w, `{"error": "Invalid credentials"}`, http.StatusUnauthorized)
				return
			}
			_, err = db.Exec("UPDATE users SET last_login_at = ? WHERE id = ?", time.Now(), user.ID)
		}

		token, err := middleware.GenerateToken(user.ID, user.Username, user.Role)
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