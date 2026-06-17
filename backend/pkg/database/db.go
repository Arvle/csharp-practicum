package database

import (
	"database/sql"
	"fmt"
	"os"
	"strconv"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func init() {
	_ = godotenv.Load()
}

type Queryer interface {
	SQL() *sql.DB
}

type DB struct {
	*sql.DB
}

func (db *DB) SQL() *sql.DB { return db.DB }

func NewPostgresDB(dsn string) (*DB, error) {
	if dsn == "" {
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s&client_encoding=UTF8",
			getEnv("POSTGRES_USER", "postgres"),
			getEnv("POSTGRES_PASSWORD", "admin"),
			getEnv("POSTGRES_HOST", "localhost"),
			getEnv("POSTGRES_PORT", "5432"),
			getEnv("POSTGRES_DB", "csharppracticum"),
			getEnv("DB_SSLMODE", "disable"),
		)
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(getEnvInt("DB_MAX_OPEN_CONNS", 10))
	db.SetMaxIdleConns(getEnvInt("DB_MAX_IDLE_CONNS", 5))
	return &DB{DB: db}, nil
}

func InitSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id BIGSERIAL PRIMARY KEY,
			role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
			full_name TEXT NOT NULL,
			password_hash TEXT,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS sessions (
			id BIGSERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			invite_token TEXT UNIQUE NOT NULL,
			teacher_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
			starts_at TIMESTAMPTZ DEFAULT NOW(),
			ends_at TIMESTAMPTZ,
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS assignments (
			id BIGSERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			initial_code TEXT DEFAULT '',
			test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
			resources JSONB NOT NULL DEFAULT '[]'::jsonb,
			expected_output TEXT,
			compiled_hash TEXT,
			session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS submissions (
			id BIGSERIAL PRIMARY KEY,
			assignment_id BIGINT REFERENCES assignments(id) ON DELETE CASCADE,
			user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
			session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
			code TEXT NOT NULL,
			output TEXT NOT NULL,
			is_correct BOOLEAN NOT NULL DEFAULT FALSE,
			status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'done', 'incorrect')),
			error_message TEXT,
			grade INTEGER,
			teacher_comment TEXT,
			submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			graded_at TIMESTAMPTZ,
			graded_by_teacher_id BIGINT REFERENCES users(id) ON DELETE SET NULL
		);
		CREATE TABLE IF NOT EXISTS session_participants (
			session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
			user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
			joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (session_id, user_id)
		);
		CREATE TABLE IF NOT EXISTS student_drafts (
			assignment_id BIGINT REFERENCES assignments(id) ON DELETE CASCADE,
			user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
			session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
			code TEXT NOT NULL DEFAULT '',
			updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (assignment_id, user_id, session_id)
		);
		DROP INDEX IF EXISTS idx_users_role_name;
		CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
		CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(invite_token);
		CREATE INDEX IF NOT EXISTS idx_assignments_session ON assignments(session_id);
		CREATE INDEX IF NOT EXISTS idx_submissions_session ON submissions(session_id);
		CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
		CREATE INDEX IF NOT EXISTS idx_submissions_user_assignment_latest 
		ON submissions(user_id, assignment_id, session_id, submitted_at DESC)
		WHERE status IN ('done', 'incorrect', 'pending_review');
		CREATE INDEX IF NOT EXISTS idx_student_drafts_user_assignment
		ON student_drafts(user_id, assignment_id, session_id);
		ALTER TABLE assignments ADD COLUMN IF NOT EXISTS initial_code TEXT DEFAULT '';
		ALTER TABLE assignments ALTER COLUMN initial_code DROP NOT NULL;
		ALTER TABLE assignments ALTER COLUMN initial_code SET DEFAULT '';
		ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
		ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
		ALTER TABLE assignments ADD COLUMN IF NOT EXISTS test_cases JSONB NOT NULL DEFAULT '[]'::jsonb;
		ALTER TABLE assignments ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb;
		ALTER TABLE assignments ADD COLUMN IF NOT EXISTS expected_output TEXT;
		ALTER TABLE assignments ADD COLUMN IF NOT EXISTS compiled_hash TEXT;
		ALTER TABLE submissions ADD COLUMN IF NOT EXISTS grade INTEGER;
		ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_comment TEXT;
		ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
		ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by_teacher_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
	`)
	return err
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getEnvInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return def
}
