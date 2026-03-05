package models

import (
    "time"
)

type Assignment struct {
    ID              int       `json:"id" db:"id"`
    Title           string    `json:"title" db:"title"`
    Description     string    `json:"description" db:"description"`
    InitialCode     string    `json:"initialCode" db:"initial_code"`
    ExpectedOutput  string    `json:"expectedOutput" db:"expected_output"`
    CreatedByTeacherID int    `json:"createdByTeacherId" db:"created_by_teacher_id"`
    CreatedAt       time.Time `json:"createdAt" db:"created_at"`
}

type AssignmentDTO struct {
    ID             int       `json:"id"`
    Title          string    `json:"title"`
    Description    string    `json:"description"`
    InitialCode    string    `json:"initialCode"`
    ExpectedOutput string    `json:"expectedOutput"`
    CreatedAt      time.Time `json:"createdAt"`
}
