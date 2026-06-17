package models

import "time"

type Session struct {
	ID          int        `json:"id" db:"id"`
	Title       string     `json:"title" db:"title"`
	InviteToken string     `json:"inviteToken" db:"invite_token"`
	TeacherID   int        `json:"teacherId" db:"teacher_id"`
	StartsAt    time.Time  `json:"startsAt" db:"starts_at"`
	EndsAt      *time.Time `json:"endsAt,omitempty" db:"ends_at"`
	IsActive    bool       `json:"isActive" db:"is_active"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
}

type CreateSessionRequest struct {
	Title        string `json:"title"`
	ExpiresHours int    `json:"expiresHours,omitempty"`
}
