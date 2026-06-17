package middleware

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserContextKey contextKey = "user"

type UserClaims struct {
	UserID    int    `json:"user_id"`
	FullName  string `json:"full_name"`
	Role      string `json:"role"`
	SessionID *int   `json:"session_id,omitempty"`
	jwt.RegisteredClaims
}

func GenerateToken(userID int, fullName, role string, sessionID *int) (string, error) {
	secret, err := jwtSecret()
	if err != nil {
		return "", err
	}

	expHours := 24
	if v := os.Getenv("JWT_EXPIRATION_HOURS"); v != "" {
		if h, err := strconv.Atoi(v); err == nil && h > 0 {
			expHours = h
		}
	}

	claims := UserClaims{
		UserID:    userID,
		FullName:  fullName,
		Role:      role,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseUserToken(rawToken string) (*UserClaims, error) {
	secret, err := jwtSecret()
	if err != nil {
		return nil, err
	}

	claims := &UserClaims{}
	token, err := jwt.ParseWithClaims(rawToken, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	}, jwt.WithExpirationRequired())

	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}
	return claims, nil
}

func JWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rawToken, ok := bearerToken(r)
		if !ok {
			http.Error(w, `{"error":"missing token"}`, http.StatusUnauthorized)
			return
		}

		claims, err := ParseUserToken(rawToken)
		if err != nil {
			status := http.StatusUnauthorized
			if strings.Contains(err.Error(), "JWT_SECRET") {
				status = http.StatusInternalServerError
			}
			http.Error(w, `{"error":"invalid or expired token"}`, status)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func bearerToken(r *http.Request) (string, bool) {
	authHeader := r.Header.Get("Authorization")
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
		return "", false
	}
	return strings.TrimSpace(parts[1]), true
}

func jwtSecret() (string, error) {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" && os.Getenv("APP_ENV") != "production" {
		return "dev-secret-change-me-dev-secret-change-me", nil
	}
	if len(secret) < 32 {
		return "", errors.New("JWT_SECRET must contain at least 32 characters")
	}
	return secret, nil
}

func GetUserFromContext(r *http.Request) *UserClaims {
	if c, ok := r.Context().Value(UserContextKey).(*UserClaims); ok {
		return c
	}
	return nil
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			u := GetUserFromContext(r)
			if u == nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			for _, role := range roles {
				if u.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		})
	}
}
