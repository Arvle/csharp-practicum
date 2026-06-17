package models

import "time"

type User struct {
	ID        int       `json:"id" db:"id"`
	Role      string    `json:"role" db:"role"`
	FullName  string    `json:"fullName" db:"full_name"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type TeacherLoginRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

type TeacherSetupRequest struct {
	FullName string `json:"fullName"`
	Password string `json:"password"`
}

type JoinSessionRequest struct {
	FullName string `json:"fullName" validate:"required,min=2,max=100"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
