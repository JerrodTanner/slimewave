package handlers

import "net/http"

func ResumeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	http.ServeFile(w, r, "resume.html") // Adjust path if necessary
}
