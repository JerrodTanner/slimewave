// Package mail sends the site's outgoing email: contact messages and project
// briefs, delivered to the owner's inbox through Resend.
package mail

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Email is one plain-text message. ReplyTo is the visitor's address, so a
// reply from the inbox goes straight back to them.
type Email struct {
	Subject string
	Text    string
	ReplyTo string
}

// Sender delivers an Email. The API depends on this rather than on Resend so
// tests can swap in a fake and a provider change stays inside this package.
type Sender interface {
	Send(ctx context.Context, e Email) error
}

// resendURL is Resend's send endpoint.
const resendURL = "https://api.resend.com/emails"

// Resend sends through the Resend HTTP API. From must be on a domain verified
// in the Resend account; To is the inbox that receives everything.
type Resend struct {
	APIKey string
	From   string
	To     string
	Client *http.Client
	// URL overrides the endpoint, for tests.
	URL string
}

func NewResend(apiKey, from, to string) *Resend {
	return &Resend{
		APIKey: apiKey,
		From:   from,
		To:     to,
		// A visitor is waiting on this request, so a stuck provider should
		// fail fast; the message is already saved either way.
		Client: &http.Client{Timeout: 10 * time.Second},
		URL:    resendURL,
	}
}

func (r *Resend) Send(ctx context.Context, e Email) error {
	payload := map[string]any{
		"from":    r.From,
		"to":      []string{r.To},
		"subject": e.Subject,
		"text":    e.Text,
	}
	if e.ReplyTo != "" {
		payload["reply_to"] = e.ReplyTo
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, r.URL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+r.APIKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := r.Client.Do(req)
	if err != nil {
		return fmt.Errorf("resend: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode/100 != 2 {
		// Resend explains a refusal in the body; a few hundred bytes of it is
		// enough for the log and the saved row.
		detail, _ := io.ReadAll(io.LimitReader(res.Body, 512))
		return fmt.Errorf("resend: %s: %s", res.Status, bytes.TrimSpace(detail))
	}
	return nil
}
