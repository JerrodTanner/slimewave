package media

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func writeFile(t *testing.T, path string, data []byte) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestSafeJoinRejectsTraversal(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "Artist", "Album", "track.mp3"), []byte("audio"))
	writeFile(t, filepath.Join(filepath.Dir(root), "outside.txt"), []byte("secret"))

	for _, rel := range []string{
		"../outside.txt",
		"/../outside.txt",
		"Artist/../../outside.txt",
		"%2e%2e/outside.txt",
		"/etc/passwd",
		"",
	} {
		if got, ok := SafeJoin(root, rel); ok {
			t.Errorf("SafeJoin(%q) unexpectedly allowed %q", rel, got)
		}
	}

	if _, ok := SafeJoin(root, "/Artist/Album/track.mp3"); !ok {
		t.Error("SafeJoin rejected a legitimate path inside the root")
	}
}

func TestSafeJoinRejectsSymlinkEscape(t *testing.T) {
	root := t.TempDir()
	outside := filepath.Join(t.TempDir(), "secret.txt")
	writeFile(t, outside, []byte("secret"))

	link := filepath.Join(root, "escape.txt")
	if err := os.Symlink(outside, link); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}

	if got, ok := SafeJoin(root, "escape.txt"); ok {
		t.Errorf("SafeJoin followed a symlink out of the root to %q", got)
	}
}

func TestFileServerServesRanges(t *testing.T) {
	root := t.TempDir()
	body := []byte("0123456789abcdef")
	writeFile(t, filepath.Join(root, "Artist", "Album", "track.mp3"), body)

	srv := NewFileServer(root, "/media/audio/", time.Hour)

	req := httptest.NewRequest(http.MethodGet, "/media/audio/Artist/Album/track.mp3", nil)
	req.Header.Set("Range", "bytes=4-7")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusPartialContent {
		t.Fatalf("status = %d, want 206", rec.Code)
	}
	if got := rec.Body.String(); got != "4567" {
		t.Errorf("body = %q, want %q", got, "4567")
	}
	if got := rec.Header().Get("Content-Type"); got != "audio/mpeg" {
		t.Errorf("Content-Type = %q, want audio/mpeg", got)
	}
	if got := rec.Header().Get("Accept-Ranges"); got != "bytes" {
		t.Errorf("Accept-Ranges = %q, want bytes", got)
	}
}

func TestFileServerRejectsTraversal(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "Artist", "Album", "track.mp3"), []byte("audio"))

	srv := NewFileServer(root, "/media/audio/", time.Hour)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/media/audio/..%2f..%2fetc/passwd", nil))

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

func TestLibraryScan(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "Hail The Sun", "demo", "Never Kill A Mouse.mp3"), []byte("a"))
	writeFile(t, filepath.Join(root, "Hail The Sun", "demo", "cover.jpg"), []byte("img"))
	writeFile(t, filepath.Join(root, "Hail The Sun", "demo", "notes.txt"), []byte("ignored"))
	// Wrong depth: should not be indexed as a track.
	writeFile(t, filepath.Join(root, "loose.mp3"), []byte("a"))

	lib := NewLibrary(root)
	if err := lib.Scan(); err != nil {
		t.Fatal(err)
	}

	artists := lib.Artists()
	if len(artists) != 1 {
		t.Fatalf("got %d artists, want 1", len(artists))
	}
	album, ok := lib.Album("Hail The Sun", "demo")
	if !ok {
		t.Fatal("album not found")
	}
	if len(album.Tracks) != 1 {
		t.Fatalf("got %d tracks, want 1", len(album.Tracks))
	}
	if album.CoverURL == "" {
		t.Error("expected a cover URL")
	}
	// Spaces must be escaped or the browser request will not match on disk.
	want := "/media/audio/Hail%20The%20Sun/demo/Never%20Kill%20A%20Mouse.mp3"
	if album.Tracks[0].StreamURL != want {
		t.Errorf("StreamURL = %q, want %q", album.Tracks[0].StreamURL, want)
	}
}

func TestFileServerRefusesHiddenArtist(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "Shown", "album", "a.mp3"), []byte("a"))
	writeFile(t, filepath.Join(root, "Kept Out", "album", "b.mp3"), []byte("b"))
	writeFile(t, filepath.Join(root, "Kept Out", hiddenMarker), nil)

	srv := NewFileServer(root, "/media/audio/", time.Hour)
	for path, want := range map[string]int{
		"/media/audio/Shown/album/a.mp3":               http.StatusOK,
		"/media/audio/Kept%20Out/album/b.mp3":          http.StatusNotFound,
		"/media/audio/Shown/../Kept%20Out/album/b.mp3": http.StatusNotFound,
	} {
		rec := httptest.NewRecorder()
		srv.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
		if rec.Code != want {
			t.Errorf("%s: status = %d, want %d", path, rec.Code, want)
		}
	}
}

func TestLibraryScanSkipsHiddenArtist(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "Shown", "album", "a.mp3"), []byte("a"))
	writeFile(t, filepath.Join(root, "Kept Out", "album", "b.mp3"), []byte("b"))
	writeFile(t, filepath.Join(root, "Kept Out", hiddenMarker), nil)

	lib := NewLibrary(root)
	if err := lib.Scan(); err != nil {
		t.Fatal(err)
	}
	if artists := lib.Artists(); len(artists) != 1 || artists[0].Name != "Shown" {
		t.Fatalf("got %+v, want only Shown", artists)
	}
	if _, ok := lib.Artist("Kept Out"); ok {
		t.Error("hidden artist is still reachable by name")
	}
}

func TestLibraryScanMissingDirectory(t *testing.T) {
	lib := NewLibrary(filepath.Join(t.TempDir(), "nope"))
	if err := lib.Scan(); err != nil {
		t.Fatalf("scanning a missing directory should be tolerated, got %v", err)
	}
	if len(lib.Artists()) != 0 {
		t.Error("expected an empty library")
	}
}
