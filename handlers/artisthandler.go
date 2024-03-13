package handlers

import (
    "encoding/json"
    "net/http"
    "io/ioutil"
    "log"
)

// ArtistHandler handles requests for artist data.
func ArtistHandler(w http.ResponseWriter, r *http.Request) {
    // Read the music.json file
    data, err := ioutil.ReadFile("music.json")
    if err != nil {
        log.Println(err)
        http.Error(w, "Failed to read music data", http.StatusInternalServerError)
        return
    }

    // Unmarshal the JSON data
    var tracks []Track
    err = json.Unmarshal(data, &tracks)
    if err != nil {
        log.Println(err)
        http.Error(w, "Failed to unmarshal music data", http.StatusInternalServerError)
        return
    }

    // Extract the list of unique artists
    artistsMap := make(map[string]bool)
    artists := []string{}
    for _, track := range tracks {
        if _, found := artistsMap[track.Artist]; !found {
            artists = append(artists, track.Artist)
            artistsMap[track.Artist] = true
        }
    }

    // Generate the HTML for the list of artists
    html := "<ul>"
    for _, artist := range artists {
        html += "<li><a href='/albums?artist=" + artist + "'>" + artist + "</a></li>"
    }
    html += "</ul>"

    // Write the HTML response
    w.Header().Set("Content-Type", "text/html")
    w.Write([]byte(html))
}
