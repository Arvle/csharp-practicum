# Развертывание на Ubuntu VPS (Timeweb)

## 1. Подготовка сервера
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

## 2. Загрузка проекта
```bash
git clone <адрес_репозитория> csharp-practicum
cd csharp-practicum
cp .env.example .env
nano .env
```

В `.env` обязательно поменять `DOMAIN`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `TEACHER_SETUP_TOKEN`, `ALLOWED_ORIGINS`, `ALLOWED_WS_ORIGINS`.

## 3. Запуск
```bash
docker compose up -d --build
docker compose ps
```

## 4. Создание преподавателя
Открыть в браузере:
```text
https://ваш-домен/api/auth/teacher/setup?token=TEACHER_SETUP_TOKEN
```
Для удобства можно отправить POST-запрос:
```bash
curl -X POST "https://ваш-домен/api/auth/teacher/setup?token=$TEACHER_SETUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"ФИО преподавателя","password":"НАДЕЖНЫЙ_ПАРОЛЬ"}'
```
После регистрации преподавателя заменить `TEACHER_SETUP_TOKEN` в `.env` на новое случайное значение и выполнить:
```bash
docker compose up -d
```

## 5. Бэкап базы данных
```bash
./deploy/backup_postgres.sh
```

## 6. Обновление
```bash
git pull
docker compose up -d --build
```
