package models

import "time"

type User struct {
	ID           int        `json:"id" db:"id"`
	Username     string     `json:"username" db:"username"`
	Email        *string    `json:"email" db:"email"`
	PasswordHash string     `json:"-" db:"password_hash"`
	Role         string     `json:"role" db:"role"`
	FullName     *string    `json:"fullName" db:"full_name"`
	StudentID    *string    `json:"studentId" db:"student_id"`
	Group        *string    `json:"group" db:"group_name"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
	LastLoginAt  *time.Time `json:"lastLoginAt" db:"last_login_at"`
}

type StudentLoginRequest struct {
	StudentID string `json:"studentId"`
	FullName  string `json:"fullName"`
	Group     string `json:"group"`
}

type TeacherLoginRequest struct {
	AccessCode string `json:"accessCode"`
	Group      string `json:"group"`
}

type LoginResponse struct {
	ID       int     `json:"id"`
	Username string  `json:"username"`
	Role     string  `json:"role"`
	FullName *string `json:"fullName"`
	Group    *string `json:"group"`
	Token    string  `json:"token,omitempty"`
}