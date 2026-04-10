package testutil

import (
	"database/sql"
	"fmt"
	"os"
	"testing"
)

// SetupTestDB creates a test database and returns the connection
func SetupTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/csharppracticum_test?sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	// Create a unique test database for this test run
	testDBName := fmt.Sprintf("csharppracticum_test_%d", os.Getpid())
	
	// Connect to default postgres database to create test database
	defaultDB, err := sql.Open("pgx", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable")
	if err == nil {
		defer defaultDB.Close()
		_, _ = defaultDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", testDBName))
		_, _ = defaultDB.Exec(fmt.Sprintf("CREATE DATABASE %s", testDBName))
	}

	// Connect to test database
	testDB, err := sql.Open("pgx", fmt.Sprintf("postgres://postgres:postgres@localhost:5432/%s?sslmode=disable", testDBName))
	if err != nil {
		t.Fatalf("Failed to connect to test database %s: %v", testDBName, err)
	}

	// Initialize schema
	if err := InitTestSchema(testDB); err != nil {
		t.Fatalf("Failed to initialize test schema: %v", err)
	}

	t.Cleanup(func() {
		testDB.Close()
		// Drop test database
		if defaultDB != nil {
			_, _ = defaultDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", testDBName))
			defaultDB.Close()
		}
	})

	return testDB
}

// InitTestSchema creates the test database schema
func InitTestSchema(db *sql.DB) error {
	schema := `
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

		CREATE TABLE IF NOT EXISTS assignments (
			id BIGSERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			initial_code TEXT NOT NULL,
			expected_output TEXT,
			group_name TEXT NOT NULL DEFAULT 'default',
			created_by_teacher_id BIGINT NOT NULL,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE CASCADE
		);

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

		CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
		CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_name);
		CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);
		CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(group_name);
		CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
		CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
		CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
	`

	_, err := db.Exec(schema)
	return err
}

// CreateTestUser creates a test user and returns the user ID
func CreateTestUser(db *sql.DB, role, username, studentID, groupName string) (int64, error) {
	var id int64
	err := db.QueryRow(`
		INSERT INTO users (username, role, student_id, group_name, full_name)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, username, role, studentID, groupName, "Test User").Scan(&id)
	return id, err
}
