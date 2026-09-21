package httpx

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"slimewave/internal/media"
)

// SPAHandler serves the built SvelteKit bundle. Hashed build assets get a
// long cache lifetime; everything else falls back to index.html so client-side
// routes survive a hard refresh or a shared deep link.
//
// Go owns no templating here — this is a file server with one rule.
type SPAHandler struct {
	root     string
	indexRaw []byte
	present  bool
}

func NewSPAHandler(root string) *SPAHandler {
	h := &SPAHandler{root: root}
	data, err := os.ReadFile(filepath.Join(root, "index.html"))
	if err != nil {
		log.Printf("spa: no frontend build at %s (%v); serving API only", root, err)
		return h
	}
	h.indexRaw = data
	h.present = true
	return h
}

// Present reports whether a frontend build was found.
func (h *SPAHandler) Present() bool { return h.present }

func (h *SPAHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !h.present {
		Error(w, http.StatusNotFound,
			"no frontend build found; run the Vite dev server or build web/ first")
		return
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	full, ok := media.SafeJoin(h.root, r.URL.Path)
	if ok {
		if info, err := os.Stat(full); err == nil && !info.IsDir() {
			// SvelteKit puts content-hashed files under _app/immutable.
			if strings.Contains(filepath.ToSlash(r.URL.Path), "/_app/immutable/") {
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			} else {
				w.Header().Set("Cache-Control", "public, max-age=300")
			}
			http.ServeFile(w, r, full)
			return
		}
	}

	h.serveIndex(w, r)
}

func (h *SPAHandler) serveIndex(w http.ResponseWriter, r *http.Request) {
	// The shell must never be cached: it names the current hashed bundles.
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Method == http.MethodHead {
		w.WriteHeader(http.StatusOK)
		return
	}
	if _, err := w.Write(h.indexRaw); err != nil {
		log.Printf("spa: write index: %v", err)
	}
}
