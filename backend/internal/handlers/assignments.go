package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"CSharpPracticum/internal/models"

	"github.com/go-chi/chi/v5"
)

func GetAssignments(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(`
			SELECT id, title, description, initial_code, expected_output, created_at
			FROM assignments
			ORDER BY created_at DESC
		`)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var assignments []models.AssignmentDTO
		for rows.Next() {
			var a models.AssignmentDTO
			err := rows.Scan(&a.ID, &a.Title, &a.Description, &a.InitialCode, &a.ExpectedOutput, &a.CreatedAt)
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
		err = db.QueryRow(`
			SELECT id, title, description, initial_code, expected_output, created_at
			FROM assignments
			WHERE id = ?
		`, id).Scan(&a.ID, &a.Title, &a.Description, &a.InitialCode, &a.ExpectedOutput, &a.CreatedAt)

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
		var a models.AssignmentDTO
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if a.Title == "" {
			http.Error(w, "Title is required", http.StatusBadRequest)
			return
		}

		teacherID := 1

		result, err := db.Exec(`
			INSERT INTO assignments (title, description, initial_code, expected_output, created_by_teacher_id, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`, a.Title, a.Description, a.InitialCode, a.ExpectedOutput, teacherID, time.Now())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		id, _ := result.LastInsertId()
		a.ID = int(id)
		a.CreatedAt = time.Now()

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
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		result, err := db.Exec(`
			UPDATE assignments
			SET title = ?, description = ?, initial_code = ?, expected_output = ?
			WHERE id = ?
		`, a.Title, a.Description, a.InitialCode, a.ExpectedOutput, id)
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

		result, err := db.Exec("DELETE FROM assignments WHERE id = ?", id)
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