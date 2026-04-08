package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func GetAssignments(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserFromContext(r)
		if claims == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		rows, err := db.Query(`
			SELECT id, title, description, initial_code, COALESCE(expected_output, ''), group_name, created_at
			FROM assignments
			WHERE group_name = $1
			ORDER BY created_at DESC
		`, claims.Group)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var assignments []models.AssignmentDTO
		for rows.Next() {
			var a models.AssignmentDTO
			err := rows.Scan(&a.ID, &a.Title, &a.Description, &a.InitialCode, &a.ExpectedOutput, &a.Group, &a.CreatedAt)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			assignments = append(assignments, a)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(assignments)
	}
}

func GetAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := chi.URLParam(r, "id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		var a models.AssignmentDTO
		claims := middleware.GetUserFromContext(r)
		if claims == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		err = db.QueryRow(`
			SELECT id, title, description, initial_code, COALESCE(expected_output, ''), group_name, created_at
			FROM assignments
			WHERE id = $1 AND group_name = $2
		`, id, claims.Group).Scan(&a.ID, &a.Title, &a.Description, &a.InitialCode, &a.ExpectedOutput, &a.Group, &a.CreatedAt)

		if err == sql.ErrNoRows {
			http.Error(w, "Assignment not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(a)
	}
}

func CreateAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := middleware.GetUserFromContext(r)
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var a models.AssignmentDTO
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if a.Title == "" {
			http.Error(w, "Title is required", http.StatusBadRequest)
			return
		}

		teacherID := user.UserID

		var id int
		err := db.QueryRow(`
			INSERT INTO assignments (title, description, initial_code, expected_output, group_name, created_by_teacher_id, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
		`, a.Title, a.Description, a.InitialCode, strings.TrimSpace(a.ExpectedOutput), user.Group, teacherID, time.Now()).Scan(&id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		a.ID = id
		a.CreatedAt = time.Now()
		a.Group = user.Group

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(a)
	}
}

func UpdateAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := chi.URLParam(r, "id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		var a models.AssignmentDTO
		user := middleware.GetUserFromContext(r)
		if user == nil || user.Role != "teacher" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		result, err := db.Exec(`
			UPDATE assignments
			SET title = $1, description = $2, initial_code = $3, expected_output = $4
			WHERE id = $5 AND group_name = $6
		`, a.Title, a.Description, a.InitialCode, strings.TrimSpace(a.ExpectedOutput), id, user.Group)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			http.Error(w, "Assignment not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func DeleteAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := chi.URLParam(r, "id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		user := middleware.GetUserFromContext(r)
		if user == nil || user.Role != "teacher" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		result, err := db.Exec("DELETE FROM assignments WHERE id = $1 AND group_name = $2", id, user.Group)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			http.Error(w, "Assignment not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
