package handlers

import (
	"CSharpPracticumGo/internal/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

func StudentLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.StudentLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if req.StudentID == "" || req.FullName == "" || req.Group == "" {
			http.Error(w, `{"error": "Все поля обязательны"}`, http.StatusBadRequest)
			return
		}

		var user models.User
		err := db.QueryRow(`
            SELECT id, username, role, full_name, group_name 
            FROM users 
            WHERE student_id = $1 AND role = 'student'
        `, req.StudentID).Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group)

		if err == sql.ErrNoRows {
			var id int64
			err = db.QueryRow(`
                INSERT INTO users (username, email, password_hash, role, full_name, student_id, group_name, last_login_at)
                VALUES ($1, $2, $3, 'student', $4, $5, $6, $7)
                RETURNING id
            `, req.StudentID, req.StudentID+"@student.local", "student123", req.FullName, req.StudentID, req.Group, time.Now()).Scan(&id)

			if err != nil {
				http.Error(w, `{"error": "Failed to create user"}`, http.StatusInternalServerError)
				return
			}

			user.ID = int(id)
			user.Username = req.StudentID
			user.Role = "student"
			user.FullName = &req.FullName
			user.Group = &req.Group
		} else if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		} else {
			db.Exec("UPDATE users SET last_login_at = $1 WHERE id = $2", time.Now(), user.ID)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.LoginResponse{
			ID:       user.ID,
			Username: user.Username,
			Role:     user.Role,
			FullName: user.FullName,
			Group:    user.Group,
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

		validCodes := map[string]bool{
			"teacher_2026": true,
			"admin":        true,
			"teacher123":   true,
		}

		if !validCodes[req.AccessCode] {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Неверный код доступа"})
			return
		}

		var user models.User
		err := db.QueryRow(`
            SELECT id, username, role, full_name, group_name
            FROM users 
            WHERE role = 'teacher' LIMIT 1
        `).Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group)

		if err == sql.ErrNoRows {
			fullName := "Преподаватель"
			group := req.Group
			var id int64
			err = db.QueryRow(`
                INSERT INTO users (username, password_hash, role, full_name, group_name, last_login_at)
                VALUES ($1, $2, 'teacher', $3, $4, $5)
                RETURNING id
            `, "teacher", "teacher_2026", fullName, group, time.Now()).Scan(&id)

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
			db.Exec("UPDATE users SET last_login_at = $1 WHERE id = $2", time.Now(), user.ID)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.LoginResponse{
			ID:       user.ID,
			Username: user.Username,
			Role:     user.Role,
			FullName: user.FullName,
			Group:    user.Group,
		})
	}
}
