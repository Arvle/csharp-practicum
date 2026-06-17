package handlers

import (
	"bytes"

	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func GetAssignments(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil {
			writeJSONError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var rows *sql.Rows
		var err error

		if u.Role == "student" {
			if u.SessionID == nil {
				writeJSONError(w, http.StatusBadRequest, "no session context")
				return
			}
			rows, err = db.Query(`
                SELECT id, title, description,
                       COALESCE(initial_code, '') AS initial_code,
                       COALESCE(test_cases, '[]'::jsonb)::text AS test_cases,
                       COALESCE(resources, '[]'::jsonb)::text AS resources,
                       COALESCE(expected_output,'') AS expected_output,
                       session_id, created_at
                FROM assignments
                WHERE session_id = $1
                ORDER BY created_at`, *u.SessionID)
		} else {
			sid, parseErr := strconv.Atoi(r.URL.Query().Get("session_id"))
			if parseErr != nil || sid <= 0 {
				writeJSONError(w, http.StatusBadRequest, "session_id required")
				return
			}
			rows, err = db.Query(`
                SELECT id, title, description,
                       COALESCE(initial_code, ''),
                       COALESCE(test_cases, '[]'::jsonb)::text,
                       COALESCE(resources, '[]'::jsonb)::text,
                       COALESCE(expected_output,''),
                       session_id, created_at
                FROM assignments
                WHERE session_id = $1
                  AND EXISTS(SELECT 1 FROM sessions WHERE id = $1 AND teacher_id = $2)
                ORDER BY created_at`, sid, u.UserID)
		}

		if err != nil {
			log.Printf("GetAssignments: DB error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		defer rows.Close()

		list := make([]models.Assignment, 0)
		for rows.Next() {
			var a models.Assignment
			if err := rows.Scan(&a.ID, &a.Title, &a.Description, &a.InitialCode, &a.TestCases, &a.Resources, &a.ExpectedOutput, &a.SessionID, &a.CreatedAt); err != nil {
				log.Printf("GetAssignments: scan error: %v", err)
				writeJSONError(w, http.StatusInternalServerError, "db error")
				return
			}
			list = append(list, a)
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetAssignments: rows error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		writeJSON(w, http.StatusOK, list)
	}
}

func normalizeAssignmentPayload(a *models.Assignment) (string, string, error) {
	a.Title = strings.TrimSpace(a.Title)
	a.Description = strings.TrimSpace(a.Description)
	if a.Title == "" || a.Description == "" || a.SessionID == 0 {
		return "", "", fmt.Errorf("title, description and session_id required")
	}

	testCasesJSON := "[]"
	if strings.TrimSpace(a.TestCases) != "" {
		var tc []models.TestCase
		if err := json.Unmarshal([]byte(a.TestCases), &tc); err != nil {
			return "", "", fmt.Errorf("invalid test_cases JSON")
		}
		testCasesJSON = a.TestCases
	}

	resourcesJSON := "[]"
	if strings.TrimSpace(a.Resources) != "" {
		var res []models.Resource
		if err := json.Unmarshal([]byte(a.Resources), &res); err != nil {
			return "", "", fmt.Errorf("invalid resources JSON")
		}
		resourcesJSON = a.Resources
	}

	return testCasesJSON, resourcesJSON, nil
}

func CreateAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}

		var a models.Assignment
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			log.Printf("CreateAssignment: decode error: %v", err)
			writeJSONError(w, http.StatusBadRequest, "invalid body")
			return
		}

		testCasesJSON, resourcesJSON, err := normalizeAssignmentPayload(&a)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, err.Error())
			return
		}

		var ownsSession bool
		if err := db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM sessions
				WHERE id = $1 AND teacher_id = $2 AND is_active = true
				  AND (ends_at IS NULL OR ends_at > NOW())
			)`, a.SessionID, u.UserID).Scan(&ownsSession); err != nil || !ownsSession {
			writeJSONError(w, http.StatusForbidden, "session is not available")
			return
		}

		initialCode := ""
		if a.InitialCode != nil {
			initialCode = *a.InitialCode
		}
		expectedOutput := ""
		if a.ExpectedOutput != nil {
			expectedOutput = *a.ExpectedOutput
		}

		err = db.QueryRow(`
            INSERT INTO assignments (title, description, initial_code, test_cases, resources, expected_output, session_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING id, created_at`,
			a.Title, a.Description, initialCode, testCasesJSON, resourcesJSON, expectedOutput, a.SessionID,
		).Scan(&a.ID, &a.CreatedAt)
		if err != nil {
			log.Printf("CreateAssignment: DB error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		a.TestCases = testCasesJSON
		a.Resources = resourcesJSON
		writeJSON(w, http.StatusCreated, a)
	}
}

func UpdateAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}

		assignmentID, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid assignment id")
			return
		}

		var a models.Assignment
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid body")
			return
		}

		testCasesJSON, resourcesJSON, err := normalizeAssignmentPayload(&a)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, err.Error())
			return
		}

		initialCode := ""
		if a.InitialCode != nil {
			initialCode = *a.InitialCode
		}
		expectedOutput := ""
		if a.ExpectedOutput != nil {
			expectedOutput = *a.ExpectedOutput
		}

		err = db.QueryRow(`
            UPDATE assignments
            SET title = $1,
                description = $2,
                initial_code = $3,
                test_cases = $4,
                resources = $5,
                expected_output = $6
            WHERE id = $7
              AND session_id = $8
              AND EXISTS(SELECT 1 FROM sessions WHERE id = $8 AND teacher_id = $9)
            RETURNING created_at`,
			a.Title, a.Description, initialCode, testCasesJSON, resourcesJSON, expectedOutput,
			assignmentID, a.SessionID, u.UserID,
		).Scan(&a.CreatedAt)
		if err == sql.ErrNoRows {
			writeJSONError(w, http.StatusNotFound, "assignment not found")
			return
		}
		if err != nil {
			log.Printf("UpdateAssignment: DB error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		a.ID = assignmentID
		a.TestCases = testCasesJSON
		a.Resources = resourcesJSON
		writeJSON(w, http.StatusOK, a)
	}
}

func UploadResource(db *sql.DB, uploadDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}

		assignmentID, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid assignment id")
			return
		}

		var sessionID int
		err = db.QueryRow(`
            SELECT session_id FROM assignments
            WHERE id = $1 AND EXISTS(
                SELECT 1 FROM sessions WHERE id = assignments.session_id AND teacher_id = $2
            )`, assignmentID, u.UserID).Scan(&sessionID)
		if err == sql.ErrNoRows {
			writeJSONError(w, http.StatusNotFound, "assignment not found")
			return
		}
		if err != nil {
			log.Printf("UploadResource: lookup error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		if err := r.ParseMultipartForm(10 << 20); err != nil {
			writeJSONError(w, http.StatusBadRequest, "parse form failed")
			return
		}

		file, handler, err := r.FormFile("file")
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "file required")
			return
		}
		defer file.Close()

		originalName := filepath.Base(handler.Filename)
		ext := strings.ToLower(filepath.Ext(originalName))
		if ext != ".pdf" {
			writeJSONError(w, http.StatusBadRequest, "only PDF files allowed")
			return
		}

		header := make([]byte, 5)
		n, err := io.ReadFull(file, header)
		if err != nil && err != io.ErrUnexpectedEOF {
			writeJSONError(w, http.StatusBadRequest, "file read failed")
			return
		}
		if n < 5 || string(header) != "%PDF-" {
			writeJSONError(w, http.StatusBadRequest, "invalid PDF file")
			return
		}

		uploadPath := filepath.Join(uploadDir, fmt.Sprintf("session_%d", sessionID))
		if err := os.MkdirAll(uploadPath, 0750); err != nil {
			log.Printf("UploadResource: mkdir error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "storage error")
			return
		}

		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), strings.NewReplacer(" ", "_", "/", "_", "\\", "_").Replace(originalName))
		dst, err := os.OpenFile(filepath.Join(uploadPath, filename), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0640)
		if err != nil {
			log.Printf("UploadResource: create file error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "save file failed")
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, io.MultiReader(bytes.NewReader(header), file)); err != nil {
			writeJSONError(w, http.StatusInternalServerError, "write file failed")
			return
		}

		resourceURL := fmt.Sprintf("/uploads/session_%d/%s", sessionID, filename)
		resource := models.Resource{Type: "pdf", URL: resourceURL, Title: originalName}
		payload, _ := json.Marshal([]models.Resource{resource})

		if _, err = db.Exec(`UPDATE assignments SET resources = resources || $1::jsonb WHERE id = $2`, string(payload), assignmentID); err != nil {
			log.Printf("UploadResource: update DB error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		writeJSON(w, http.StatusOK, resource)
	}
}

func DeleteAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid assignment id")
			return
		}
		sid, err := strconv.Atoi(r.URL.Query().Get("session_id"))
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid session_id")
			return
		}
		res, err := db.Exec(`
            DELETE FROM assignments
            WHERE id = $1 AND session_id = $2
              AND EXISTS(SELECT 1 FROM sessions WHERE id = $2 AND teacher_id = $3)`, id, sid, u.UserID)
		if err != nil {
			log.Printf("DeleteAssignment: DB error: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		if n, _ := res.RowsAffected(); n == 0 {
			writeJSONError(w, http.StatusNotFound, "not found")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
