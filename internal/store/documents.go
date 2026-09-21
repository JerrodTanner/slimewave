package store

import (
	"database/sql"
	"errors"
	"strings"
	"time"
)

// Document is a piece of writing managed through /admin: a project note, a
// long-form post, the text version of the resume.
type Document struct {
	ID        int64     `json:"id"`
	Slug      string    `json:"slug"`
	Title     string    `json:"title"`
	Summary   string    `json:"summary"`
	Body      string    `json:"body"`
	Kind      string    `json:"kind"`
	Published bool      `json:"published"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// DocumentInput carries the writable fields of a document.
type DocumentInput struct {
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Summary   string `json:"summary"`
	Body      string `json:"body"`
	Kind      string `json:"kind"`
	Published bool   `json:"published"`
}

var ErrSlugTaken = errors.New("slug already in use")

// ListDocuments returns documents newest-updated first. Unless includeDrafts
// is set only published ones come back, which is what anonymous readers get.
func (s *Store) ListDocuments(includeDrafts bool, kind string) ([]Document, error) {
	query := `SELECT id, slug, title, summary, body, kind, published, created_at, updated_at
	          FROM documents`
	var clauses []string
	var args []any
	if !includeDrafts {
		clauses = append(clauses, "published = 1")
	}
	if kind != "" {
		clauses = append(clauses, "kind = ?")
		args = append(args, kind)
	}
	if len(clauses) > 0 {
		query += " WHERE " + strings.Join(clauses, " AND ")
	}
	query += " ORDER BY updated_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docs := []Document{}
	for rows.Next() {
		d, err := scanDocument(rows)
		if err != nil {
			return nil, err
		}
		docs = append(docs, d)
	}
	return docs, rows.Err()
}

func (s *Store) DocumentBySlug(slug string) (Document, error) {
	row := s.db.QueryRow(
		`SELECT id, slug, title, summary, body, kind, published, created_at, updated_at
		 FROM documents WHERE slug = ?`, slug)
	d, err := scanDocument(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Document{}, ErrNotFound
	}
	return d, err
}

func (s *Store) CreateDocument(in DocumentInput) (Document, error) {
	ts := now()
	res, err := s.db.Exec(
		`INSERT INTO documents (slug, title, summary, body, kind, published, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		in.Slug, in.Title, in.Summary, in.Body, in.Kind, boolToInt(in.Published), ts, ts,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			return Document{}, ErrSlugTaken
		}
		return Document{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return Document{}, err
	}
	return Document{
		ID: id, Slug: in.Slug, Title: in.Title, Summary: in.Summary,
		Body: in.Body, Kind: in.Kind, Published: in.Published,
		CreatedAt: parseTime(ts), UpdatedAt: parseTime(ts),
	}, nil
}

func (s *Store) UpdateDocument(slug string, in DocumentInput) (Document, error) {
	ts := now()
	res, err := s.db.Exec(
		`UPDATE documents
		 SET slug = ?, title = ?, summary = ?, body = ?, kind = ?, published = ?, updated_at = ?
		 WHERE slug = ?`,
		in.Slug, in.Title, in.Summary, in.Body, in.Kind, boolToInt(in.Published), ts, slug,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			return Document{}, ErrSlugTaken
		}
		return Document{}, err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return Document{}, err
	}
	if n == 0 {
		return Document{}, ErrNotFound
	}
	return s.DocumentBySlug(in.Slug)
}

func (s *Store) DeleteDocument(slug string) error {
	res, err := s.db.Exec(`DELETE FROM documents WHERE slug = ?`, slug)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// rowScanner is satisfied by both *sql.Row and *sql.Rows.
type rowScanner interface{ Scan(dest ...any) error }

func scanDocument(rs rowScanner) (Document, error) {
	var d Document
	var published int
	var createdAt, updatedAt string
	if err := rs.Scan(&d.ID, &d.Slug, &d.Title, &d.Summary, &d.Body, &d.Kind,
		&published, &createdAt, &updatedAt); err != nil {
		return Document{}, err
	}
	d.Published = published != 0
	d.CreatedAt = parseTime(createdAt)
	d.UpdatedAt = parseTime(updatedAt)
	return d, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
