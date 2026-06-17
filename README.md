# C# Practicum

Веб-платформа для проведения практических работ по C#: студент пишет код в браузере, сервер компилирует и запускает решение, преподаватель создает задания, открывает учебные сессии и оценивает работы.

## Стек
- Backend: Go 1.23, chi, PostgreSQL 16, JWT, bcrypt, WebSocket.
- Frontend: React 18, TypeScript, Vite, Monaco Editor.
- Runtime выполнения C#: .NET SDK/Runtime 8.0.
- Production: Docker Compose, Caddy, Nginx, PostgreSQL.

## Быстрый запуск на сервере
```bash
cp .env.example .env
nano .env
docker compose up -d --build
```

Подробная инструкция для Ubuntu VPS/Timeweb: `deploy/deploy_ubuntu_timeweb.md`.

## Основные переменные окружения
- `DOMAIN` - домен проекта.
- `POSTGRES_PASSWORD` - пароль базы данных.
- `JWT_SECRET` - секрет JWT не короче 32 символов.
- `TEACHER_SETUP_TOKEN` - одноразовый токен регистрации преподавателя.
- `ALLOWED_ORIGINS` и `ALLOWED_WS_ORIGINS` - разрешенные домены фронтенда.
- `COMPILER_SANDBOX` - `0` для запуска без Docker-in-Docker, `1` для песочницы Docker при наличии настроенной среды.

## Роли
### Студент
1. Получает ссылку-приглашение от преподавателя.
2. Вводит ФИО.
3. Выбирает задание, пишет код и запускает проверку.
4. Отправляет решение на проверку.

### Преподаватель
1. Регистрируется через одноразовый setup-token.
2. Входит по ФИО и паролю.
3. Создает учебные сессии и задания.
4. Просматривает решения студентов, оценки и комментарии.