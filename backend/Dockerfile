FROM golang:1.21-alpine AS builder

# Устанавливаем gcc и musl-dev для CGO
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Включаем CGO и собираем
RUN CGO_ENABLED=1 GOOS=linux go build -a -o main ./cmd/api/main.go

# Финальный этап — используем alpine с gcc
FROM alpine:latest

# Устанавливаем ca-certificates и sqlite
RUN apk --no-cache add ca-certificates sqlite

WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]