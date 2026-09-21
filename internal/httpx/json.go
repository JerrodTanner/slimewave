// Package httpx holds the small HTTP helpers shared by the API handlers:
// JSON encoding, error shapes, and the static/SPA file server.
package httpx

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
)

// maxJSONBody caps request bodies. Documents are the largest thing posted
// here and 1 MiB of prose is a lot of prose.
const maxJSONBody = 1 << 20

// ErrorBody is the single error shape the API returns, so the client only
// has to understand one.
type ErrorBody struct {
	Error string `json:"error"`
}

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(v); err != nil {
		// The status line is already out; all that is left is a log line.
		log.Printf("httpx: encode response: %v", err)
	}
}

func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, ErrorBody{Error: msg})
}

// DecodeJSON reads a size-limited JSON body and rejects unknown fields, so a
// typo in the client surfaces as an error instead of a silent no-op.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxJSONBody)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return err
	}
	// Exactly one JSON value per request.
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("body must contain a single JSON object")
	}
	return nil
}

// NoCache marks a response as uncacheable. Used for anything user-specific.
func NoCache(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store")
}
