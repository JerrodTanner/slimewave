package api

import (
	"context"
	"log"
	"net"
	"net/http"
	"net/mail"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"slimewave/internal/httpx"
	smail "slimewave/internal/mail"
	"slimewave/internal/store"
)

// Contact limits. A brief from /plan is the longest thing sent here, and it
// runs to a couple of thousand characters even with every box filled.
const (
	maxEmailLen   = 254
	maxMessageLen = 20000

	// Per visitor IP: enough for someone who sends, then thinks of something
	// to add, but not enough to make the form worth scripting.
	contactBurst  = 5
	contactWindow = time.Hour
)

// contactSubjects are the email subjects, one per kind of submission. The
// kind is also what the client must send, so anything else is refused.
var contactSubjects = map[string]string{
	"message": "Inquiry from jerrodtanner.com",
	"brief":   "Project brief from jerrodtanner.com",
}

// handleContact takes a contact message or a project brief, saves it, and
// emails it to the owner. Saving comes first, so a provider outage costs a
// delay rather than the message.
func (s *Server) handleContact(w http.ResponseWriter, r *http.Request) {
	httpx.NoCache(w)

	var in struct {
		Kind    string `json:"kind"`
		Email   string `json:"email"`
		Message string `json:"message"`
		// Website is the honeypot: hidden from people, filled in by bots
		// that complete every field they find.
		Website string `json:"website"`
	}
	if err := httpx.DecodeJSON(w, r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, "malformed request body")
		return
	}

	// A bot gets the same answer as a person, so it has nothing to learn
	// from, but nothing is saved or sent.
	if in.Website != "" {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "sent"})
		return
	}

	subject, ok := contactSubjects[in.Kind]
	if !ok {
		httpx.Error(w, http.StatusBadRequest, "unknown kind")
		return
	}
	email := strings.TrimSpace(in.Email)
	if !validEmail(email) {
		httpx.Error(w, http.StatusBadRequest, "enter a valid email address so I can reply")
		return
	}
	message := strings.TrimSpace(in.Message)
	if message == "" {
		httpx.Error(w, http.StatusBadRequest, "the message is empty")
		return
	}
	if utf8.RuneCountInString(message) > maxMessageLen {
		httpx.Error(w, http.StatusBadRequest, "the message is too long")
		return
	}

	ip := clientIP(r)
	if !s.contactLimit.allow(ip, time.Now()) {
		httpx.Error(w, http.StatusTooManyRequests, "too many messages from here, try again later")
		return
	}

	id, err := s.store.SaveMessage(store.Message{Kind: in.Kind, Email: email, Body: message, IP: ip})
	if err != nil {
		log.Printf("api: save message: %v", err)
		httpx.Error(w, http.StatusInternalServerError, "could not save the message")
		return
	}

	if s.mailer == nil {
		// Dev, or a deployment without a key: the row is the only copy.
		log.Printf("api: message %d saved; no mail provider configured", id)
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "sent"})
		return
	}

	// The send finishes even if the visitor leaves the page mid-request;
	// the timeout keeps a stuck provider from holding it open.
	ctx, cancel := context.WithTimeout(context.WithoutCancel(r.Context()), 15*time.Second)
	defer cancel()
	err = s.mailer.Send(ctx, smail.Email{
		Subject: subject,
		Text:    message + "\n\n— Reply to: " + email,
		ReplyTo: email,
	})
	if err != nil {
		log.Printf("api: send message %d: %v", id, err)
		if err := s.store.MarkMessageFailed(id, err.Error()); err != nil {
			log.Printf("api: mark message %d failed: %v", id, err)
		}
		httpx.Error(w, http.StatusBadGateway, "your message was saved, but the email did not go out")
		return
	}
	if err := s.store.MarkMessageSent(id); err != nil {
		log.Printf("api: mark message %d sent: %v", id, err)
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "sent"})
}

// validEmail accepts a bare address and nothing else: no display name, no
// angle brackets, and a dot in the domain, since a reply has to reach it.
func validEmail(s string) bool {
	if s == "" || len(s) > maxEmailLen {
		return false
	}
	addr, err := mail.ParseAddress(s)
	if err != nil || addr.Address != s || addr.Name != "" {
		return false
	}
	at := strings.LastIndexByte(s, '@')
	return at > 0 && strings.Contains(s[at+1:], ".")
}

// clientIP is the visitor's address. Behind the Cloudflare tunnel every
// request arrives from cloudflared, so the real one is in CF-Connecting-IP.
// Nothing else reaches the container, so the header can be trusted.
func clientIP(r *http.Request) string {
	if ip := strings.TrimSpace(r.Header.Get("CF-Connecting-IP")); ip != "" {
		return ip
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// rateLimit allows a fixed number of events per key in a sliding window. It
// lives in memory: a restart forgets it, which at this traffic is fine.
type rateLimit struct {
	mu     sync.Mutex
	burst  int
	window time.Duration
	seen   map[string][]time.Time
}

func newRateLimit(burst int, window time.Duration) *rateLimit {
	return &rateLimit{burst: burst, window: window, seen: map[string][]time.Time{}}
}

func (l *rateLimit) allow(key string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	cutoff := now.Add(-l.window)
	// Keys whose newest event has aged out are dropped as they are found, so
	// the map only ever holds the visitors from the last window.
	for k, times := range l.seen {
		if times[len(times)-1].Before(cutoff) {
			delete(l.seen, k)
		}
	}

	var recent []time.Time
	for _, t := range l.seen[key] {
		if t.After(cutoff) {
			recent = append(recent, t)
		}
	}
	if len(recent) >= l.burst {
		l.seen[key] = recent
		return false
	}
	l.seen[key] = append(recent, now)
	return true
}
