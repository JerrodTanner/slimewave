package api

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"slimewave/internal/auth"
	"slimewave/internal/httpx"
	"slimewave/internal/store"
)

type credentials struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

// sessionUser is what the SPA sees. The password hash never leaves the store
// layer, and the JSON tag on store.User already drops it; this type exists so
// the API response shape is explicit.
type sessionUser struct {
	ID          int64  `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	Role        string `json:"role"`
	IsOwner     bool   `json:"isOwner"`
}

func toSessionUser(u store.User) sessionUser {
	return sessionUser{
		ID:          u.ID,
		Email:       u.Email,
		DisplayName: u.DisplayName,
		Role:        u.Role,
		IsOwner:     u.IsOwner(),
	}
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	httpx.NoCache(w)

	var creds credentials
	if err := httpx.DecodeJSON(w, r, &creds); err != nil {
		httpx.Error(w, http.StatusBadRequest, "malformed request body")
		return
	}

	user, err := s.store.UserByEmail(creds.Email)
	if err != nil {
		// Same message and roughly the same work either way, so a wrong email
		// is not distinguishable from a wrong password.
		if !errors.Is(err, store.ErrNotFound) {
			log.Printf("api: lookup user: %v", err)
		}
		auth.CheckPassword("$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv", creds.Password)
		httpx.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if !auth.CheckPassword(user.PasswordHash, creds.Password) {
		httpx.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	if err := s.auth.StartSession(w, user.ID); err != nil {
		log.Printf("api: start session: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not start a session")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"user": toSessionUser(user)})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	httpx.NoCache(w)
	if err := s.auth.EndSession(w, r); err != nil {
		log.Printf("api: end session: %v", err)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"user": nil})
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	httpx.NoCache(w)

	if !s.cfg.AllowRegistration {
		httpx.Error(w, http.StatusForbidden, "registration is closed on this site")
		return
	}

	var creds credentials
	if err := httpx.DecodeJSON(w, r, &creds); err != nil {
		httpx.Error(w, http.StatusBadRequest, "malformed request body")
		return
	}
	email := strings.TrimSpace(creds.Email)
	if !strings.Contains(email, "@") || len(email) < 3 {
		httpx.Error(w, http.StatusBadRequest, "that does not look like an email address")
		return
	}

	hash, err := auth.HashPassword(creds.Password)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	displayName := strings.TrimSpace(creds.DisplayName)
	if displayName == "" {
		displayName = email[:strings.Index(email, "@")]
	}

	user, err := s.store.CreateUser(email, displayName, hash, store.RoleVisitor)
	if errors.Is(err, store.ErrEmailTaken) {
		httpx.Error(w, http.StatusConflict, "that email is already registered")
		return
	}
	if err != nil {
		log.Printf("api: create user: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not create the account")
		return
	}

	if err := s.auth.StartSession(w, user.ID); err != nil {
		log.Printf("api: start session: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "account created, but sign-in failed")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"user": toSessionUser(user)})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	httpx.NoCache(w)
	user, ok := auth.UserFrom(r.Context())
	if !ok {
		// Not an error: the SPA asks on every load and anonymous is normal.
		httpx.JSON(w, http.StatusOK, map[string]any{
			"user":             nil,
			"registrationOpen": s.cfg.AllowRegistration,
		})
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"user":             toSessionUser(user),
		"registrationOpen": s.cfg.AllowRegistration,
	})
}
