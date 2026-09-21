// Package api wires the JSON API and the static handlers into one mux.
//
// Go's job in this project is exactly this: an API plus a file server. Page
// rendering belongs to the SPA, so there are no templates here.
package api

import (
	"net/http"
	"time"

	"slimewave/internal/auth"
	"slimewave/internal/config"
	"slimewave/internal/httpx"
	"slimewave/internal/media"
	"slimewave/internal/store"
)

type Server struct {
	cfg     config.Config
	store   *store.Store
	auth    *auth.Manager
	library *media.Library
}

func NewServer(cfg config.Config, st *store.Store, am *auth.Manager, lib *media.Library) *Server {
	return &Server{cfg: cfg, store: st, auth: am, library: lib}
}

// Handler builds the full routing tree.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	// --- auth ---
	mux.HandleFunc("POST /api/auth/login", s.handleLogin)
	mux.HandleFunc("POST /api/auth/logout", s.handleLogout)
	mux.HandleFunc("POST /api/auth/register", s.handleRegister)
	mux.HandleFunc("GET /api/auth/me", s.handleMe)

	// --- preferences (theme sync) ---
	mux.HandleFunc("GET /api/preferences", s.handleGetPreferences)
	mux.HandleFunc("PUT /api/preferences", s.handlePutPreferences)

	// --- documents ---
	mux.HandleFunc("GET /api/documents", s.handleListDocuments)
	mux.HandleFunc("POST /api/documents", s.handleCreateDocument)
	mux.HandleFunc("GET /api/documents/{slug}", s.handleGetDocument)
	mux.HandleFunc("PUT /api/documents/{slug}", s.handleUpdateDocument)
	mux.HandleFunc("DELETE /api/documents/{slug}", s.handleDeleteDocument)

	// --- music ---
	mux.HandleFunc("GET /api/music/library", s.handleLibrary)
	mux.HandleFunc("GET /api/music/artists", s.handleArtists)
	mux.HandleFunc("GET /api/music/artists/{artist}", s.handleArtist)
	mux.HandleFunc("GET /api/music/artists/{artist}/albums/{album}", s.handleAlbum)
	mux.HandleFunc("POST /api/music/rescan", s.handleRescan)

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Unmatched /api paths must 404 as JSON rather than fall through to the
	// SPA, which would hand the client an HTML page where it expects JSON.
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		httpx.Error(w, http.StatusNotFound, "no such endpoint")
	})

	// --- files ---
	mux.Handle("GET /media/audio/", media.NewFileServer(s.cfg.AudioDir, "/media/audio/", 24*time.Hour))
	mux.Handle("HEAD /media/audio/", media.NewFileServer(s.cfg.AudioDir, "/media/audio/", 24*time.Hour))
	mux.Handle("GET /media/docs/", media.NewFileServer(s.cfg.DocsDir, "/media/docs/", time.Hour))
	mux.Handle("HEAD /media/docs/", media.NewFileServer(s.cfg.DocsDir, "/media/docs/", time.Hour))

	// --- the SPA, last, catching everything else ---
	mux.Handle("/", httpx.NewSPAHandler(s.cfg.WebDir))

	return s.auth.Attach(securityHeaders(mux))
}

// securityHeaders sets the handful of headers worth setting unconditionally.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		next.ServeHTTP(w, r)
	})
}

// requireOwner returns the caller if they are the site owner, writing the
// error response and returning false otherwise.
func (s *Server) requireOwner(w http.ResponseWriter, r *http.Request) (store.User, bool) {
	user, ok := auth.UserFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "sign in first")
		return store.User{}, false
	}
	if !user.IsOwner() {
		httpx.Error(w, http.StatusForbidden, "owner access required")
		return store.User{}, false
	}
	return user, true
}
