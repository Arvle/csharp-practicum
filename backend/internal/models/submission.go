package models

import "time"

type Submission struct {
	ID                int        `json:"id" db:"id"`
	AssignmentID      int        `json:"assignmentId" db:"assignment_id"`
	UserID            int        `json:"userId" db:"user_id"`
	SessionID         int        `json:"sessionId" db:"session_id"`
	Code              string     `json:"code" db:"code"`
	Output            string     `json:"output" db:"output"`
	IsCorrect         bool       `json:"isCorrect" db:"is_correct"`
	Status            string     `json:"status" db:"status"`
	ErrorMessage      *string    `json:"errorMessage,omitempty" db:"error_message"`
	Grade             *int       `json:"grade,omitempty" db:"grade"`
	TeacherComment    *string    `json:"teacherComment,omitempty" db:"teacher_comment"`
	SubmittedAt       time.Time  `json:"submittedAt" db:"submitted_at"`
	GradedAt          *time.Time `json:"gradedAt,omitempty" db:"graded_at"`
	GradedByTeacherID *int       `json:"gradedByTeacherId,omitempty" db:"graded_by_teacher_id"`
}

type GradeRequest struct {
	Grade   int    `json:"grade"`
	Comment string `json:"comment"`
}
