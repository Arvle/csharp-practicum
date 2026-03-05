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

	return seedData(db)
}

func seedData(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Printf("Failed to check existing data: %v", err)
		return err
	}

	if count > 0 {
		log.Println("Database already has data, skipping seed")
		return nil
	}

	log.Println("Seeding database with test data...")

	result, err := db.Exec(`
        INSERT INTO users (username, email, password_hash, role, full_name)
        VALUES ('teacher', 'teacher@example.com', 'teacher_2026', 'teacher', 'Преподаватель')
    `)
	if err != nil {
		log.Printf("Failed to insert teacher: %v", err)
		return err
	}
	teacherID, _ := result.LastInsertId()
	log.Printf("Teacher inserted with ID: %d", teacherID)

	result, err = db.Exec(`
        INSERT INTO users (username, email, password_hash, role, full_name, student_id, group_name)
        VALUES ('student', 'student@example.com', 'student123', 'student', 'Иванов Иван', '12345', 'ИСП-211')
    `)
	if err != nil {
		log.Printf("Failed to insert student: %v", err)
		return err
	}
	studentID, _ := result.LastInsertId()
	log.Printf("Student inserted with ID: %d", studentID)

	assignments := []struct {
		title       string
		desc        string
		initialCode string
		expected    string
	}{
		{
			"Hello World",
			"Напишите программу, которая выводит 'Hello, World!'",
			"Console.WriteLine(\"Hello, World!\");",
			"Hello, World!",
		},
		{
			"Сумма чисел",
			"Напишите программу для сложения чисел 5 и 3",
			"int a = 5;\nint b = 3;\nConsole.WriteLine(a + b);",
			"8",
		},
		{
			"Четное или нечетное",
			"Проверьте, является ли число 7 четным или нечетным",
			"int number = 7;\nif (number % 2 == 0)\n    Console.WriteLine(\"Четное\");\nelse\n    Console.WriteLine(\"Нечетное\");",
			"Нечетное",
		},
	}

	for i, a := range assignments {
		_, err = db.Exec(`
            INSERT INTO assignments (title, description, initial_code, expected_output, created_by_teacher_id)
            VALUES (?, ?, ?, ?, 1)
        `, a.title, a.desc, a.initialCode, a.expected)
		if err != nil {
			log.Printf("Failed to insert assignment %d: %v", i+1, err)
			return err
		}
		log.Printf("Assignment %d inserted: %s", i+1, a.title)
	}

	log.Println("Database seeding completed successfully")
	return nil
}
