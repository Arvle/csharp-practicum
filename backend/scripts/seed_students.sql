-- Seed students for PostgreSQL.
-- Safe to run multiple times: existing students are updated.
--
-- Usage:
-- psql "postgres://postgres:postgres@localhost:5432/csharppracticum?sslmode=disable" -f backend/scripts/seed_students.sql

INSERT INTO users (username, role, full_name, student_id, group_name, created_at, last_login_at)
VALUES
  ('S1001', 'student', 'Иванов Иван Иванович', 'S1001', 'ИСП-211', NOW(), NOW()),
  ('S1002', 'student', 'Петров Петр Петрович', 'S1002', 'ИСП-211', NOW(), NOW()),
  ('S1003', 'student', 'Сидорова Анна Сергеевна', 'S1003', 'ИСП-212', NOW(), NOW()),
  ('S1004', 'student', 'Козлов Дмитрий Олегович', 'S1004', 'ИСП-212', NOW(), NOW()),
  ('S1005', 'student', 'Смирнова Мария Игоревна', 'S1005', 'ПРО-111', NOW(), NOW()),
  ('S1006', 'student', 'Орлов Никита Андреевич', 'S1006', 'ПРО-112', NOW(), NOW())
ON CONFLICT (student_id) DO UPDATE
SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  group_name = EXCLUDED.group_name;
