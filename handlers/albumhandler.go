// handlers/albumhandler.go

package handlers

import (
    "encoding/json"
    "html/template"
    "io/ioutil"
    "log"
    "net/http"
    "path/filepath"
)


// AlbumHandler handles requests for album data.
func AlbumHandler(w http.ResponseWriter, r *http.Request) {
    // Get the artist name from the query parameter
    artist := r.URL.Query().Get("artist")
    if artist == "" {
        http.Error(w, "Missing artist parameter", http.StatusBadRequest)
        return
    }

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

    // Filter out the albums for the specified artist
    albums := make(map[string][]byte)
    for _, track := range tracks {
        if track.Artist == artist {
            // Assume there is an image file for each album named 'cover.jpg' in the album directory
            imagePath := filepath.Join("audio", artist, track.Album, "cover.jpg")
            image, err := ioutil.ReadFile(imagePath)
            if err != nil {
                log.Println(err)
                continue
            }
            albums[track.Album] = image
        }
    }

    // Execute the template with the album data
    tmpl, err := template.ParseFiles("albums.html")
    if err != nil {
        log.Println(err)
        http.Error(w, "Failed to parse template", http.StatusInternalServerError)
        return
    }

    err = tmpl.Execute(w, struct {
        Artist string
        Albums map[string][]byte
    }{
        Artist: artist,
        Albums: albums,
    })
    if err != nil {
        log.Println(err)
        http.Error(w, "Failed to execute template", http.StatusInternalServerError)
        return
    }
}
