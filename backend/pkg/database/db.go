package database

import (
	"database/sql"
	"log"
	"os"
	"strconv"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// NewPostgresDB создаёт подключение к PostgreSQL
// dsn пример: "postgres://user:pass@localhost:5432/dbname?sslmode=disable"
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

	maxOpenConns := getEnvInt("DB_MAX_OPEN_CONNS", 10)
	maxIdleConns := getEnvInt("DB_MAX_IDLE_CONNS", 5)

	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxIdleConns)

	log.Printf("Database connection established (pool: max_open=%d, max_idle=%d)", maxOpenConns, maxIdleConns)
	return db, nil
}

// getEnvInt читает целочисленное значение из окружения с fallback
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		log.Printf("Warning: invalid value for %s, using default %d", key, defaultValue)
	}
	return defaultValue
}

func InitSchema(db *sql.DB) error {
	log.Println("Initializing database schema...")

	schema := `
    -- Пользователи
    CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
        full_name TEXT,
        student_id TEXT UNIQUE,
        group_name TEXT,
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMPTZ
    );

    -- Задания
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

    -- Отправленные решения
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

    -- Индексы
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_name);
    CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);
    CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(group_name);
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

    -- Легковесные миграции для существующих баз данных
    ALTER TABLE users DROP COLUMN IF EXISTS email;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
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
