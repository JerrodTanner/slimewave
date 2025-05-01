// main.go

package main

import (
	"log"
	"net/http"
	"slimewave/handlers"
	"strings"
)

func handler(w http.ResponseWriter, r *http.Request) {
	filePath := r.URL.Path[1:]
	if strings.HasSuffix(filePath, ".mp3") {
		w.Header().Set("Content-Type", "audio/mpeg")
	}
	http.ServeFile(w, r, filePath)
}

func main() {
	handlers.UpdateJSON("audio", "music.json")

	http.HandleFunc("/", handler)
	http.HandleFunc("/music", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "music.json")
	})
	http.HandleFunc("/artists", handlers.ArtistHandler)
	http.HandleFunc("/albums", handlers.AlbumHandler)
	http.HandleFunc("/songs", handlers.SongsHandler)

	http.HandleFunc("/resume", handlers.ResumeHandler)
	http.HandleFunc("/index", func(w http.ResponseWriter, r *http.Request) {
		// Serve the HTML navigation page
		http.ServeFile(w, r, "tableofcontents.html") // Ensure this points to the correct path of the HTML file
	})

	log.Fatal(http.ListenAndServe(":8001", nil))
}
