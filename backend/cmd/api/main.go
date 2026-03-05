package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"CSharpPracticumGo/internal/handlers"
	"CSharpPracticumGo/internal/middleware"
	"CSharpPracticumGo/pkg/database"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	db, err := database.NewSQLiteDB("csharppracticum.db")
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}
	defer db.Close()

	if err := database.InitSchema(db); err != nil {
		log.Fatal("❌ Failed to init database:", err)
	}

	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Compress(5))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestLogger)

	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/student/login", handlers.StudentLogin(db))
		r.Post("/auth/teacher/login", handlers.TeacherLogin(db))

		r.Get("/assignments", handlers.GetAssignments(db))
		r.Get("/assignments/{id}", handlers.GetAssignment(db))
		r.Post("/assignments", handlers.CreateAssignment(db))
		r.Put("/assignments/{id}", handlers.UpdateAssignment(db))
		r.Delete("/assignments/{id}", handlers.DeleteAssignment(db))

		r.Post("/submissions", handlers.CreateSubmission(db))
		r.Get("/submissions/assignment/{assignmentId}", handlers.GetSubmissionsByAssignment(db))
		r.Get("/submissions/student/{studentId}", handlers.GetStudentSubmissions(db))
		r.Post("/submissions/{id}/grade", handlers.GradeSubmission(db))
	})

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"name":        "C# Практикум API",
			"version":     "1.0.0",
			"status":      "running",
			"environment": os.Getenv("ENV"),
			"endpoints": []string{
				"GET  /api/assignments",
				"GET  /api/assignments/{id}",
				"POST /api/assignments",
				"PUT  /api/assignments/{id}",
				"DELETE /api/assignments/{id}",
				"POST /api/auth/student/login",
				"POST /api/auth/teacher/login",
				"POST /api/submissions",
				"GET  /api/submissions/assignment/{assignmentId}",
				"GET  /api/submissions/student/{studentId}",
				"POST /api/submissions/{id}/grade",
			},
			"frontend": "http://localhost:5173 (run separately)",
		}
		json.NewEncoder(w).Encode(response)
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		dbStatus := "ok"
		if err := db.Ping(); err != nil {
			dbStatus = "error: " + err.Error()
		}

		response := map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"database":  dbStatus,
			"version":   "1.0.0",
		}
		json.NewEncoder(w).Encode(response)
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Endpoint not found",
			"path":  r.URL.Path,
			"available_endpoints": []string{
				"/api/...",
				"/health",
				"/",
			},
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("🚀 API Server started on http://localhost:%s", port)
		log.Printf("📚 API Documentation available at http://localhost:%s/", port)
		log.Printf("🔄 Frontend should be started separately: cd frontend && npm run dev")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ listen: %s\n", err)
		}
	}()

	<-done
	log.Println("🛑 Server stopped")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("❌ Server shutdown failed: %+v", err)
	}
	log.Println("✅ Server exited properly")
}
