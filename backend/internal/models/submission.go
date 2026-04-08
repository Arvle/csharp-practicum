package models

import "time"

type Submission struct {
	ID                int        `json:"id" db:"id"`
	AssignmentID      int        `json:"assignmentId" db:"assignment_id"`
	StudentID         int        `json:"studentId" db:"student_id"`
	Code              string     `json:"code" db:"code"`
	Output            string     `json:"output" db:"output"`
	IsCorrect         bool       `json:"isCorrect" db:"is_correct"`
	Status            string     `json:"status" db:"status"`
	ErrorMessage      *string    `json:"errorMessage" db:"error_message"`
	Grade             *int       `json:"grade" db:"grade"`
	TeacherComment    *string    `json:"teacherComment" db:"teacher_comment"`
	SubmittedAt       time.Time  `json:"submittedAt" db:"submitted_at"`
	GradedAt          *time.Time `json:"gradedAt" db:"graded_at"`
	GradedByTeacherID *int       `json:"gradedByTeacherId" db:"graded_by_teacher_id"`
}

type SubmissionDTO struct {
	ID           int       `json:"id"`
	AssignmentID int       `json:"assignmentId"`
	StudentID    int       `json:"studentId"`
	StudentName  *string   `json:"studentName"`
	Code         string    `json:"code"`
	Output       string    `json:"output"`
	IsCorrect    bool      `json:"isCorrect"`
	ErrorMessage *string   `json:"errorMessage"`
	Grade        *int      `json:"grade"`
	SubmittedAt  time.Time `json:"submittedAt"`
}

type GradeRequest struct {
	Grade   int    `json:"grade"`
	Comment string `json:"comment"`
}

type SubmissionWithStudentName struct {
	Submission
	StudentName string `json:"studentName"`
}
