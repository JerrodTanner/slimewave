package store

import (
	"database/sql"
	"encoding/json"
	"errors"
)

// Preferences are the bits of client state worth carrying between devices.
// Anonymous visitors keep the same shape in localStorage; logging in just
// gives it somewhere durable to live.
type Preferences struct {
	Theme string          `json:"theme"`
	Data  json.RawMessage `json:"data"`
}

func (s *Store) PreferencesFor(userID int64) (Preferences, error) {
	var p Preferences
	var data string
	err := s.db.QueryRow(`SELECT theme, data FROM preferences WHERE user_id = ?`, userID).
		Scan(&p.Theme, &data)
	if errors.Is(err, sql.ErrNoRows) {
		return Preferences{Data: json.RawMessage(`{}`)}, nil
	}
	if err != nil {
		return Preferences{}, err
	}
	if data == "" {
		data = "{}"
	}
	p.Data = json.RawMessage(data)
	return p, nil
}

func (s *Store) SavePreferences(userID int64, p Preferences) error {
	data := "{}"
	if len(p.Data) > 0 {
		data = string(p.Data)
	}
	_, err := s.db.Exec(
		`INSERT INTO preferences (user_id, theme, data, updated_at) VALUES (?, ?, ?, ?)
		 ON CONFLICT(user_id) DO UPDATE SET theme = excluded.theme,
		                                    data = excluded.data,
		                                    updated_at = excluded.updated_at`,
		userID, p.Theme, data, now(),
	)
	return err
}
