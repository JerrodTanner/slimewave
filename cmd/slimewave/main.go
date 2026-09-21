// Command slimewave is the whole server: JSON API, media file server and the
// built SPA, in one process.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"slimewave/internal/api"
	"slimewave/internal/auth"
	"slimewave/internal/config"
	"slimewave/internal/media"
	"slimewave/internal/store"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("slimewave: %v", err)
	}
}

func run() error {
	cfg := config.Load()

	st, err := store.Open(cfg.DBPath)
	if err != nil {
		return err
	}
	defer st.Close()

	if err := seedOwner(st, cfg); err != nil {
		return err
	}

	// Expired rows are dead weight, not a security boundary — the lookup
	// already refuses them. Sweeping once at startup is enough.
	if n, err := st.PurgeExpiredSessions(); err != nil {
		log.Printf("purge sessions: %v", err)
	} else if n > 0 {
		log.Printf("purged %d expired session(s)", n)
	}

	lib := media.NewLibrary(cfg.AudioDir)
	if err := lib.Scan(); err != nil {
		// An empty or missing audio dir is a normal state for a fresh
		// checkout; the music pages just come back empty.
		log.Printf("music: scan %s: %v", cfg.AudioDir, err)
	} else {
		log.Printf("music: indexed %d artist(s) from %s", len(lib.Artists()), cfg.AudioDir)
	}

	am := auth.NewManager(st, cfg.SessionTTL, cfg.SecureCookies)
	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           api.NewServer(cfg, st, am, lib).Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       60 * time.Second,
		// No WriteTimeout: audio range requests stream for as long as the
		// client is listening.
	}

	errc := make(chan error, 1)
	go func() {
		log.Printf("listening on %s", cfg.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errc <- err
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case err := <-errc:
		return err
	case <-ctx.Done():
	}

	log.Print("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

// seedOwner creates the owner account on first run. It is a no-op once any
// account exists, so the env vars can stay set in the deployment.
func seedOwner(st *store.Store, cfg config.Config) error {
	if cfg.AdminEmail == "" || cfg.AdminPassword == "" {
		return nil
	}
	n, err := st.CountUsers()
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	hash, err := auth.HashPassword(cfg.AdminPassword)
	if err != nil {
		return err
	}
	if _, err := st.CreateUser(cfg.AdminEmail, "Owner", hash, store.RoleOwner); err != nil {
		return err
	}
	log.Printf("seeded owner account %s", cfg.AdminEmail)
	return nil
}
