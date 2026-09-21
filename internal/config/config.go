// Package config reads the handful of knobs the server needs from the
// environment. Everything has a sane default so `go run ./cmd/slimewave`
// works from a fresh checkout with no setup.
package config

import (
	"os"
	"path/filepath"
	"strconv"
	"time"
)

type Config struct {
	// Addr is the listen address, e.g. ":8001".
	Addr string
	// DBPath is the SQLite file. Its directory is created on startup.
	DBPath string
	// AudioDir holds the music library, laid out as Artist/Album/Track.mp3.
	AudioDir string
	// DocsDir holds downloadable files (resume PDF and friends).
	DocsDir string
	// WebDir holds the built SPA. Missing is fine in dev: the Vite dev
	// server serves the frontend and proxies the API here.
	WebDir string

	// SessionTTL is how long a login lasts.
	SessionTTL time.Duration
	// SecureCookies marks the session cookie Secure. Off by default so
	// plain-HTTP localhost works; the deployment sets it.
	SecureCookies bool
	// AllowRegistration opens /api/auth/register to the public. Off by
	// default: this is a personal site, not a signup funnel.
	AllowRegistration bool

	// AdminEmail/AdminPassword seed the owner account on first run. If the
	// account already exists they are ignored.
	AdminEmail    string
	AdminPassword string
}

func Load() Config {
	c := Config{
		Addr:              env("SLIMEWAVE_ADDR", ":8001"),
		DBPath:            env("SLIMEWAVE_DB", filepath.Join("data", "slimewave.db")),
		AudioDir:          env("SLIMEWAVE_AUDIO_DIR", "audio"),
		DocsDir:           env("SLIMEWAVE_DOCS_DIR", "PDFs"),
		WebDir:            env("SLIMEWAVE_WEB_DIR", filepath.Join("web", "build")),
		SessionTTL:        envDuration("SLIMEWAVE_SESSION_TTL", 30*24*time.Hour),
		SecureCookies:     envBool("SLIMEWAVE_SECURE_COOKIES", false),
		AllowRegistration: envBool("SLIMEWAVE_ALLOW_REGISTRATION", false),
		AdminEmail:        os.Getenv("SLIMEWAVE_ADMIN_EMAIL"),
		AdminPassword:     os.Getenv("SLIMEWAVE_ADMIN_PASSWORD"),
	}
	return c
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}

func envDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}
