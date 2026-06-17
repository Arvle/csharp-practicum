package models

import "time"

type Assignment struct {
	ID             int       `json:"id" db:"id"`
	Title          string    `json:"title" db:"title"`
	Description    string    `json:"description" db:"description"`
	InitialCode    *string   `json:"initialCode,omitempty" db:"initial_code"`
	TestCases      string    `json:"testCases,omitempty" db:"test_cases"`
	Resources      string    `json:"resources,omitempty" db:"resources"`
	ExpectedOutput *string   `json:"expectedOutput,omitempty" db:"expected_output"`
	SessionID      int       `json:"sessionId" db:"session_id"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
}

type TestCase struct {
	Input    string `json:"input"`
	Expected string `json:"expected"`
	Hidden   bool   `json:"hidden,omitempty"`
}

type Resource struct {
	Type  string `json:"type"`
	URL   string `json:"url"`
	Title string `json:"title"`
}
