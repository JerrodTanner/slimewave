package mail

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResendSendsTheRightRequest(t *testing.T) {
	var got map[string]any
	var auth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Error(err)
		}
		w.Write([]byte(`{"id":"x"}`))
	}))
	defer srv.Close()

	r := NewResend("re_test", "ShineWave <contact@example.com>", "inbox@example.com")
	r.URL = srv.URL
	err := r.Send(context.Background(), Email{Subject: "Hi", Text: "Body", ReplyTo: "visitor@example.com"})
	if err != nil {
		t.Fatal(err)
	}
	if auth != "Bearer re_test" {
		t.Errorf("Authorization = %q", auth)
	}
	if got["from"] != "ShineWave <contact@example.com>" || got["subject"] != "Hi" ||
		got["text"] != "Body" || got["reply_to"] != "visitor@example.com" {
		t.Errorf("payload = %v", got)
	}
	if to, _ := got["to"].([]any); len(to) != 1 || to[0] != "inbox@example.com" {
		t.Errorf("to = %v", got["to"])
	}
}

func TestResendReportsRefusals(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte(`{"message":"domain not verified"}`))
	}))
	defer srv.Close()

	r := NewResend("re_test", "a@example.com", "b@example.com")
	r.URL = srv.URL
	if err := r.Send(context.Background(), Email{Subject: "Hi", Text: "Body"}); err == nil {
		t.Fatal("want an error for a 403")
	}
}
