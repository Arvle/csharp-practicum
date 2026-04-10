package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// hashPassword hashes a password using bcrypt
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// checkPasswordHash compares a password with a hash
func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func StudentLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.StudentLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusBadRequest,
				Code:       "INVALID_REQUEST",
				Message:    "invalid request body",
			})
			return
		}

		if strings.TrimSpace(req.StudentID) == "" {
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusBadRequest,
				Code:       "MISSING_STUDENT_ID",
				Message:    "studentId is required",
			})
			return
		}

		var user models.User
		var passwordHash sql.NullString
		err := db.QueryRow(`
			SELECT id, username, role, full_name, group_name, password_hash
			FROM users
			WHERE student_id = $1 AND role = 'student'
		`, strings.TrimSpace(req.StudentID)).Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group, &passwordHash)

		if err == sql.ErrNoRows {
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusUnauthorized,
				Code:       "STUDENT_NOT_FOUND",
				Message:    "Student not found. Contact teacher.",
			})
			return
		}
		if err != nil {
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusInternalServerError,
				Code:       "DATABASE_ERROR",
				Message:    "Database error",
			})
			return
		}

		// If password hash exists, require password authentication
		if passwordHash.Valid {
			if req.Password == "" {
				middleware.WriteError(w, &middleware.HTTPError{
					StatusCode: http.StatusBadRequest,
					Code:       "MISSING_PASSWORD",
					Message:    "password is required",
				})
				return
			}

			if !checkPasswordHash(req.Password, passwordHash.String) {
				middleware.WriteError(w, &middleware.HTTPError{
					StatusCode: http.StatusUnauthorized,
					Code:       "INVALID_PASSWORD",
					Message:    "invalid password",
				})
				return
			}
		}

		_, _ = db.Exec("UPDATE users SET last_login_at = $1 WHERE id = $2", time.Now(), user.ID)

		group := ""
		if user.Group != nil {
			group = *user.Group
		}
		token, err := middleware.GenerateToken(user.ID, user.Username, user.Role, group)
		if err != nil {
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusInternalServerError,
				Code:       "TOKEN_GENERATION_FAILED",
				Message:    "Failed to generate token",
			})
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
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusBadRequest,
				Code:       "INVALID_REQUEST",
				Message:    "invalid request body",
			})
			return
		}

		validCode := strings.TrimSpace(os.Getenv("TEACHER_ACCESS_CODE"))
		if validCode == "" {
			validCode = "teacher_2026"
		}
		if strings.TrimSpace(req.AccessCode) != validCode {
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusUnauthorized,
				Code:       "INVALID_ACCESS_CODE",
				Message:    "Invalid access code",
			})
			return
		}

		var user models.User
		var passwordHash sql.NullString
		err := db.QueryRow(`
			SELECT id, username, role, full_name, group_name, password_hash
			FROM users
			WHERE role = 'teacher' AND username = $1
		`, "teacher").Scan(&user.ID, &user.Username, &user.Role, &user.FullName, &user.Group, &passwordHash)

		if err == sql.ErrNoRows {
			fullName := "Преподаватель"
			group := req.Group
			
			// Generate a secure default password for teacher
			defaultPassword, err := generateSecureToken(16)
			if err != nil {
				middleware.WriteError(w, &middleware.HTTPError{
					StatusCode: http.StatusInternalServerError,
					Code:       "INTERNAL_ERROR",
					Message:    "Failed to generate credentials",
				})
				return
			}
			
			passwordHashStr, err := hashPassword(defaultPassword)
			if err != nil {
				middleware.WriteError(w, &middleware.HTTPError{
					StatusCode: http.StatusInternalServerError,
					Code:       "INTERNAL_ERROR",
					Message:    "Failed to secure credentials",
				})
				return
			}
			
			var id int64
			err = db.QueryRow(`
				INSERT INTO users (username, role, full_name, group_name, password_hash, created_at, last_login_at)
				VALUES ($1, 'teacher', $2, $3, $4, $5, $6)
				RETURNING id
			`, "teacher", fullName, group, passwordHashStr, time.Now(), time.Now()).Scan(&id)

			if err != nil {
				middleware.WriteError(w, &middleware.HTTPError{
					StatusCode: http.StatusInternalServerError,
					Code:       "DATABASE_ERROR",
					Message:    "Failed to create teacher",
				})
				return
			}

			user.ID = int(id)
			user.Username = "teacher"
			user.Role = "teacher"
			user.FullName = &fullName
			user.Group = &group
			
			// Log the default password (only shown once)
			fmt.Printf("\n========================================\n")
			fmt.Printf("Teacher account created with default password: %s\n", defaultPassword)
			fmt.Printf("IMPORTANT: Save this password securely!\n")
			fmt.Printf("========================================\n\n")
		} else if err != nil {
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusInternalServerError,
				Code:       "DATABASE_ERROR",
				Message:    "Database error",
			})
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
			middleware.WriteError(w, &middleware.HTTPError{
				StatusCode: http.StatusInternalServerError,
				Code:       "TOKEN_GENERATION_FAILED",
				Message:    "Failed to generate token",
			})
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
