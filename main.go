package main

import (
	"log"
	"net/http"
	"strings"
	"gitlab.com/JerrodJTanner/slimewave/handlers"
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
	http.HandleFunc("/artists", handlers.LoadArtists)
	http.HandleFunc("/albums", handlers.LoadAlbums)
	http.HandleFunc("/songs", handlers.LoadSongs)

	log.Fatal(http.ListenAndServe(":8001", nil))
}
