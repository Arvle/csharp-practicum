package middleware

import (
	"fmt"
	"net/http"
	"time"
)

const (
	colorReset  = "\033[0m"
	colorGet    = "\033[34m"
	colorPost   = "\033[32m"
	colorPut    = "\033[33m"
	colorDelete = "\033[31m"
)

var methodColors = map[string]string{
	"GET":    colorGet,
	"POST":   colorPost,
	"PUT":    colorPut,
	"DELETE": colorDelete,
}

var statusEmojis = map[int]string{
	200: "✅",
	201: "✅",
	204: "✅",
	400: "⚠️",
	401: "🔒",
	403: "🚫",
	404: "❓",
	500: "💥",
}

func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		wrw := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(wrw, r)

		duration := time.Since(start)

		emoji := statusEmojis[wrw.statusCode]
		if emoji == "" {
			emoji = "❓"
		}

		methodColor := methodColors[r.Method]
		if methodColor == "" {
			methodColor = colorReset
		}

		logMsg := fmt.Sprintf("%s %s%-7s%s %s %d %s %v",
			emoji,
			methodColor, r.Method, colorReset,
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