package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/models"
	"CSharpPracticum/internal/services"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type testCaseRunResult struct {
	Number   int
	Input    string
	Expected string
	Actual   string
	Error    string
	Hidden   bool
	Passed   bool
	TimeMs   int64
}

func CreateSubmission(db *sql.DB, compiler *services.CompilerService, timeout time.Duration) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.SessionID == nil {
			writeJSONError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var req struct {
			AssignmentID int    `json:"assignmentId"`
			Code         string `json:"code"`
			Input        string `json:"input"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AssignmentID <= 0 {
			writeJSONError(w, http.StatusBadRequest, "invalid request")
			return
		}

		var expected sql.NullString
		var testCasesRaw string
		err := db.QueryRow(`
			SELECT COALESCE(expected_output, '') AS expected_output,
			       COALESCE(test_cases, '[]'::jsonb)::text AS test_cases
			FROM assignments
			WHERE id = $1 AND session_id = $2`,
			req.AssignmentID, *u.SessionID,
		).Scan(&expected, &testCasesRaw)
		if err == sql.ErrNoRows {
			writeJSONError(w, http.StatusNotFound, "assignment not found")
			return
		}
		if err != nil {
			log.Printf("CreateSubmission: assignment lookup failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		testCases, err := parseTestCases(testCasesRaw)
		if err != nil {
			log.Printf("CreateSubmission: invalid test cases in assignment %d: %v", req.AssignmentID, err)
			writeJSONError(w, http.StatusInternalServerError, "invalid assignment test cases")
			return
		}

		output := ""
		errorMessage := ""
		isCorrect := false
		status := "pending_review"

		if len(testCases) > 0 {
			results := runAssignmentTestCases(compiler, req.Code, testCases, timeout)
			output = buildTestCaseReport(results)
			isCorrect = allTestCasesPassed(results)
			if isCorrect {
				status = "done"
			} else {
				status = "incorrect"
			}
			errorMessage = firstTestCaseError(results)
		} else {
			res := compiler.CompileAndRun(req.Code, req.Input, timeout)
			output = strings.TrimSpace(res.Output)
			errorMessage = strings.TrimSpace(res.Error)

			exp := normalizeConsoleOutput(expected.String)
			out := normalizeConsoleOutput(res.Output)
			isCorrect = expected.Valid && exp != "" && res.Success && out == exp
			if expected.Valid && exp != "" {
				if isCorrect {
					status = "done"
				} else {
					status = "incorrect"
				}
			}
			if output == "" && errorMessage != "" {
				output = errorMessage
			}
		}

		var subID int
		err = db.QueryRow(`
			INSERT INTO submissions (assignment_id, user_id, session_id, code, output, is_correct, status, error_message, submitted_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
			RETURNING id`,
			req.AssignmentID, u.UserID, *u.SessionID, req.Code, output, isCorrect, status, nullableString(errorMessage), time.Now(),
		).Scan(&subID)
		if err != nil {
			log.Printf("CreateSubmission: insert failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}

		writeJSON(w, http.StatusCreated, map[string]any{"id": subID, "status": status, "output": output, "isCorrect": isCorrect})
	}
}

func parseTestCases(raw string) ([]models.TestCase, error) {
	if strings.TrimSpace(raw) == "" {
		return []models.TestCase{}, nil
	}
	var testCases []models.TestCase
	if err := json.Unmarshal([]byte(raw), &testCases); err != nil {
		return nil, err
	}
	filtered := make([]models.TestCase, 0, len(testCases))
	for _, tc := range testCases {
		if strings.TrimSpace(tc.Expected) == "" && strings.TrimSpace(tc.Input) == "" {
			continue
		}
		filtered = append(filtered, tc)
	}
	return filtered, nil
}

func runAssignmentTestCases(compiler *services.CompilerService, code string, testCases []models.TestCase, timeout time.Duration) []testCaseRunResult {
	results := make([]testCaseRunResult, 0, len(testCases))
	for i, tc := range testCases {
		res := compiler.CompileAndRun(code, tc.Input, timeout)
		actual := strings.TrimSpace(res.Output)
		errText := strings.TrimSpace(res.Error)
		passed := res.Success && normalizeConsoleOutput(actual) == normalizeConsoleOutput(tc.Expected)
		results = append(results, testCaseRunResult{
			Number:   i + 1,
			Input:    tc.Input,
			Expected: tc.Expected,
			Actual:   actual,
			Error:    errText,
			Hidden:   tc.Hidden,
			Passed:   passed,
			TimeMs:   res.TimeMs,
		})
		if errText != "" && !res.Success {
			break
		}
	}
	return results
}

func buildTestCaseReport(results []testCaseRunResult) string {
	passedCount := 0
	for _, result := range results {
		if result.Passed {
			passedCount++
		}
	}

	var b strings.Builder
	b.WriteString(fmt.Sprintf("Тест-кейсы: %d/%d пройдено", passedCount, len(results)))
	for _, result := range results {
		b.WriteString("\n\n")
		if result.Passed {
			b.WriteString(fmt.Sprintf("✅ Тест #%d пройден", result.Number))
		} else {
			b.WriteString(fmt.Sprintf("❌ Тест #%d не пройден", result.Number))
		}
		if result.TimeMs > 0 {
			b.WriteString(fmt.Sprintf(" (%d мс)", result.TimeMs))
		}

		if result.Hidden {
			b.WriteString("\nВвод: скрытый тест")
			b.WriteString("\nОжидаемый вывод: скрыт")
			b.WriteString("\nФактический вывод: скрыт")
			if result.Error != "" {
				b.WriteString("\nОшибка: скрыта")
			}
			continue
		}

		b.WriteString("\nВвод:")
		b.WriteString("\n")
		b.WriteString(emptyDash(result.Input))
		b.WriteString("\nОжидаемый вывод:")
		b.WriteString("\n")
		b.WriteString(emptyDash(result.Expected))
		b.WriteString("\nФактический вывод:")
		b.WriteString("\n")
		b.WriteString(emptyDash(result.Actual))
		if result.Error != "" {
			b.WriteString("\nОшибка:")
			b.WriteString("\n")
			b.WriteString(result.Error)
		}
	}
	return b.String()
}

func allTestCasesPassed(results []testCaseRunResult) bool {
	if len(results) == 0 {
		return false
	}
	for _, result := range results {
		if !result.Passed {
			return false
		}
	}
	return true
}

func firstTestCaseError(results []testCaseRunResult) string {
	for _, result := range results {
		if result.Error != "" {
			return result.Error
		}
	}
	return ""
}

func normalizeConsoleOutput(value string) string {
	value = strings.ReplaceAll(value, "\r\n", "\n")
	value = strings.ReplaceAll(value, "\r", "\n")
	lines := strings.Split(strings.TrimSpace(value), "\n")
	for i, line := range lines {
		lines[i] = strings.TrimRight(line, " \t")
	}
	return strings.Join(lines, "\n")
}

func emptyDash(value string) string {
	if strings.TrimSpace(value) == "" {
		return "—"
	}
	return value
}

func nullableString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func GetSubmissions(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil {
			writeJSONError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var rows *sql.Rows
		var err error
		if u.Role == "teacher" {
			sid, err := strconv.Atoi(r.URL.Query().Get("session_id"))
			if err != nil || sid <= 0 {
				writeJSONError(w, http.StatusBadRequest, "session_id required")
				return
			}
			rows, err = db.Query(`
				SELECT s.id, s.assignment_id, s.user_id, s.session_id, s.code, s.output, s.is_correct, s.status,
				       s.error_message, s.grade, s.teacher_comment, s.submitted_at, s.graded_at, s.graded_by_teacher_id,
				       COALESCE(u.full_name,'')
				FROM submissions s
				LEFT JOIN users u ON s.user_id = u.id
				WHERE s.session_id = $1
				  AND EXISTS(SELECT 1 FROM sessions se WHERE se.id = s.session_id AND se.teacher_id = $2)
				ORDER BY s.submitted_at DESC`, sid, u.UserID)
		} else {
			if u.SessionID == nil {
				writeJSONError(w, http.StatusBadRequest, "no session")
				return
			}
			rows, err = db.Query(`
				SELECT s.id, s.assignment_id, s.user_id, s.session_id, s.code, s.output, s.is_correct, s.status,
				       s.error_message, s.grade, s.teacher_comment, s.submitted_at, s.graded_at, s.graded_by_teacher_id,
				       COALESCE(u.full_name,'')
				FROM submissions s
				LEFT JOIN users u ON s.user_id = u.id
				WHERE s.user_id = $1 AND s.session_id = $2
				ORDER BY s.submitted_at DESC`, u.UserID, *u.SessionID)
		}
		if err != nil {
			log.Printf("GetSubmissions: query failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		defer rows.Close()

		type SubWithUser struct {
			models.Submission
			StudentName string `json:"studentName"`
		}
		list := make([]SubWithUser, 0)
		for rows.Next() {
			var s models.Submission
			var name string
			if err := rows.Scan(&s.ID, &s.AssignmentID, &s.UserID, &s.SessionID, &s.Code, &s.Output, &s.IsCorrect, &s.Status, &s.ErrorMessage, &s.Grade, &s.TeacherComment, &s.SubmittedAt, &s.GradedAt, &s.GradedByTeacherID, &name); err != nil {
				log.Printf("GetSubmissions: scan failed: %v", err)
				writeJSONError(w, http.StatusInternalServerError, "db error")
				return
			}
			list = append(list, SubWithUser{s, name})
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetSubmissions: rows failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error")
			return
		}
		writeJSON(w, http.StatusOK, list)
	}
}

func GradeSubmission(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := middleware.GetUserFromContext(r)
		if u == nil || u.Role != "teacher" {
			writeJSONError(w, http.StatusForbidden, "forbidden")
			return
		}
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid submission id")
			return
		}
		var req models.GradeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid body")
			return
		}
		if req.Grade < 2 || req.Grade > 5 {
			writeJSONError(w, http.StatusBadRequest, "grade must be from 2 to 5")
			return
		}

		status := "done"
		isCorrect := true
		if req.Grade <= 2 {
			status = "incorrect"
			isCorrect = false
		}
		comment := strings.TrimSpace(req.Comment)

		res, err := db.Exec(`
			UPDATE submissions s
			SET grade = $1, teacher_comment = $2, graded_at = $3, graded_by_teacher_id = $4, status = $5, is_correct = $6
			WHERE s.id = $7
			  AND EXISTS(SELECT 1 FROM sessions se WHERE se.id = s.session_id AND se.teacher_id = $4)`,
			req.Grade, nullableString(comment), time.Now(), u.UserID, status, isCorrect, id,
		)
		if err != nil {
			log.Printf("GradeSubmission: update failed: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "db error grading")
			return
		}
		if n, _ := res.RowsAffected(); n == 0 {
			writeJSONError(w, http.StatusNotFound, "submission not found")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"message": "ok"})
	}
}
