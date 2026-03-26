package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"CSharpPracticum/internal/services"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
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
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if req.AssignmentID <= 0 {
			http.Error(w, `{"error": "assignmentId is required"}`, http.StatusBadRequest)
			return
		}

		var expectedOutput string
		err := db.QueryRow("SELECT expected_output FROM assignments WHERE id = ?", req.AssignmentID).Scan(&expectedOutput)
		if err == sql.ErrNoRows {
			http.Error(w, `{"error": "Assignment not found"}`, http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}

		compiler := services.NewCompilerService()
		timeout := 30 * time.Second
		result := compiler.CompileAndRun(req.Code, timeout)

		isCorrect := result.Success && result.Output == expectedOutput

		studentID := claims.UserID
		res, err := db.Exec(`
			INSERT INTO submissions (assignment_id, student_id, code, output, is_correct, error_message, submitted_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, req.AssignmentID, studentID, req.Code, result.Output, isCorrect, result.Error, time.Now())
		if err != nil {
			http.Error(w, `{"error": "Failed to save submission"}`, http.StatusInternalServerError)
			return
		}

		submissionID, err := res.LastInsertId()
		if err != nil {
			http.Error(w, `{"error": "Failed to retrieve submission ID"}`, http.StatusInternalServerError)
			return
		}

		var submission models.Submission
		err = db.QueryRow(`
			SELECT id, assignment_id, student_id, code, output, is_correct, error_message, submitted_at
			FROM submissions WHERE id = ?
		`, submissionID).Scan(
			&submission.ID, &submission.AssignmentID, &submission.StudentID,
			&submission.Code, &submission.Output, &submission.IsCorrect,
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
		rows, err := db.Query(`
			SELECT s.id, s.assignment_id, s.student_id, s.code, s.output,
			       s.is_correct, s.error_message, s.grade, s.teacher_comment, s.submitted_at,
			       COALESCE(u.full_name, '') as student_name
			FROM submissions s
			LEFT JOIN users u ON s.student_id = u.id
			ORDER BY s.submitted_at DESC
		`)
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
				&s.IsCorrect, &s.ErrorMessage, &s.Grade, &s.TeacherComment, &s.SubmittedAt,
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
		assignmentIDStr := chi.URLParam(r, "assignmentId")
		assignmentID, err := strconv.Atoi(assignmentIDStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid assignment ID"}`, http.StatusBadRequest)
			return
		}

		rows, err := db.Query(`
			SELECT s.id, s.assignment_id, s.student_id, s.code, s.output, 
			       s.is_correct, s.error_message, s.grade, s.teacher_comment, s.submitted_at,
			       COALESCE(u.full_name, '') as student_name
			FROM submissions s
			LEFT JOIN users u ON s.student_id = u.id
			WHERE s.assignment_id = ?
			ORDER BY s.submitted_at DESC
		`, assignmentID)
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
				&s.IsCorrect, &s.ErrorMessage, &s.Grade, &s.TeacherComment, &s.SubmittedAt,
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

		rows, err := db.Query(`
			SELECT id, assignment_id, student_id, code, output, is_correct, 
			       error_message, grade, teacher_comment, submitted_at
			FROM submissions
			WHERE student_id = ?
			ORDER BY submitted_at DESC
		`, studentID)
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
				&s.IsCorrect, &s.ErrorMessage, &s.Grade, &s.TeacherComment, &s.SubmittedAt,
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
			SET grade = ?, teacher_comment = ?, graded_at = ?, graded_by_teacher_id = ?
			WHERE id = ?
		`, req.Grade, req.Comment, time.Now(), user.UserID, id)
		if err != nil {
			http.Error(w, `{"error": "Failed to save grade"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Grade saved successfully"})
	}
	
}