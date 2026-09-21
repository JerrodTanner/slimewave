package media

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// FileServer serves files out of a single directory by URL path, with range
// requests (seeking, on-the-fly buffering) handled by http.ServeContent.
//
// It exists instead of http.FileServer because that would also happily list
// directories and follow symlinks out of the tree.
type FileServer struct {
	root   string
	prefix string
	// maxAge is the Cache-Control lifetime. Media files are immutable in
	// practice — a new track is a new filename.
	maxAge time.Duration
}

func NewFileServer(root, prefix string, maxAge time.Duration) *FileServer {
	return &FileServer{root: root, prefix: prefix, maxAge: maxAge}
}

func (fsv *FileServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rel := strings.TrimPrefix(r.URL.Path, fsv.prefix)
	full, ok := SafeJoin(fsv.root, rel)
	if !ok {
		http.NotFound(w, r)
		return
	}

	f, err := os.Open(full)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil || info.IsDir() {
		http.NotFound(w, r)
		return
	}

	if ct, ok := audioExtensions[strings.ToLower(filepath.Ext(full))]; ok {
		w.Header().Set("Content-Type", ct)
	}
	if fsv.maxAge > 0 {
		w.Header().Set("Cache-Control", "public, max-age="+durationSeconds(fsv.maxAge))
	}
	// Tells the browser it may seek, which is what makes scrubbing work.
	w.Header().Set("Accept-Ranges", "bytes")

	http.ServeContent(w, r, info.Name(), info.ModTime(), f)
}

// SafeJoin resolves a URL path against a root directory, refusing anything
// that escapes it (via .., an absolute path, or a symlink pointing out).
func SafeJoin(root, rel string) (string, bool) {
	decoded, err := url.PathUnescape(rel)
	if err != nil {
		return "", false
	}
	decoded = strings.TrimPrefix(filepath.ToSlash(decoded), "/")
	if decoded == "" || strings.Contains(decoded, "\x00") {
		return "", false
	}

	absRoot, err := filepath.Abs(root)
	if err != nil {
		return "", false
	}
	// Clean() collapses any ".." before the join, so the candidate can only
	// point inside absRoot.
	candidate := filepath.Join(absRoot, filepath.Clean("/"+decoded))

	// Resolve symlinks and re-check: a link inside the tree could still aim
	// at /etc/passwd.
	resolved, err := filepath.EvalSymlinks(candidate)
	if err != nil {
		return "", false
	}
	resolvedRoot, err := filepath.EvalSymlinks(absRoot)
	if err != nil {
		return "", false
	}
	if resolved != resolvedRoot && !strings.HasPrefix(resolved, resolvedRoot+string(filepath.Separator)) {
		return "", false
	}
	return resolved, true
}

// escape percent-encodes a path segment for use in a media URL.
func escape(segment string) string {
	return url.PathEscape(segment)
}

func durationSeconds(d time.Duration) string {
	secs := int64(d.Seconds())
	if secs < 0 {
		secs = 0
	}
	return strconv.FormatInt(secs, 10)
}
