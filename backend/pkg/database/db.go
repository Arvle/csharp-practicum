package database

import (
	"database/sql"
	"log"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewPostgresDB(dsn string) (*sql.DB, error) {
	log.Printf("Opening PostgreSQL database")

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Printf("Failed to open database: %v", err)
		return nil, err
	}

	if err := db.Ping(); err != nil {
		log.Printf("Failed to ping database: %v", err)
		return nil, err
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	log.Println("Database connection established")
	return db, nil
}

func InitSchema(db *sql.DB) error {
	log.Println("Initializing database schema...")

	schema := `
    -- Users
    CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
        full_name TEXT,
        student_id TEXT UNIQUE,
        group_name TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMPTZ
    );

    -- Assignments
    CREATE TABLE IF NOT EXISTS assignments (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        initial_code TEXT NOT NULL,
        expected_output TEXT,
        group_name TEXT NOT NULL,
        created_by_teacher_id BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Submissions
    CREATE TABLE IF NOT EXISTS submissions (
        id BIGSERIAL PRIMARY KEY,
        assignment_id BIGINT NOT NULL,
        student_id BIGINT NOT NULL,
        code TEXT NOT NULL,
        output TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'done', 'incorrect')),
        error_message TEXT,
        grade INTEGER,
        teacher_comment TEXT,
        submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        graded_at TIMESTAMPTZ,
        graded_by_teacher_id BIGINT,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (graded_by_teacher_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_name);
    CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);
    CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(group_name);
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

    -- Lightweight migrations for existing databases
    ALTER TABLE users DROP COLUMN IF EXISTS email;
    ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
    ALTER TABLE assignments ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT 'default';
    ALTER TABLE assignments ALTER COLUMN expected_output DROP NOT NULL;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_review';
    UPDATE submissions
    SET status = CASE
        WHEN is_correct = TRUE THEN 'done'
        WHEN is_correct = FALSE THEN 'incorrect'
        ELSE 'pending_review'
    END
    WHERE status IS NULL OR status = '';
    `

	_, err := db.Exec(schema)
	if err != nil {
		log.Printf("Failed to create schema: %v", err)
		return err
	}

	log.Println("Database schema initialized successfully")
	return nil
}
