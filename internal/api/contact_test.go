package api_test

import (
	"context"
	"errors"
	"net/http"
	"sync"
	"testing"

	"slimewave/internal/mail"
)

// fakeMailer records what would have been sent, or fails on demand.
type fakeMailer struct {
	mu   sync.Mutex
	sent []mail.Email
	err  error
}

func (f *fakeMailer) Send(_ context.Context, e mail.Email) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return f.err
	}
	f.sent = append(f.sent, e)
	return nil
}

// messageRows returns how many messages were saved, and how many of those
// were marked sent.
func (e *testEnv) messageRows(t *testing.T) (total, sent int) {
	t.Helper()
	err := e.store.DB().QueryRow(
		`SELECT COUNT(*), COUNT(NULLIF(sent_at, '')) FROM messages`,
	).Scan(&total, &sent)
	if err != nil {
		t.Fatal(err)
	}
	return total, sent
}

func TestContactSavesAndSends(t *testing.T) {
	m := &fakeMailer{}
	e := newTestEnvWithMailer(t, m)
	rec := e.do(t, http.MethodPost, "/api/contact", map[string]string{
		"kind":    "brief",
		"email":   "visitor@example.com",
		"message": "PROJECT BRIEF\n\nDOMAIN\n—",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d %s", rec.Code, rec.Body.String())
	}
	if len(m.sent) != 1 {
		t.Fatalf("sent %d emails, want 1", len(m.sent))
	}
	got := m.sent[0]
	if got.ReplyTo != "visitor@example.com" || got.Subject != "Project brief from jerrodtanner.com" {
		t.Errorf("email = %+v", got)
	}
	if total, sent := e.messageRows(t); total != 1 || sent != 1 {
		t.Errorf("rows = %d total, %d sent; want 1, 1", total, sent)
	}
}

func TestContactKeepsTheMessageWhenSendingFails(t *testing.T) {
	e := newTestEnvWithMailer(t, &fakeMailer{err: errors.New("provider down")})
	rec := e.do(t, http.MethodPost, "/api/contact", map[string]string{
		"kind":    "message",
		"email":   "visitor@example.com",
		"message": "Automate my invoices",
	})
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
	if total, sent := e.messageRows(t); total != 1 || sent != 0 {
		t.Errorf("rows = %d total, %d sent; want 1, 0", total, sent)
	}
}

func TestContactRejectsBadInput(t *testing.T) {
	e := newTestEnvWithMailer(t, &fakeMailer{})
	long := make([]byte, 20001)
	for i := range long {
		long[i] = 'a'
	}
	cases := map[string]map[string]string{
		"no email":      {"kind": "message", "email": "", "message": "hi"},
		"bad email":     {"kind": "message", "email": "not-an-email", "message": "hi"},
		"display name":  {"kind": "message", "email": "Bob <bob@example.com>", "message": "hi"},
		"no domain dot": {"kind": "message", "email": "bob@localhost", "message": "hi"},
		"empty message": {"kind": "message", "email": "bob@example.com", "message": "   "},
		"too long":      {"kind": "message", "email": "bob@example.com", "message": string(long)},
		"unknown kind":  {"kind": "spam", "email": "bob@example.com", "message": "hi"},
	}
	for name, body := range cases {
		if rec := e.do(t, http.MethodPost, "/api/contact", body); rec.Code != http.StatusBadRequest {
			t.Errorf("%s: status = %d, want 400", name, rec.Code)
		}
	}
	if total, _ := e.messageRows(t); total != 0 {
		t.Errorf("saved %d rows from bad input", total)
	}
}

func TestContactHoneypotIsSilentlyDropped(t *testing.T) {
	m := &fakeMailer{}
	e := newTestEnvWithMailer(t, m)
	rec := e.do(t, http.MethodPost, "/api/contact", map[string]string{
		"kind":    "message",
		"email":   "bot@example.com",
		"message": "buy now",
		"website": "http://spam.example",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 so the bot learns nothing", rec.Code)
	}
	if total, _ := e.messageRows(t); total != 0 || len(m.sent) != 0 {
		t.Errorf("honeypot submission was saved or sent")
	}
}

func TestContactIsRateLimitedPerIP(t *testing.T) {
	e := newTestEnvWithMailer(t, &fakeMailer{})
	body := map[string]string{"kind": "message", "email": "bob@example.com", "message": "hi"}
	for i := 0; i < 5; i++ {
		if rec := e.do(t, http.MethodPost, "/api/contact", body); rec.Code != http.StatusOK {
			t.Fatalf("message %d: status = %d", i+1, rec.Code)
		}
	}
	if rec := e.do(t, http.MethodPost, "/api/contact", body); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("sixth message: status = %d, want 429", rec.Code)
	}
}
