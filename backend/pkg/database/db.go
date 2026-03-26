package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

func NewSQLiteDB(dbPath string) (*sql.DB, error) {
	log.Printf("Opening database: %s", dbPath)

	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
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
    -- Таблица пользователей
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
        full_name TEXT,
        student_id TEXT UNIQUE,
        group_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
    );

    -- Таблица заданий
    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        initial_code TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        created_by_teacher_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Таблица решений
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        output TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT 0,
        error_message TEXT,
        grade INTEGER,
        teacher_comment TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        graded_at DATETIME,
        graded_by_teacher_id INTEGER,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (graded_by_teacher_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Индексы для ускорения запросов
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_name);
    CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
    `

	_, err := db.Exec(schema)
	if err != nil {
		log.Printf("Failed to create schema: %v", err)
		return err
	}

	log.Println("Database schema initialized successfully")
	return nil
}