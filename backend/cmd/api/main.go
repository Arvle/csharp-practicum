package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"CSharpPracticum/internal/config"
	"CSharpPracticum/internal/handlers"
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/services"
	"CSharpPracticum/pkg/database"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"golang.org/x/time/rate"
)

func main() {
	cfg := config.Load()
	log.Printf("Starting C# Practicum API in %s mode", cfg.AppEnv)

	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection error: %v", err)
	}
	defer db.Close()

	if err := database.InitSchema(db.SQL()); err != nil {
		log.Fatalf("schema initialization error: %v", err)
	}

	compilerSvc := services.NewCompilerService()
	router := buildRouter(cfg, db, compilerSvc)

	srv := &http.Server{
		Addr:         "0.0.0.0:" + cfg.Port,
		Handler:      router,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	go func() {
		log.Printf("API server listening on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	log.Println("Shutting down API server...")
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}

func buildRouter(cfg config.Config, db database.Queryer, compilerSvc *services.CompilerService) http.Handler {
	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Recoverer)
	r.Use(limitRequestBody(cfg.MaxRequestBodyBytes))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	rateLimiter := middleware.NewIPRateLimiter(rate.Limit(cfg.RateLimitRPS), cfg.RateLimitBurst)
	r.Use(rateLimiter.RateLimit)

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	r.Head("/health", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })

	sqlDB := db.SQL()
	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/teacher/setup", handlers.TeacherSetup(sqlDB))
		r.Post("/auth/teacher/login", handlers.TeacherLogin(sqlDB))
		r.Post("/auth/join", handlers.JoinSession(sqlDB))

		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth)
			r.Get("/assignments", handlers.GetAssignments(sqlDB))
			r.Post("/submissions", handlers.CreateSubmission(sqlDB, compilerSvc, cfg.CompilerTimeout))
			r.Get("/submissions", handlers.GetSubmissions(sqlDB))
			r.Get("/drafts/{assignmentID}", handlers.GetDraft(sqlDB))
			r.Put("/drafts/{assignmentID}", handlers.SaveDraft(sqlDB))
			r.Post("/execute", handlers.ExecuteCodeWithCompiler(compilerSvc, cfg.CompilerTimeout))
			r.Get("/sessions/{id}/participants", handlers.GetSessionParticipantsCount(sqlDB))
			r.Get("/sessions/{id}/participants/list", handlers.GetSessionParticipants(sqlDB))
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth)
			r.Use(middleware.RequireRole("teacher"))
			r.Post("/sessions", handlers.CreateSession(sqlDB))
			r.Get("/sessions/teacher", handlers.GetTeacherSessions(sqlDB))
			r.Delete("/sessions/{id}", handlers.RevokeSession(sqlDB))
			r.Patch("/sessions/{id}/refresh-token", handlers.RefreshSessionToken(sqlDB))
			r.Post("/assignments", handlers.CreateAssignment(sqlDB))
			r.Patch("/assignments/{id}", handlers.UpdateAssignment(sqlDB))
			r.Post("/assignments/{id}/resources", handlers.UploadResource(sqlDB, cfg.UploadDir))
			r.Delete("/assignments/{id}", handlers.DeleteAssignment(sqlDB))
			r.Post("/submissions/{id}/grade", handlers.GradeSubmission(sqlDB))
		})

		r.Get("/execute/ws", handlers.NewInteractiveExecutor(compilerSvc).ServeWS())
	})
	return r
}

func limitRequestBody(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Body != nil && maxBytes > 0 {
				r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			}
			next.ServeHTTP(w, r)
		})
	}
}
