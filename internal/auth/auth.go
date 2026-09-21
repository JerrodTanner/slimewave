// Package auth handles password hashing, session cookies and the request
// context plumbing that tells a handler who is calling.
package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"slimewave/internal/store"
)

// CookieName is the session cookie. It is HttpOnly, so the SPA never sees
// the token — it calls /api/auth/me to find out who it is.
const CookieName = "slimewave_session"

// MinPasswordLength is deliberately modest; length is enforced, composition
// rules are not, because composition rules mostly produce worse passwords.
const MinPasswordLength = 10

var ErrWeakPassword = errors.New("password must be at least 10 characters")

type Manager struct {
	store      *store.Store
	ttl        time.Duration
	secure     bool
	cookiePath string
}

func NewManager(s *store.Store, ttl time.Duration, secure bool) *Manager {
	return &Manager{store: s, ttl: ttl, secure: secure, cookiePath: "/"}
}

// HashPassword returns a bcrypt hash, rejecting passwords that are too short.
func HashPassword(password string) (string, error) {
	if len(password) < MinPasswordLength {
		return "", ErrWeakPassword
	}
	// bcrypt silently truncates past 72 bytes; refuse rather than surprise.
	if len(password) > 72 {
		return "", errors.New("password must be at most 72 bytes")
	}
	h, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(h), nil
}

func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// StartSession mints a token, stores only its hash and sets the cookie.
func (m *Manager) StartSession(w http.ResponseWriter, userID int64) error {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	if err := m.store.CreateSession(hashToken(token), userID, m.ttl); err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     m.cookiePath,
		HttpOnly: true,
		Secure:   m.secure,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(m.ttl),
		MaxAge:   int(m.ttl.Seconds()),
	})
	return nil
}

// EndSession deletes the stored session and clears the cookie.
func (m *Manager) EndSession(w http.ResponseWriter, r *http.Request) error {
	if c, err := r.Cookie(CookieName); err == nil && c.Value != "" {
		if err := m.store.DeleteSession(hashToken(c.Value)); err != nil {
			return err
		}
	}
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     m.cookiePath,
		HttpOnly: true,
		Secure:   m.secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	return nil
}

type contextKey struct{}

var userKey contextKey

// Attach resolves the session cookie (if any) and stashes the user on the
// request context. It never rejects a request: handlers decide what they
// require.
func (m *Manager) Attach(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(CookieName)
		if err != nil || strings.TrimSpace(c.Value) == "" {
			next.ServeHTTP(w, r)
			return
		}
		user, err := m.store.UserBySessionToken(hashToken(c.Value))
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userKey, user)))
	})
}

// UserFrom returns the authenticated user, if there is one.
func UserFrom(ctx context.Context) (store.User, bool) {
	u, ok := ctx.Value(userKey).(store.User)
	return u, ok
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
