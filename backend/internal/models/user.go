package models

import "time"

type User struct {
	ID          int        `json:"id" db:"id"`
	Username    string     `json:"username" db:"username"`
	Role        string     `json:"role" db:"role"`
	FullName    *string    `json:"fullName" db:"full_name"`
	StudentID   *string    `json:"studentId" db:"student_id"`
	Group       *string    `json:"group" db:"group_name"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	LastLoginAt *time.Time `json:"lastLoginAt" db:"last_login_at"`
}

type StudentLoginRequest struct {
	StudentID string `json:"studentId"`
	Password  string `json:"password,omitempty"`
}

type TeacherLoginRequest struct {
	AccessCode string `json:"accessCode"`
	Group      string `json:"group"`
	Password   string `json:"password,omitempty"`
}

type LoginResponse struct {
	ID       int     `json:"id"`
	Username string  `json:"username"`
	Role     string  `json:"role"`
	FullName *string `json:"fullName"`
	Group    *string `json:"group"`
	Token    string  `json:"token,omitempty"`
}

// StudentPublic — данные студента для преподавательской панели (без секретов).
type StudentPublic struct {
	ID        int     `json:"id"`
	Username  string  `json:"username"`
	FullName  *string `json:"fullName"`
	StudentID *string `json:"studentId"`
	Group     *string `json:"group"`
}
