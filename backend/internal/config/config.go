package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv              string
	Port                string
	DatabaseURL         string
	AllowedOrigins      []string
	AllowedWSOrigins    []string
	RateLimitRPS        float64
	RateLimitBurst      int
	RequestTimeout      time.Duration
	ReadTimeout         time.Duration
	WriteTimeout        time.Duration
	IdleTimeout         time.Duration
	CompilerTimeout     time.Duration
	UploadDir           string
	MaxRequestBodyBytes int64
}

func Load() Config {
	return Config{
		AppEnv:              env("APP_ENV", "development"),
		Port:                env("PORT", "8080"),
		DatabaseURL:         os.Getenv("DATABASE_URL"),
		AllowedOrigins:      listEnv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80,http://localhost:5173"),
		AllowedWSOrigins:    listEnv("ALLOWED_WS_ORIGINS", "http://localhost,http://localhost:80,http://localhost:5173"),
		RateLimitRPS:        floatEnv("RATE_LIMIT_REQUESTS_PER_SECOND", 5),
		RateLimitBurst:      intEnv("RATE_LIMIT_BURST", 20),
		RequestTimeout:      durationEnv("REQUEST_TIMEOUT_SECONDS", 60),
		ReadTimeout:         durationEnv("READ_TIMEOUT_SECONDS", 15),
		WriteTimeout:        durationEnv("WRITE_TIMEOUT_SECONDS", 60),
		IdleTimeout:         durationEnv("IDLE_TIMEOUT_SECONDS", 120),
		CompilerTimeout:     durationEnv("COMPILER_TIMEOUT_SECONDS", 30),
		UploadDir:           env("UPLOAD_DIR", "./uploads"),
		MaxRequestBodyBytes: int64(intEnv("MAX_REQUEST_BODY_MB", 2)) << 20,
	}
}

func env(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func listEnv(key, def string) []string {
	raw := env(key, def)
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func intEnv(key string, def int) int {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return def
}

func floatEnv(key string, def float64) float64 {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if n, err := strconv.ParseFloat(v, 64); err == nil && n > 0 {
			return n
		}
	}
	return def
}

func durationEnv(key string, defSeconds int) time.Duration {
	return time.Duration(intEnv(key, defSeconds)) * time.Second
}
