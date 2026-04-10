FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO disabled — pgx driver is pure Go, no C compiler needed
RUN CGO_ENABLED=0 GOOS=linux go build -a -o main ./cmd/api/main.go

# Final stage — Alpine + .NET 8 SDK for C# compilation
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS runtime

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S -G appgroup -h /home/appuser appuser

RUN apk --no-cache add ca-certificates

WORKDIR /home/appuser/

COPY --from=builder /app/main .

RUN chown appuser:appgroup main

USER appuser:appgroup

EXPOSE 8080

CMD ["./main"]