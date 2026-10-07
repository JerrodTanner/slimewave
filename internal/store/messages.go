package store

// Message is one contact-form or project-brief submission.
type Message struct {
	Kind  string
	Email string
	Body  string
	IP    string
}

// SaveMessage records a submission and returns its id, so the send result
// can be written back against it.
func (s *Store) SaveMessage(m Message) (int64, error) {
	res, err := s.db.Exec(
		`INSERT INTO messages (kind, email, body, ip, created_at) VALUES (?, ?, ?, ?, ?)`,
		m.Kind, m.Email, m.Body, m.IP, now(),
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// MarkMessageSent records a successful send. A failed one keeps sent_at
// empty, which is how an unsent message is found later.
func (s *Store) MarkMessageSent(id int64) error {
	_, err := s.db.Exec(`UPDATE messages SET sent_at = ?, send_error = '' WHERE id = ?`, now(), id)
	return err
}

// MarkMessageFailed records why a send did not go through.
func (s *Store) MarkMessageFailed(id int64, reason string) error {
	_, err := s.db.Exec(`UPDATE messages SET send_error = ? WHERE id = ?`, reason, id)
	return err
}
