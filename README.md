# C# Практикум  Интерактивная платформа для изучения C# с автоматической проверкой кода.

## Возможности 
**Для студентов**
* Написание кода в браузере с подсветкой синтаксиса (Monaco Editor)

- Мгновенная компиляция и проверка C# кода

- Автоматическая обратная связь о результате

- Сохранение черновиков и личных проектов

**Для преподавателей**
* Управление заданиями

- Статистика успеваемости группы

- Оценивание с комментариями

- Просмотр всех решений студентов

**Технологии**

*Backend* 
- Go 1.21 — высокопроизводительный сервер

- SQLite — база данных

- Chi — роутер

- JWT — авторизация

- Выполнение C# на сервере через .NET SDK (консольное приложение)

*Frontend* 
* React 18 — интерфейс

- TypeScript — типизация

- Vite — сборка

- Monaco Editor — редактор кода (как в VS Code)

**Быстрый старт**

Требования
-   Go 1.21+
  
- Node.js 18+

- .NET SDK 8+ (для компиляции и запуска примеров C# на машине с API)

- Docker (опционально)

## **Локальный запуск**

**Клонирование**

```bash
git clone https://github.com/arvle/csharp-practicum.git

cd csharp-practicum
```

**Бэкенд**

```bash
cd backend

go mod download

go run cmd/api/main.go
```

**Фронтенд (новый терминал)**

```bash
cd frontend

npm install

npm run dev
```

Запуск через Docker

```bash
docker-compose up --build
```
Открыть http://localhost:5173

## **API Endpoints**

POST /api/auth/student/login Вход студента

POST /api/auth/teacher/login Вход преподавателя

GET /api/assignments Получить все задания

POST /api/assignments Создать задание

POST /api/submissions Отправить решение

POST /api/submissions/{id}/grade Оценить решение
