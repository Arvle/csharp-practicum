FROM golang:1.23-bookworm AS builder

WORKDIR /app
COPY go.mod ./
COPY go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -extldflags '-static'" \
    -trimpath \
    -o /bin/api ./cmd/api

FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates wget tzdata && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --create-home --shell /bin/bash appuser

WORKDIR /home/appuser
COPY --from=builder --chown=appuser:appgroup /bin/api /usr/local/bin/api
RUN mkdir -p /home/appuser/uploads /tmp/csharp-practicum-cache && \
    chown -R appuser:appgroup /home/appuser /tmp/csharp-practicum-cache

ENV APP_ENV=production \
    TZ=Europe/Moscow \
    COMPILER_SANDBOX=0 \
    PORT=8080 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health || exit 1

EXPOSE 8080
USER appuser:appgroup
ENTRYPOINT ["/usr/local/bin/api"]