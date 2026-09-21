package store

import (
	"database/sql"
	"errors"
	"strings"
	"time"
)

// Roles. "owner" is me (full admin), "visitor" is anyone with an account,
// which right now buys you nothing but synced preferences.
const (
	RoleOwner   = "owner"
	RoleVisitor = "visitor"
)

var (
	ErrNotFound      = errors.New("not found")
	ErrEmailTaken    = errors.New("email already registered")
	ErrInvalidLogin  = errors.New("invalid email or password")
	ErrSessionExpiry = errors.New("session expired")
)

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"displayName"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	PasswordHash string    `json:"-"`
}

func (u User) IsOwner() bool { return u.Role == RoleOwner }

func (s *Store) CreateUser(email, displayName, passwordHash, role string) (User, error) {
	email = strings.TrimSpace(email)
	created := now()
	res, err := s.db.Exec(
		`INSERT INTO users (email, display_name, password_hash, role, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		email, displayName, passwordHash, role, created,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			return User{}, ErrEmailTaken
		}
		return User{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return User{}, err
	}
	return User{
		ID:          id,
		Email:       email,
		DisplayName: displayName,
		Role:        role,
		CreatedAt:   parseTime(created),
	}, nil
}

func (s *Store) UserByEmail(email string) (User, error) {
	return s.scanUser(s.db.QueryRow(
		`SELECT id, email, display_name, password_hash, role, created_at
		 FROM users WHERE email = ? COLLATE NOCASE`, strings.TrimSpace(email)))
}

func (s *Store) UserByID(id int64) (User, error) {
	return s.scanUser(s.db.QueryRow(
		`SELECT id, email, display_name, password_hash, role, created_at
		 FROM users WHERE id = ?`, id))
}

// CountUsers reports how many accounts exist, which is how the bootstrap
// decides whether this is a first run.
func (s *Store) CountUsers() (int, error) {
	var n int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&n)
	return n, err
}

func (s *Store) UpdatePasswordHash(userID int64, hash string) error {
	_, err := s.db.Exec(`UPDATE users SET password_hash = ? WHERE id = ?`, hash, userID)
	return err
}

func (s *Store) scanUser(row *sql.Row) (User, error) {
	var u User
	var createdAt string
	err := row.Scan(&u.ID, &u.Email, &u.DisplayName, &u.PasswordHash, &u.Role, &createdAt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrNotFound
	}
	if err != nil {
		return User{}, err
	}
	u.CreatedAt = parseTime(createdAt)
	return u, nil
}
