package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"CSharpPracticum/internal/models"
	"CSharpPracticum/internal/testutil"
)

func TestStudentLogin_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)

	// Create a test student
	studentID, err := testutil.CreateTestUser(db, "student", "teststudent", "S1001", "ИСП-211")
	if err != nil {
		t.Fatalf("Failed to create test student: %v", err)
	}

	_ = studentID // Use the student ID in tests

	reqBody := models.StudentLoginRequest{
		StudentID: "S1001",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/student/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := StudentLogin(db)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]interface{}
	err = json.NewDecoder(rr.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if _, ok := response["token"]; !ok {
		t.Error("Response should contain a token")
	}

	if user, ok := response["user"].(map[string]interface{}); ok {
		if role, _ := user["role"].(string); role != "student" {
			t.Errorf("Expected role 'student', got '%s'", role)
		}
	}
}

func TestStudentLogin_MissingStudentID(t *testing.T) {
	db := testutil.SetupTestDB(t)

	reqBody := models.StudentLoginRequest{
		StudentID: "",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/student/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := StudentLogin(db)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestStudentLogin_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)

	reqBody := models.StudentLoginRequest{
		StudentID: "NONEXISTENT",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/student/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := StudentLogin(db)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}

func TestTeacherLogin_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)

	// Set test access code
	t.Setenv("TEACHER_ACCESS_CODE", "test_access_code")

	reqBody := models.TeacherLoginRequest{
		AccessCode: "test_access_code",
		Group:      "ИСП-211",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/teacher/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := TeacherLogin(db)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if _, ok := response["token"]; !ok {
		t.Error("Response should contain a token")
	}
}

func TestTeacherLogin_InvalidAccessCode(t *testing.T) {
	db := testutil.SetupTestDB(t)

	t.Setenv("TEACHER_ACCESS_CODE", "correct_code")

	reqBody := models.TeacherLoginRequest{
		AccessCode: "wrong_code",
		Group:      "ИСП-211",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/teacher/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := TeacherLogin(db)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}
