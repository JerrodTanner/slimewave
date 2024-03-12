package main

import (
    "log"
    "net/http"
    "strings"
    "github.com/fsnotify/fsnotify"
    "gitlab.com/JerrodJTanner/slimewave/handlers"
)

func handler(w http.ResponseWriter, r *http.Request) {
    // Get the requested file path
    filePath := r.URL.Path[1:]

    // Set the correct Content-Type header for MP3 files
    if strings.HasSuffix(filePath, ".mp3") {
        w.Header().Set("Content-Type", "audio/mpeg")
    }

    // Serve the file
    http.ServeFile(w, r, filePath)
}

func main() {
    // Update the JSON file initially
    handlers.UpdateJSON("audio", "music.json")

    // Create a file watcher
    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        log.Fatal(err)
    }
    defer watcher.Close()

    // Watch the audio directory for changes
    err = watcher.Add("audio")
    if err != nil {
        log.Fatal(err)
    }

    // Handle events from the watcher
    go func() {
        for {
            select {
            case event, ok := <-watcher.Events:
                if !ok {
                    return
                }
                if event.Op&fsnotify.Write == fsnotify.Write {
                    // Update the JSON file if there is a write event
                    handlers.UpdateJSON("audio", "music.json")
                }
            case err, ok := <-watcher.Errors:
                if !ok {
                    return
                }
                log.Println("error:", err)
            }
        }
    }()

    http.HandleFunc("/", handler)
    http.HandleFunc("/music", func(w http.ResponseWriter, r *http.Request) {
        http.ServeFile(w, r, "music.json")
    })
    log.Fatal(http.ListenAndServe(":8001", nil))
}
