# Этап 1: Сборка фронтенда
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Этап 2: Сборка бэкенда
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN go build -o csharppracticum ./cmd/api

# Этап 3: Финальный образ
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=backend-builder /app/csharppracticum .
COPY --from=backend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
CMD ["./csharppracticum"]
