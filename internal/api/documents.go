package api

import (
	"errors"
	"log"
	"net/http"
	"regexp"
	"strings"

	"slimewave/internal/auth"
	"slimewave/internal/httpx"
	"slimewave/internal/store"
)

// slugPattern keeps slugs URL-safe and predictable.
var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func (s *Server) handleListDocuments(w http.ResponseWriter, r *http.Request) {
	user, signedIn := auth.UserFrom(r.Context())
	includeDrafts := signedIn && user.IsOwner() && r.URL.Query().Get("drafts") == "true"
	if includeDrafts {
		httpx.NoCache(w)
	}

	docs, err := s.store.ListDocuments(includeDrafts, r.URL.Query().Get("kind"))
	if err != nil {
		log.Printf("api: list documents: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not load documents")
		return
	}

	// The index view never needs full bodies; leaving them out keeps the
	// payload small when posts get long.
	if r.URL.Query().Get("full") != "true" {
		for i := range docs {
			docs[i].Body = ""
		}
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"documents": docs})
}

func (s *Server) handleGetDocument(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	doc, err := s.store.DocumentBySlug(slug)
	if errors.Is(err, store.ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "no document with that slug")
		return
	}
	if err != nil {
		log.Printf("api: get document: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not load the document")
		return
	}

	if !doc.Published {
		user, ok := auth.UserFrom(r.Context())
		if !ok || !user.IsOwner() {
			// Don't confirm that a draft exists at this slug.
			httpx.Error(w, http.StatusNotFound, "no document with that slug")
			return
		}
		httpx.NoCache(w)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"document": doc})
}

func (s *Server) handleCreateDocument(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireOwner(w, r); !ok {
		return
	}
	httpx.NoCache(w)

	in, ok := decodeDocumentInput(w, r)
	if !ok {
		return
	}

	doc, err := s.store.CreateDocument(in)
	if errors.Is(err, store.ErrSlugTaken) {
		httpx.Error(w, http.StatusConflict, "a document already uses that slug")
		return
	}
	if err != nil {
		log.Printf("api: create document: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not save the document")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"document": doc})
}

func (s *Server) handleUpdateDocument(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireOwner(w, r); !ok {
		return
	}
	httpx.NoCache(w)

	in, ok := decodeDocumentInput(w, r)
	if !ok {
		return
	}

	doc, err := s.store.UpdateDocument(r.PathValue("slug"), in)
	switch {
	case errors.Is(err, store.ErrNotFound):
		httpx.Error(w, http.StatusNotFound, "no document with that slug")
	case errors.Is(err, store.ErrSlugTaken):
		httpx.Error(w, http.StatusConflict, "a document already uses that slug")
	case err != nil:
		log.Printf("api: update document: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not save the document")
	default:
		httpx.JSON(w, http.StatusOK, map[string]any{"document": doc})
	}
}

func (s *Server) handleDeleteDocument(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireOwner(w, r); !ok {
		return
	}
	httpx.NoCache(w)

	err := s.store.DeleteDocument(r.PathValue("slug"))
	if errors.Is(err, store.ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "no document with that slug")
		return
	}
	if err != nil {
		log.Printf("api: delete document: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not delete the document")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func decodeDocumentInput(w http.ResponseWriter, r *http.Request) (store.DocumentInput, bool) {
	var in store.DocumentInput
	if err := httpx.DecodeJSON(w, r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, "malformed request body")
		return store.DocumentInput{}, false
	}

	in.Slug = strings.ToLower(strings.TrimSpace(in.Slug))
	in.Title = strings.TrimSpace(in.Title)
	in.Kind = strings.TrimSpace(in.Kind)
	if in.Kind == "" {
		in.Kind = "note"
	}

	if in.Title == "" {
		httpx.Error(w, http.StatusBadRequest, "a title is required")
		return store.DocumentInput{}, false
	}
	if in.Slug == "" {
		in.Slug = Slugify(in.Title)
	}
	if !slugPattern.MatchString(in.Slug) {
		httpx.Error(w, http.StatusBadRequest,
			"slug must be lowercase letters, digits and single hyphens")
		return store.DocumentInput{}, false
	}
	return in, true
}

var nonSlugChars = regexp.MustCompile(`[^a-z0-9]+`)

// Slugify turns a title into a URL slug.
func Slugify(title string) string {
	s := nonSlugChars.ReplaceAllString(strings.ToLower(title), "-")
	return strings.Trim(s, "-")
}
