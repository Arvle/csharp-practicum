package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

func TeacherSetup(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		envToken := strings.TrimSpace(os.Getenv("TEACHER_SETUP_TOKEN"))
		if token != envToken || envToken == "" {
			http.Error(w, `{"error":"invalid setup link"}`, http.StatusForbidden)
			return
		}

		var req models.TeacherSetupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Password == "" {
			http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, `{"error":"hashing failed"}`, http.StatusInternalServerError)
			return
		}

		fullName := strings.TrimSpace(req.FullName)
		if fullName == "" {
			http.Error(w, `{"error":"full name required"}`, http.StatusBadRequest)
			return
		}
		var exists bool
		if err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE role = 'teacher' AND LOWER(TRIM(full_name)) = $1)`, strings.ToLower(fullName)).Scan(&exists); err != nil {
			log.Printf("TeacherSetup lookup error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		if exists {
			http.Error(w, `{"error":"teacher already exists"}`, http.StatusConflict)
			return
		}

		_, err = db.Exec(`INSERT INTO users (role, full_name, password_hash) VALUES ('teacher', $1, $2)`,
			fullName, string(hash))
		if err != nil {
			log.Printf("TeacherSetup DB error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "teacher registered. remove TEACHER_SETUP_TOKEN from .env"})
	}
}

func TeacherLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.TeacherLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Login == "" || req.Password == "" {
			http.Error(w, `{"error":"login and password required"}`, http.StatusBadRequest)
			return
		}

		var teacher models.User
		var hash string
		err := db.QueryRow(`SELECT id, role, full_name, COALESCE(password_hash, '') FROM users WHERE role = 'teacher' AND LOWER(TRIM(full_name)) = $1`,
			strings.ToLower(strings.TrimSpace(req.Login))).
			Scan(&teacher.ID, &teacher.Role, &teacher.FullName, &hash)

		if err == sql.ErrNoRows {
			http.Error(w, `{"error":"teacher not found"}`, http.StatusUnauthorized)
			return
		} else if err != nil {
			log.Printf("TeacherLogin DB error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
			http.Error(w, `{"error":"invalid password"}`, http.StatusUnauthorized)
			return
		}

		token, err := middleware.GenerateToken(teacher.ID, teacher.FullName, teacher.Role, nil)
		if err != nil {
			http.Error(w, `{"error":"token generation failed"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.LoginResponse{Token: token, User: teacher})
	}
}

func JoinSession(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, `{"error":"invite token required"}`, http.StatusBadRequest)
			return
		}

		var req models.JoinSessionRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.FullName == "" {
			http.Error(w, `{"error":"full name required"}`, http.StatusBadRequest)
			return
		}

		var session models.Session
		err := db.QueryRow(`SELECT id, is_active, ends_at FROM sessions WHERE invite_token = $1`, token).
			Scan(&session.ID, &session.IsActive, &session.EndsAt)
		if err == sql.ErrNoRows {
			http.Error(w, `{"error":"link not found"}`, http.StatusNotFound)
			return
		}
		if err != nil {
			log.Printf("JoinSession: session lookup error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		if !session.IsActive || (session.EndsAt != nil && time.Now().After(*session.EndsAt)) {
			http.Error(w, `{"error":"link expired or revoked"}`, http.StatusGone)
			return
		}

		name := strings.TrimSpace(req.FullName)
		tx, err := db.BeginTx(r.Context(), nil)
		if err != nil {
			log.Printf("JoinSession: transaction start error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		var user models.User
		err = tx.QueryRow(`
			SELECT u.id, u.role, u.full_name
			FROM users u
			JOIN session_participants sp ON sp.user_id = u.id
			WHERE sp.session_id = $1
			  AND u.role = 'student'
			  AND LOWER(TRIM(u.full_name)) = $2
			LIMIT 1`, session.ID, strings.ToLower(name)).
			Scan(&user.ID, &user.Role, &user.FullName)

		if err == sql.ErrNoRows {
			err = tx.QueryRow(`INSERT INTO users (role, full_name) VALUES ('student', $1) RETURNING id, role, full_name`, name).
				Scan(&user.ID, &user.Role, &user.FullName)
		}
		if err != nil {
			log.Printf("JoinSession: user create/lookup error for %q: %v", name, err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(`INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, session.ID, user.ID)
		if err != nil {
			log.Printf("JoinSession: participant insert error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		if err = tx.Commit(); err != nil {
			log.Printf("JoinSession: transaction commit error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		sid := session.ID
		tokenStr, err := middleware.GenerateToken(user.ID, user.FullName, user.Role, &sid)
		if err != nil {
			log.Printf("JoinSession: token generation error: %v", err)
			http.Error(w, `{"error":"token generation failed"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.LoginResponse{Token: tokenStr, User: user})
	}
}

func RefreshSessionToken(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}

		sessionID, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, `{"error":"invalid session id"}`, http.StatusBadRequest)
			return
		}

		var oldToken string
		err = db.QueryRow(`
			SELECT invite_token FROM sessions 
			WHERE id = $1 AND teacher_id = $2 AND is_active = true`,
			sessionID, u.UserID).Scan(&oldToken)
		if err == sql.ErrNoRows {
			http.Error(w, `{"error":"session not found"}`, http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		b := make([]byte, 16)
		if _, err := rand.Read(b); err != nil {
			http.Error(w, `{"error":"token generation failed"}`, http.StatusInternalServerError)
			return
		}
		newToken := hex.EncodeToString(b)

		_, err = db.Exec(`UPDATE sessions SET invite_token = $1 WHERE id = $2`, newToken, sessionID)
		if err != nil {
			log.Printf("RefreshSessionToken: update error: %v", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"inviteToken": newToken,
			"message":     "token refreshed",
		})
	}
}
