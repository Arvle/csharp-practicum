-- =============================================================================
-- Seed script for C# Practicum
-- Creates: students, teacher, sample assignments, and submissions
-- Safe to run multiple times: uses INSERT ... ON CONFLICT DO NOTHING/UPDATE
-- =============================================================================
--
-- Usage (Docker):
--   docker compose exec postgres psql -U postgres -d csharppracticum -f /docker-entrypoint-initdb.d/seed.sql
--
-- Usage (Local):
--   psql "postgres://postgres:password@localhost:5432/csharppracticum?sslmode=disable" -f seed.sql

BEGIN;

-- =============================================================================
-- 1. Students
-- =============================================================================
INSERT INTO users (username, role, full_name, student_id, group_name, created_at)
VALUES
  ('S1001', 'student', 'Иванов Иван Иванович',         'S1001', 'ИСП-211', NOW()),
  ('S1002', 'student', 'Петров Петр Петрович',         'S1002', 'ИСП-211', NOW()),
  ('S1003', 'student', 'Сидорова Анна Сергеевна',      'S1003', 'ИСП-212', NOW()),
  ('S1004', 'student', 'Козлов Дмитрий Олегович',      'S1004', 'ИСП-212', NOW()),
  ('S1005', 'student', 'Смирнова Мария Игоревна',      'S1005', 'ПРО-111', NOW()),
  ('S1006', 'student', 'Орлов Никита Андреевич',       'S1006', 'ПРО-112', NOW())
ON CONFLICT (student_id) DO UPDATE
SET
  username   = EXCLUDED.username,
  full_name  = EXCLUDED.full_name,
  group_name = EXCLUDED.group_name;

-- =============================================================================
-- 2. Teacher (if not already exists)
-- =============================================================================
INSERT INTO users (username, role, full_name, group_name, password_hash, created_at)
SELECT 'teacher', 'teacher', 'Преподаватель', 'ИСП-211',
       '$2a$10$X7qZb6K5lJqZ5lJqZ5lJqO5qZ5lJqZ5lJqZ5lJqZ5lJqZ5lJqZ5l.',
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'teacher' AND role = 'teacher');

-- =============================================================================
-- 3. Sample Assignments (linked to teacher and groups)
-- =============================================================================
DO $$
DECLARE
  teacher_id BIGINT;
BEGIN
  -- Get teacher ID
  SELECT id INTO teacher_id FROM users WHERE username = 'teacher' AND role = 'teacher' LIMIT 1;
  IF teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher user not found. Run the seed script again after teacher logs in once.';
  END IF;

  -- Assignment 1: Hello World (ИСП-211)
  INSERT INTO assignments (title, description, initial_code, expected_output, group_name, created_by_teacher_id, created_at)
  VALUES
    ('Задача 1: Hello World',
     'Напишите программу, которая выводит "Hello, World!" на консоль.',
     E'Console.WriteLine("Hello, World!");',
     'Hello, World!',
     'ИСП-211',
     teacher_id,
     NOW())
  ON CONFLICT DO NOTHING;

  -- Assignment 2: Simple Math (ИСП-211)
  INSERT INTO assignments (title, description, initial_code, expected_output, group_name, created_by_teacher_id, created_at)
  VALUES
    ('Задача 2: Сложение двух чисел',
     'Напишите программу, которая выводит результат сложения 5 + 3.',
     E'Console.WriteLine(5 + 3);',
     '8',
     'ИСП-211',
     teacher_id,
     NOW())
  ON CONFLICT DO NOTHING;

  -- Assignment 3: Variables (ИСП-212)
  INSERT INTO assignments (title, description, initial_code, expected_output, group_name, created_by_teacher_id, created_at)
  VALUES
    ('Задача 1: Переменные',
     'Создайте переменную name со значением "C#" и выведите её на консоль.',
     E'string name = "C#";\nConsole.WriteLine(name);',
     'C#',
     'ИСП-212',
     teacher_id,
     NOW())
  ON CONFLICT DO NOTHING;

  -- Assignment 4: Arithmetic (ИСП-212)
  INSERT INTO assignments (title, description, initial_code, expected_output, group_name, created_by_teacher_id, created_at)
  VALUES
    ('Задача 2: Умножение',
     'Напишите программу, которая выводит результат умножения 7 * 6.',
     E'Console.WriteLine(7 * 6);',
     '42',
     'ИСП-212',
     teacher_id,
     NOW())
  ON CONFLICT DO NOTHING;

  -- Assignment 5: Hello World (ПРО-111)
  INSERT INTO assignments (title, description, initial_code, expected_output, group_name, created_by_teacher_id, created_at)
  VALUES
    ('Задача 1: Hello World',
     'Напишите программу, которая выводит "Hello, World!" на консоль.',
     E'Console.WriteLine("Hello, World!");',
     'Hello, World!',
     'ПРО-111',
     teacher_id,
     NOW())
  ON CONFLICT DO NOTHING;

  -- Assignment 6: Hello World (ПРО-112)
  INSERT INTO assignments (title, description, initial_code, expected_output, group_name, created_by_teacher_id, created_at)
  VALUES
    ('Задача 1: Hello World',
     'Напишите программу, которая выводит "Hello, World!" на консоль.',
     E'Console.WriteLine("Hello, World!");',
     'Hello, World!',
     'ПРО-112',
     teacher_id,
     NOW())
  ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 4. Verify results
-- =============================================================================
SELECT '--- Students ---' AS info;
SELECT id, username, full_name, group_name FROM users WHERE role = 'student' ORDER BY id;

SELECT '--- Teacher ---' AS info;
SELECT id, username, role, full_name, group_name FROM users WHERE role = 'teacher' ORDER BY id;

SELECT '--- Assignments ---' AS info;
SELECT id, title, group_name FROM assignments ORDER BY id;

COMMIT;
