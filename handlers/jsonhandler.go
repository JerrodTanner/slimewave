// handlers/jsonhandler.go
package handlers

import (
    "encoding/json"
    "io/ioutil"
    "log"
    "os"
    "path/filepath"
    "strings"
)

type Track struct {
    Artist string `json:"artist"`
    Album  string `json:"album"`
    Title  string `json:"title"`
    File   string `json:"file"`
    Image  string `json:"image"`
}

func UpdateJSON(audioDir, jsonFile string) error {
    var tracks []Track
    err := filepath.Walk(audioDir, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        if !info.IsDir() && filepath.Ext(path) == ".mp3" {
            parts := strings.Split(filepath.ToSlash(path), "/")
            if len(parts) < 4 {
                log.Printf("Invalid path format: %s\n", path)
                return nil
            }
            artist := parts[len(parts)-3]
            album := parts[len(parts)-2]
            title := strings.TrimSuffix(info.Name(), filepath.Ext(info.Name()))
            track := Track{
                Artist: artist,
                Album:  album,
                Title:  title,
                File:   filepath.Join(path),
                Image:  filepath.Join("/audio", artist, album, "cover.jpg"),
            }
            tracks = append(tracks, track)
        }
        return nil
    })
    if err != nil {
        return err
    }
    data, err := json.Marshal(tracks)
    if err != nil {
        return err
    }
    err = ioutil.WriteFile(jsonFile, data, 0644)
    if err != nil {
        return err
    }
    return nil
}
