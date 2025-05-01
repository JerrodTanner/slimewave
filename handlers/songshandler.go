// handlers/songshandler.go

package handlers

import (
	"html/template"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func SongsHandler(w http.ResponseWriter, r *http.Request) {
	artist := r.URL.Query().Get("artist")
	album := r.URL.Query().Get("album")
	if artist == "" || album == "" {
		http.Error(w, "Missing artist or album parameter", http.StatusBadRequest)
		return
	}
	type SongsPageData struct {
		Image  string
		Artist string
		Album  string
		Songs  []string
	}
	// Build file path: ./audio/Artist/Album/
	songDir := filepath.Join("audio", artist, album)
	image := filepath.Join("audio", artist, album, "cover.jpg")

	files, err := os.ReadDir(songDir)
	if err != nil {
		http.Error(w, "Could not read song directory", http.StatusInternalServerError)
		return
	}

	var songs []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".mp3") {
			song := strings.TrimSuffix(f.Name(), ".mp3")
			songs = append(songs, song)
		}
	}

	data := SongsPageData{
		Artist: artist,
		Album:  album,
		Songs:  songs,
		Image:  image,
	}

	tmpl, err := template.ParseFiles("songs.html")
	if err != nil {
		http.Error(w, "Template error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		http.Error(w, "Execution error: "+err.Error(), http.StatusInternalServerError)
	}
}
