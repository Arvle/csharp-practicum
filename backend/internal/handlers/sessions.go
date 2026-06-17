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
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func CreateSession(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "teachers only")
			return
		}

		var req models.CreateSessionRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid body")
			return
		}
		req.Title = strings.TrimSpace(req.Title)
		if req.Title == "" {
			writeJSONError(w, http.StatusBadRequest, "title required")
			return
		}

		b := make([]byte, 16)
		if _, err := rand.Read(b); err != nil {
			writeJSONError(w, http.StatusInternalServerError, "token generation failed")
			return
		}
		token := hex.EncodeToString(b)

		var exp *time.Time
		if req.ExpiresHours > 0 {
			t := time.Now().Add(time.Duration(req.ExpiresHours) * time.Hour)
			exp = &t
		}

		var s models.Session
		err := db.QueryRow(`
			INSERT INTO sessions (title, invite_token, teacher_id, ends_at)
			VALUES ($1,$2,$3,$4)
			RETURNING id, title, invite_token, teacher_id, starts_at, ends_at, is_active, created_at`,
			req.Title, token, u.UserID, exp,
		).Scan(&s.ID, &s.Title, &s.InviteToken, &s.TeacherID, &s.StartsAt, &s.EndsAt, &s.IsActive, &s.CreatedAt)
		if err != nil {
			log.Printf("CreateSession: DB error for teacher_id=%d: %v", u.UserID, err)
			writeJSONError(w, http.StatusInternalServerError, "create failed")
			return
		}

		writeJSON(w, http.StatusCreated, s)
	}
}

func GetTeacherSessions(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}

		rows, err := db.Query(`
			SELECT id, title, invite_token, teacher_id, starts_at, ends_at, is_active, created_at
			FROM sessions
			WHERE teacher_id = $1
			ORDER BY created_at DESC`, u.UserID)
		if err != nil {
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		defer rows.Close()

		list := make([]models.Session, 0)
		for rows.Next() {
			var s models.Session
			if err := rows.Scan(&s.ID, &s.Title, &s.InviteToken, &s.TeacherID, &s.StartsAt, &s.EndsAt, &s.IsActive, &s.CreatedAt); err != nil {
				log.Printf("GetTeacherSessions: scan failed: %v", err)
				writeJSONError(w, http.StatusInternalServerError, "db error")
				return
			}
			list = append(list, s)
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetTeacherSessions: rows failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		writeJSON(w, http.StatusOK, list)
	}
}

func RevokeSession(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}

		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil || id <= 0 {
			writeJSONError(w, http.StatusBadRequest, "invalid session id")
			return
		}

		res, err := db.Exec("UPDATE sessions SET is_active = false WHERE id = $1 AND teacher_id = $2", id, u.UserID)
		if err != nil {
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		if n, _ := res.RowsAffected(); n == 0 {
			writeJSONError(w, http.StatusNotFound, "session not found")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func GetSessionParticipantsCount(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}

		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil || id <= 0 {
			writeJSONError(w, http.StatusBadRequest, "invalid session id")
			return
		}

		var count int
		err = db.QueryRow(`
			SELECT COUNT(*) FROM session_participants
			WHERE session_id = $1
			AND EXISTS(SELECT 1 FROM sessions WHERE id = $1 AND teacher_id = $2)
		`, id, u.UserID).Scan(&count)
		if err != nil {
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		writeJSON(w, http.StatusOK, map[string]int{"count": count})
	}
}

func GetSessionParticipants(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}

		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil || id <= 0 {
			writeJSONError(w, http.StatusBadRequest, "invalid session id")
			return
		}

		rows, err := db.Query(`
			SELECT u.id, u.full_name, sp.joined_at
			FROM session_participants sp
			JOIN users u ON u.id = sp.user_id
			WHERE sp.session_id = $1
			  AND EXISTS(SELECT 1 FROM sessions se WHERE se.id = sp.session_id AND se.teacher_id = $2)
			ORDER BY sp.joined_at ASC, u.full_name ASC`, id, u.UserID)
		if err != nil {
			log.Printf("GetSessionParticipants: query failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		defer rows.Close()

		type participant struct {
			ID       int       `json:"id"`
			FullName string    `json:"fullName"`
			JoinedAt time.Time `json:"joinedAt"`
		}

		list := make([]participant, 0)
		for rows.Next() {
			var p participant
			if err := rows.Scan(&p.ID, &p.FullName, &p.JoinedAt); err != nil {
				log.Printf("GetSessionParticipants: scan failed: %v", err)
				writeJSONError(w, http.StatusInternalServerError, "db error")
				return
			}
			list = append(list, p)
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetSessionParticipants: rows failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		writeJSON(w, http.StatusOK, list)
	}
}
