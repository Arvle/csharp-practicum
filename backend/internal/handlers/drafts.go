package handlers

import (
	"CSharpPracticum/internal/middleware"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type draftResponse struct {
	AssignmentID int       `json:"assignmentId"`
	Code         string    `json:"code"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func GetDraft(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "student" || u.SessionID == nil {
			writeJSONError(w, http.StatusForbidden, "students only")
			return
		}

		assignmentID, err := strconv.Atoi(chi.URLParam(r, "assignmentID"))
		if err != nil || assignmentID <= 0 {
			writeJSONError(w, http.StatusBadRequest, "invalid assignment id")
			return
		}

		if !studentAssignmentExists(db, assignmentID, *u.SessionID) {
			writeJSONError(w, http.StatusNotFound, "assignment not found")
			return
		}

		var draft draftResponse
		err = db.QueryRow(`
			SELECT assignment_id, code, updated_at
			FROM student_drafts
			WHERE assignment_id = $1 AND user_id = $2 AND session_id = $3`,
			assignmentID, u.UserID, *u.SessionID,
		).Scan(&draft.AssignmentID, &draft.Code, &draft.UpdatedAt)

		if err == sql.ErrNoRows {
			writeJSON(w, http.StatusOK, map[string]any{"assignmentId": assignmentID, "code": ""})
			return
		}
		if err != nil {
			log.Printf("GetDraft: query failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		writeJSON(w, http.StatusOK, draft)
	}
}

func SaveDraft(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "student" || u.SessionID == nil {
			writeJSONError(w, http.StatusForbidden, "students only")
			return
		}

		assignmentID, err := strconv.Atoi(chi.URLParam(r, "assignmentID"))
		if err != nil || assignmentID <= 0 {
			writeJSONError(w, http.StatusBadRequest, "invalid assignment id")
			return
		}

		var req struct {
			Code string `json:"code"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid body")
			return
		}

		if !studentAssignmentExists(db, assignmentID, *u.SessionID) {
			writeJSONError(w, http.StatusNotFound, "assignment not found")
			return
		}

		var draft draftResponse
		err = db.QueryRow(`
			INSERT INTO student_drafts (assignment_id, user_id, session_id, code, updated_at)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (assignment_id, user_id, session_id)
			DO UPDATE SET code = EXCLUDED.code, updated_at = NOW()
			RETURNING assignment_id, code, updated_at`,
			assignmentID, u.UserID, *u.SessionID, req.Code,
		).Scan(&draft.AssignmentID, &draft.Code, &draft.UpdatedAt)
		if err != nil {
			log.Printf("SaveDraft: upsert failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		writeJSON(w, http.StatusOK, draft)
	}
}

func studentAssignmentExists(db *sql.DB, assignmentID int, sessionID int) bool {
	var exists bool
	err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM assignments WHERE id = $1 AND session_id = $2)`, assignmentID, sessionID).Scan(&exists)
	return err == nil && exists
}
