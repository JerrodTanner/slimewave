package api

import (
	"encoding/json"
	"log"
	"net/http"

	"slimewave/internal/auth"
	"slimewave/internal/httpx"
	"slimewave/internal/store"
)

// Preferences are optional. Anonymous visitors keep theirs in localStorage
// and never call these endpoints; signing in is what makes them portable.
func (s *Server) handleGetPreferences(w http.ResponseWriter, r *http.Request) {
	httpx.NoCache(w)

	user, ok := auth.UserFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "sign in to sync preferences")
		return
	}

	prefs, err := s.store.PreferencesFor(user.ID)
	if err != nil {
		log.Printf("api: load preferences: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not load preferences")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"preferences": prefs})
}

func (s *Server) handlePutPreferences(w http.ResponseWriter, r *http.Request) {
	httpx.NoCache(w)

	user, ok := auth.UserFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "sign in to sync preferences")
		return
	}

	var in struct {
		Theme string          `json:"theme"`
		Data  json.RawMessage `json:"data"`
	}
	if err := httpx.DecodeJSON(w, r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, "malformed request body")
		return
	}
	if len(in.Data) == 0 {
		in.Data = json.RawMessage(`{}`)
	}
	if !json.Valid(in.Data) {
		httpx.Error(w, http.StatusBadRequest, "data must be a JSON value")
		return
	}

	prefs := store.Preferences{Theme: in.Theme, Data: in.Data}
	if err := s.store.SavePreferences(user.ID, prefs); err != nil {
		log.Printf("api: save preferences: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not save preferences")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"preferences": prefs})
}
