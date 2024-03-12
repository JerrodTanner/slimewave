// handlers/loadhandler.go

package handlers

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

// Track represents a music track.
type Track struct {
	Artist string `json:"artist"`
	Album  string `json:"album"`
	Title  string `json:"title"`
	File   string `json:"file"`
	Image  string `json:"image"`
}

// LoadArtists loads all unique artists from the music.json file.
func LoadArtists(w http.ResponseWriter, r *http.Request) {
	tracks, err := loadTracks()
	if err != nil {
		log.Println(err)
		http.Error(w, "Failed to load artists", http.StatusInternalServerError)
		return
	}

	artistsMap := make(map[string]bool)
	artists := []string{}

	for _, track := range tracks {
		if _, found := artistsMap[track.Artist]; !found {
			artists = append(artists, track.Artist)
			artistsMap[track.Artist] = true
		}
	}

	json.NewEncoder(w).Encode(artists)
}

// LoadAlbums loads all albums for a given artist from the music.json file.
func LoadAlbums(w http.ResponseWriter, r *http.Request) {
	artist := r.URL.Query().Get("artist")
	if artist == "" {
		http.Error(w, "Artist not specified", http.StatusBadRequest)
		return
	}

	tracks, err := loadTracks()
	if err != nil {
		log.Println(err)
		http.Error(w, "Failed to load albums", http.StatusInternalServerError)
		return
	}

	albumsMap := make(map[string]bool)
	albums := []string{}

	for _, track := range tracks {
		if track.Artist == artist {
			if _, found := albumsMap[track.Album]; !found {
				albums = append(albums, track.Album)
				albumsMap[track.Album] = true
			}
		}
	}

	json.NewEncoder(w).Encode(albums)
}

// LoadSongs loads all songs for a given album and artist from the music.json file.
func LoadSongs(w http.ResponseWriter, r *http.Request) {
	artist := r.URL.Query().Get("artist")
	album := r.URL.Query().Get("album")

	if artist == "" || album == "" {
		http.Error(w, "Artist or album not specified", http.StatusBadRequest)
		return
	}

	tracks, err := loadTracks()
	if err != nil {
		log.Println(err)
		http.Error(w, "Failed to load songs", http.StatusInternalServerError)
		return
	}

	var songs []Track

	for _, track := range tracks {
		if track.Artist == artist && track.Album == album {
			songs = append(songs, track)
		}
	}

	json.NewEncoder(w).Encode(songs)
}

func loadTracks() ([]Track, error) {
	data, err := ioutil.ReadFile("music.json")
	if err != nil {
		return nil, err
	}

	var tracks []Track
	err = json.Unmarshal(data, &tracks)
	if err != nil {
		return nil, err
	}

	return tracks, nil
}
