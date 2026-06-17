package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

const (
	rateLimiterEntryTTL     = 15 * time.Minute
	rateLimiterPruneEvery   = 5 * time.Minute
	rateLimiterMaxIPEntries = 10000
)

type ipVisitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type IPRateLimiter struct {
	ips map[string]*ipVisitor
	mu  sync.RWMutex
	r   rate.Limit
	b   int
}

func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	limiter := &IPRateLimiter{
		ips: make(map[string]*ipVisitor),
		r:   r,
		b:   b,
	}

	go limiter.pruneLoop()

	return limiter
}

func (i *IPRateLimiter) AddIP(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.addIPLocked(ip)
}

func (i *IPRateLimiter) addIPLocked(ip string) *rate.Limiter {
	now := time.Now()
	limiter := rate.NewLimiter(i.r, i.b)
	i.ips[ip] = &ipVisitor{limiter: limiter, lastSeen: now}
	return limiter
}

func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	if visitor, exists := i.ips[ip]; exists {
		visitor.lastSeen = time.Now()
		return visitor.limiter
	}

	return i.addIPLocked(ip)
}

func (i *IPRateLimiter) pruneLoop() {
	ticker := time.NewTicker(rateLimiterPruneEvery)
	defer ticker.Stop()

	for range ticker.C {
		i.prune(time.Now())
	}
}

func (i *IPRateLimiter) prune(now time.Time) {
	i.mu.Lock()
	defer i.mu.Unlock()

	cutoff := now.Add(-rateLimiterEntryTTL)
	for ip, visitor := range i.ips {
		if visitor.lastSeen.Before(cutoff) {
			delete(i.ips, ip)
		}
	}

	if len(i.ips) <= rateLimiterMaxIPEntries {
		return
	}

	for len(i.ips) > rateLimiterMaxIPEntries {
		var oldestIP string
		var oldestTime time.Time
		for ip, visitor := range i.ips {
			if oldestIP == "" || visitor.lastSeen.Before(oldestTime) {
				oldestIP = ip
				oldestTime = visitor.lastSeen
			}
		}
		if oldestIP == "" {
			return
		}
		delete(i.ips, oldestIP)
	}
}

func (i *IPRateLimiter) RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}

		limiter := i.GetLimiter(ip)
		if !limiter.Allow() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "rate limit exceeded, try again later",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}
