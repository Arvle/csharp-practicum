package middleware

import (
	"fmt"
	"net/http"
	"time"
)

func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		wrw := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(wrw, r)

		duration := time.Since(start)

		methodColor := map[string]string{
			"GET":    "\033[34m",
			"POST":   "\033[32m",
			"PUT":    "\033[33m",
			"DELETE": "\033[31m",
		}

		statusEmoji := map[int]string{
			200: "✅",
			201: "✅",
			204: "✅",
			400: "⚠️",
			401: "🔒",
			403: "🚫",
			404: "❓",
			500: "💥",
		}

		emoji := statusEmoji[wrw.statusCode]
		if emoji == "" {
			emoji = "❓"
		}

		color := methodColor[r.Method]
		reset := "\033[0m"

		logMsg := fmt.Sprintf("%s %s%-7s%s %s %d %s %v",
			emoji,
			color, r.Method, reset,
			r.URL.Path,
			wrw.statusCode,
			time.Now().Format("15:04:05"),
			duration,
		)

		fmt.Println(logMsg)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
