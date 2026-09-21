package store

import (
	"database/sql"
	"errors"
	"time"
)

// CreateSession stores the SHA-256 of the session token, never the token
// itself, so a database leak does not hand over live logins.
func (s *Store) CreateSession(tokenHash string, userID int64, ttl time.Duration) error {
	nowT := time.Now().UTC()
	_, err := s.db.Exec(
		`INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
		tokenHash,
		userID,
		nowT.Format(time.RFC3339Nano),
		nowT.Add(ttl).Format(time.RFC3339Nano),
	)
	return err
}

// UserBySessionToken resolves a session hash to its user, deleting the row
// if it has expired.
func (s *Store) UserBySessionToken(tokenHash string) (User, error) {
	var userID int64
	var expiresAt string
	err := s.db.QueryRow(
		`SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`, tokenHash,
	).Scan(&userID, &expiresAt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrNotFound
	}
	if err != nil {
		return User{}, err
	}
	if time.Now().UTC().After(parseTime(expiresAt)) {
		_ = s.DeleteSession(tokenHash)
		return User{}, ErrSessionExpiry
	}
	return s.UserByID(userID)
}

func (s *Store) DeleteSession(tokenHash string) error {
	_, err := s.db.Exec(`DELETE FROM sessions WHERE token_hash = ?`, tokenHash)
	return err
}

// PurgeExpiredSessions drops rows that are already past their expiry.
func (s *Store) PurgeExpiredSessions() (int64, error) {
	res, err := s.db.Exec(`DELETE FROM sessions WHERE expires_at < ?`,
		time.Now().UTC().Format(time.RFC3339Nano))
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}
