package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"CSharpPracticum/internal/services"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func CreateSubmission(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserFromContext(r)
		if claims == nil {
			http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
			return
		}

		var req struct {
			AssignmentID int    `json:"assignmentId"`
			Code         string `json:"code"`
			Input        string `json:"input"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if req.AssignmentID <= 0 {
			http.Error(w, `{"error": "assignmentId is required"}`, http.StatusBadRequest)
			return
		}

		var expectedOutput sql.NullString
		err := db.QueryRow("SELECT expected_output FROM assignments WHERE id = $1 AND group_name = $2", req.AssignmentID, claims.Group).Scan(&expectedOutput)
		if err == sql.ErrNoRows {
			http.Error(w, `{"error": "Assignment not found"}`, http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}

		compiler := services.NewCompilerService()
		timeout := 30 * time.Second
		result := compiler.CompileAndRun(req.Code, req.Input, timeout)
		normalizedExpected := strings.TrimSpace(expectedOutput.String)
		normalizedOutput := strings.TrimSpace(result.Output)
		isManualReview := !expectedOutput.Valid || normalizedExpected == ""
		isCorrect := !isManualReview && result.Success && normalizedOutput == normalizedExpected
		status := "incorrect"
		if isManualReview {
			status = "pending_review"
			isCorrect = false
		} else if isCorrect {
			status = "done"
		}

		studentID := claims.UserID
		var submissionID int
		err = db.QueryRow(`
			INSERT INTO submissions (assignment_id, student_id, code, output, is_correct, status, error_message, submitted_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id
		`, req.AssignmentID, studentID, req.Code, result.Output, isCorrect, status, result.Error, time.Now()).Scan(&submissionID)
		if err != nil {
			http.Error(w, `{"error": "Failed to save submission"}`, http.StatusInternalServerError)
			return
		}

		var submission models.Submission
		err = db.QueryRow(`
			SELECT id, assignment_id, student_id, code, output, is_correct, status, error_message, submitted_at
			FROM submissions WHERE id = $1
		`, submissionID).Scan(
			&submission.ID, &submission.AssignmentID, &submission.StudentID,
			&submission.Code, &submission.Output, &submission.IsCorrect, &submission.Status,
			&submission.ErrorMessage, &submission.SubmittedAt,
		)
		if err != nil {
			http.Error(w, `{"error": "Failed to retrieve submission"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(submission)
	}
}

func GetAllSubmissions(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserFromContext(r)
		if claims == nil || claims.Role != "teacher" {
			http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
			return
		}
		rows, err := db.Query(`
			SELECT s.id, s.assignment_id, s.student_id, s.code, s.output,
			       s.is_correct, s.status, s.error_message, s.grade, s.teacher_comment, s.submitted_at,
			       COALESCE(u.full_name, '') as student_name
			FROM submissions s
			LEFT JOIN users u ON s.student_id = u.id
			LEFT JOIN assignments a ON s.assignment_id = a.id
			WHERE a.group_name = $1
			ORDER BY s.submitted_at DESC
		`, claims.Group)
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var submissions []models.SubmissionWithStudentName
		for rows.Next() {
			var s models.Submission
			var studentName string
			err := rows.Scan(
				&s.ID, &s.AssignmentID, &s.StudentID, &s.Code, &s.Output,
				&s.IsCorrect, &s.Status, &s.ErrorMessage, &s.Grade, &s.TeacherComment, &s.SubmittedAt,
				&studentName,
			)
			if err != nil {
				http.Error(w, `{"error": "Failed to scan submission"}`, http.StatusInternalServerError)
				return
			}
			submissions = append(submissions, models.SubmissionWithStudentName{
				Submission:  s,
				StudentName: studentName,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(submissions)
	}
}

func GetSubmissionsByAssignment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserFromContext(r)
		if claims == nil || claims.Role != "teacher" {
			http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
			return
		}
		assignmentIDStr := chi.URLParam(r, "assignmentId")
		assignmentID, err := strconv.Atoi(assignmentIDStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid assignment ID"}`, http.StatusBadRequest)
			return
		}

		rows, err := db.Query(`
			SELECT s.id, s.assignment_id, s.student_id, s.code, s.output, 
			       s.is_correct, s.status, s.error_message, s.grade, s.teacher_comment, s.submitted_at,
			       COALESCE(u.full_name, '') as student_name
			FROM submissions s
			LEFT JOIN users u ON s.student_id = u.id
			LEFT JOIN assignments a ON s.assignment_id = a.id
			WHERE s.assignment_id = $1 AND a.group_name = $2
			ORDER BY s.submitted_at DESC
		`, assignmentID, claims.Group)
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var submissions []models.SubmissionWithStudentName
		for rows.Next() {
			var s models.Submission
			var studentName string
			err := rows.Scan(
				&s.ID, &s.AssignmentID, &s.StudentID, &s.Code, &s.Output,
				&s.IsCorrect, &s.Status, &s.ErrorMessage, &s.Grade, &s.TeacherComment, &s.SubmittedAt,
				&studentName,
			)
			if err != nil {
				http.Error(w, `{"error": "Failed to scan submission"}`, http.StatusInternalServerError)
				return
			}
			submissions = append(submissions, models.SubmissionWithStudentName{
				Submission:  s,
				StudentName: studentName,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(submissions)
	}
}

func GetStudentSubmissions(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserFromContext(r)
		if claims == nil {
			http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
			return
		}

		studentIDStr := chi.URLParam(r, "studentId")
		studentID, err := strconv.Atoi(studentIDStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid student ID"}`, http.StatusBadRequest)
			return
		}

		if claims.Role == "student" && claims.UserID != studentID {
			http.Error(w, `{"error": "Forbidden"}`, http.StatusForbidden)
			return
		}
		if claims.Role != "student" && claims.Role != "teacher" {
			http.Error(w, `{"error": "Forbidden"}`, http.StatusForbidden)
			return
		}

		query := `
			SELECT s.id, s.assignment_id, s.student_id, s.code, s.output, s.is_correct, s.status,
			       error_message, grade, teacher_comment, submitted_at
			FROM submissions s
			LEFT JOIN assignments a ON s.assignment_id = a.id
			WHERE s.student_id = $1
			ORDER BY submitted_at DESC
		`
		var rows *sql.Rows
		if claims.Role == "teacher" {
			query = `
				SELECT s.id, s.assignment_id, s.student_id, s.code, s.output, s.is_correct, s.status,
				       s.error_message, s.grade, s.teacher_comment, s.submitted_at
				FROM submissions s
				LEFT JOIN assignments a ON s.assignment_id = a.id
				WHERE s.student_id = $1 AND a.group_name = $2
				ORDER BY s.submitted_at DESC
			`
			rows, err = db.Query(query, studentID, claims.Group)
		} else {
			rows, err = db.Query(query, studentID)
		}
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var submissions []models.Submission
		for rows.Next() {
			var s models.Submission
			err := rows.Scan(
				&s.ID, &s.AssignmentID, &s.StudentID, &s.Code, &s.Output,
				&s.IsCorrect, &s.Status, &s.ErrorMessage, &s.Grade, &s.TeacherComment, &s.SubmittedAt,
			)
			if err != nil {
				http.Error(w, `{"error": "Failed to scan submission"}`, http.StatusInternalServerError)
				return
			}
			submissions = append(submissions, s)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(submissions)
	}
}

func GradeSubmission(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := chi.URLParam(r, "id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid submission ID"}`, http.StatusBadRequest)
			return
		}

		var req struct {
			Grade   int    `json:"grade"`
			Comment string `json:"comment"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		user := middleware.GetUserFromContext(r)
		if user == nil || user.Role != "teacher" {
			http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
			return
		}

		_, err = db.Exec(`
			UPDATE submissions
			SET grade = $1, teacher_comment = $2, graded_at = $3, graded_by_teacher_id = $4, status = 'done'
			WHERE id = $5 AND EXISTS (
				SELECT 1 FROM assignments a WHERE a.id = submissions.assignment_id AND a.group_name = $6
			)
		`, req.Grade, req.Comment, time.Now(), user.UserID, id, user.Group)
		if err != nil {
			http.Error(w, `{"error": "Failed to save grade"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Grade saved successfully"})
	}

}
