package api_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"slimewave/internal/api"
	"slimewave/internal/auth"
	"slimewave/internal/config"
	"slimewave/internal/media"
	"slimewave/internal/store"
)

const ownerPassword = "correct-horse-battery"

type testEnv struct {
	handler http.Handler
	store   *store.Store
}

func newTestEnv(t *testing.T) *testEnv {
	t.Helper()

	dir := t.TempDir()
	audioDir := filepath.Join(dir, "audio")
	if err := os.MkdirAll(filepath.Join(audioDir, "Dual Twice", "Violent Oragami"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(
		filepath.Join(audioDir, "Dual Twice", "Violent Oragami", "Techniques and Dragons.mp3"),
		[]byte("0123456789"), 0o644); err != nil {
		t.Fatal(err)
	}

	cfg := config.Config{
		Addr:       ":0",
		DBPath:     filepath.Join(dir, "test.db"),
		AudioDir:   audioDir,
		DocsDir:    filepath.Join(dir, "docs"),
		WebDir:     filepath.Join(dir, "web"),
		SessionTTL: time.Hour,
	}

	st, err := store.Open(cfg.DBPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { st.Close() })

	hash, err := auth.HashPassword(ownerPassword)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := st.CreateUser("owner@example.com", "Owner", hash, store.RoleOwner); err != nil {
		t.Fatal(err)
	}

	lib := media.NewLibrary(audioDir)
	if err := lib.Scan(); err != nil {
		t.Fatal(err)
	}

	am := auth.NewManager(st, cfg.SessionTTL, false)
	return &testEnv{handler: api.NewServer(cfg, st, am, lib).Handler(), store: st}
}

func (e *testEnv) do(t *testing.T, method, path string, body any, cookies ...*http.Cookie) *httptest.ResponseRecorder {
	t.Helper()

	var reader *bytes.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		reader = bytes.NewReader(raw)
	} else {
		reader = bytes.NewReader(nil)
	}

	req := httptest.NewRequest(method, path, reader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for _, c := range cookies {
		req.AddCookie(c)
	}

	rec := httptest.NewRecorder()
	e.handler.ServeHTTP(rec, req)
	return rec
}

// login returns the session cookie for the seeded owner account.
func (e *testEnv) login(t *testing.T) *http.Cookie {
	t.Helper()
	rec := e.do(t, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    "owner@example.com",
		"password": ownerPassword,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("login failed: %d %s", rec.Code, rec.Body.String())
	}
	for _, c := range rec.Result().Cookies() {
		if c.Name == auth.CookieName {
			return c
		}
	}
	t.Fatal("no session cookie in login response")
	return nil
}

func TestLoginRejectsWrongPassword(t *testing.T) {
	e := newTestEnv(t)
	rec := e.do(t, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    "owner@example.com",
		"password": "nope",
	})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
	for _, c := range rec.Result().Cookies() {
		if c.Name == auth.CookieName && c.Value != "" {
			t.Fatal("a failed login must not set a session cookie")
		}
	}
}

func TestLoginUnknownEmailLooksIdentical(t *testing.T) {
	e := newTestEnv(t)
	unknown := e.do(t, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    "nobody@example.com",
		"password": ownerPassword,
	})
	wrongPass := e.do(t, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    "owner@example.com",
		"password": "nope",
	})
	if unknown.Code != wrongPass.Code || unknown.Body.String() != wrongPass.Body.String() {
		t.Errorf("responses differ: %d %s vs %d %s",
			unknown.Code, unknown.Body.String(), wrongPass.Code, wrongPass.Body.String())
	}
}

func TestMeReflectsSession(t *testing.T) {
	e := newTestEnv(t)

	anon := e.do(t, http.MethodGet, "/api/auth/me", nil)
	var anonBody struct {
		User *struct{} `json:"user"`
	}
	if err := json.Unmarshal(anon.Body.Bytes(), &anonBody); err != nil {
		t.Fatal(err)
	}
	if anonBody.User != nil {
		t.Error("anonymous request reported a user")
	}

	cookie := e.login(t)
	rec := e.do(t, http.MethodGet, "/api/auth/me", nil, cookie)
	var body struct {
		User struct {
			Email   string `json:"email"`
			IsOwner bool   `json:"isOwner"`
		} `json:"user"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.User.Email != "owner@example.com" || !body.User.IsOwner {
		t.Errorf("unexpected user: %+v", body.User)
	}
}

func TestRegistrationClosedByDefault(t *testing.T) {
	e := newTestEnv(t)
	rec := e.do(t, http.MethodPost, "/api/auth/register", map[string]string{
		"email":    "someone@example.com",
		"password": "a-long-enough-password",
	})
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", rec.Code)
	}
}

func TestDocumentLifecycle(t *testing.T) {
	e := newTestEnv(t)
	cookie := e.login(t)

	// Anonymous writes are rejected.
	if rec := e.do(t, http.MethodPost, "/api/documents", map[string]any{
		"title": "Draft", "body": "x",
	}); rec.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous create: status = %d, want 401", rec.Code)
	}

	rec := e.do(t, http.MethodPost, "/api/documents", map[string]any{
		"title": "Why Go and Svelte", "body": "Because the canvas has to survive.",
	}, cookie)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create: status = %d, body = %s", rec.Code, rec.Body.String())
	}
	var created struct {
		Document struct {
			Slug      string `json:"slug"`
			Published bool   `json:"published"`
		} `json:"document"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	if created.Document.Slug != "why-go-and-svelte" {
		t.Errorf("slug = %q, want why-go-and-svelte", created.Document.Slug)
	}
	if created.Document.Published {
		t.Error("documents should start unpublished")
	}

	// A draft is invisible to the public, and indistinguishable from missing.
	if rec := e.do(t, http.MethodGet, "/api/documents/why-go-and-svelte", nil); rec.Code != http.StatusNotFound {
		t.Errorf("anonymous draft read: status = %d, want 404", rec.Code)
	}
	if rec := e.do(t, http.MethodGet, "/api/documents", nil); !bytes.Contains(rec.Body.Bytes(), []byte(`"documents":[]`)) {
		t.Errorf("draft leaked into the public list: %s", rec.Body.String())
	}

	// Publish it.
	rec = e.do(t, http.MethodPut, "/api/documents/why-go-and-svelte", map[string]any{
		"slug": "why-go-and-svelte", "title": "Why Go and Svelte",
		"body": "Because the canvas has to survive.", "published": true,
	}, cookie)
	if rec.Code != http.StatusOK {
		t.Fatalf("update: status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if rec := e.do(t, http.MethodGet, "/api/documents/why-go-and-svelte", nil); rec.Code != http.StatusOK {
		t.Errorf("published read: status = %d", rec.Code)
	}

	// The index omits bodies unless asked.
	rec = e.do(t, http.MethodGet, "/api/documents", nil)
	if bytes.Contains(rec.Body.Bytes(), []byte("canvas has to survive")) {
		t.Error("the index should not carry document bodies")
	}

	if rec := e.do(t, http.MethodDelete, "/api/documents/why-go-and-svelte", nil, cookie); rec.Code != http.StatusNoContent {
		t.Fatalf("delete: status = %d", rec.Code)
	}
	if rec := e.do(t, http.MethodGet, "/api/documents/why-go-and-svelte", nil, cookie); rec.Code != http.StatusNotFound {
		t.Errorf("read after delete: status = %d, want 404", rec.Code)
	}
}

func TestDocumentRejectsBadSlug(t *testing.T) {
	e := newTestEnv(t)
	cookie := e.login(t)
	rec := e.do(t, http.MethodPost, "/api/documents", map[string]any{
		"title": "Fine", "slug": "Not A Slug",
	}, cookie)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}

func TestMusicEndpoints(t *testing.T) {
	e := newTestEnv(t)

	rec := e.do(t, http.MethodGet, "/api/music/artists", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte("Dual Twice")) {
		t.Errorf("artist missing from index: %s", rec.Body.String())
	}

	// Path segments with spaces must survive round-tripping through the URL.
	rec = e.do(t, http.MethodGet, "/api/music/artists/Dual%20Twice/albums/Violent%20Oragami", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("album lookup: status = %d, body = %s", rec.Code, rec.Body.String())
	}

	rec = e.do(t, http.MethodGet, "/api/music/artists/Nobody", nil)
	if rec.Code != http.StatusNotFound {
		t.Errorf("unknown artist: status = %d, want 404", rec.Code)
	}
}

func TestRescanRequiresOwner(t *testing.T) {
	e := newTestEnv(t)
	if rec := e.do(t, http.MethodPost, "/api/music/rescan", nil); rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
	cookie := e.login(t)
	if rec := e.do(t, http.MethodPost, "/api/music/rescan", nil, cookie); rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
}

func TestUnknownAPIPathReturnsJSON(t *testing.T) {
	e := newTestEnv(t)
	rec := e.do(t, http.MethodGet, "/api/does-not-exist", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json; charset=utf-8" {
		t.Errorf("Content-Type = %q, want JSON — the SPA must not swallow API 404s", ct)
	}
}

func TestPreferencesRoundTrip(t *testing.T) {
	e := newTestEnv(t)

	if rec := e.do(t, http.MethodGet, "/api/preferences", nil); rec.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous read: status = %d, want 401", rec.Code)
	}

	cookie := e.login(t)
	if rec := e.do(t, http.MethodPut, "/api/preferences", map[string]any{
		"theme": "deepwater",
		"data":  map[string]any{"gameMode": "ambient"},
	}, cookie); rec.Code != http.StatusOK {
		t.Fatalf("write: status = %d, body = %s", rec.Code, rec.Body.String())
	}

	rec := e.do(t, http.MethodGet, "/api/preferences", nil, cookie)
	if !bytes.Contains(rec.Body.Bytes(), []byte("deepwater")) {
		t.Errorf("theme did not round-trip: %s", rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte("ambient")) {
		t.Errorf("data did not round-trip: %s", rec.Body.String())
	}
}

func TestLogoutClearsSession(t *testing.T) {
	e := newTestEnv(t)
	cookie := e.login(t)

	if rec := e.do(t, http.MethodPost, "/api/auth/logout", nil, cookie); rec.Code != http.StatusOK {
		t.Fatalf("logout: status = %d", rec.Code)
	}
	// The old cookie value must no longer resolve to a user.
	rec := e.do(t, http.MethodGet, "/api/preferences", nil, cookie)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("session survived logout: status = %d", rec.Code)
	}
}

func TestAudioStreamSupportsRange(t *testing.T) {
	e := newTestEnv(t)

	req := httptest.NewRequest(http.MethodGet,
		"/media/audio/Dual%20Twice/Violent%20Oragami/Techniques%20and%20Dragons.mp3", nil)
	req.Header.Set("Range", "bytes=2-5")
	rec := httptest.NewRecorder()
	e.handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusPartialContent {
		t.Fatalf("status = %d, want 206", rec.Code)
	}
	if rec.Body.String() != "2345" {
		t.Errorf("body = %q, want %q", rec.Body.String(), "2345")
	}
}
