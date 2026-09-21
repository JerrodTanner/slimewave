package api

import (
	"log"
	"net/http"

	"slimewave/internal/httpx"
)

func (s *Server) handleLibrary(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]any{"artists": s.library.Artists()})
}

func (s *Server) handleArtists(w http.ResponseWriter, r *http.Request) {
	// The artist index only needs names and album counts.
	type artistSummary struct {
		Name       string `json:"name"`
		AlbumCount int    `json:"albumCount"`
		TrackCount int    `json:"trackCount"`
		CoverURL   string `json:"coverUrl"`
	}

	artists := s.library.Artists()
	out := make([]artistSummary, 0, len(artists))
	for _, a := range artists {
		summary := artistSummary{Name: a.Name, AlbumCount: len(a.Albums)}
		for _, al := range a.Albums {
			summary.TrackCount += len(al.Tracks)
			if summary.CoverURL == "" {
				summary.CoverURL = al.CoverURL
			}
		}
		out = append(out, summary)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"artists": out})
}

func (s *Server) handleArtist(w http.ResponseWriter, r *http.Request) {
	artist, ok := s.library.Artist(r.PathValue("artist"))
	if !ok {
		httpx.Error(w, http.StatusNotFound, "no such artist")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"artist": artist})
}

func (s *Server) handleAlbum(w http.ResponseWriter, r *http.Request) {
	album, ok := s.library.Album(r.PathValue("artist"), r.PathValue("album"))
	if !ok {
		httpx.Error(w, http.StatusNotFound, "no such album")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"album": album})
}

// handleRescan re-reads the audio directory. Owner-only, because walking the
// tree is the one endpoint here that does real disk work.
func (s *Server) handleRescan(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireOwner(w, r); !ok {
		return
	}
	httpx.NoCache(w)

	if err := s.library.Scan(); err != nil {
		log.Printf("api: rescan library: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not rescan the library")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"artists": s.library.Artists()})
}
