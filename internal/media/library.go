// Package media indexes the on-disk music library and serves audio and
// artwork. The library is a directory tree: AudioDir/Artist/Album/Track.mp3,
// with an optional cover.jpg per album.
package media

import (
	"errors"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"sync"
)

// audioExtensions are the files considered playable tracks.
var audioExtensions = map[string]string{
	".mp3":  "audio/mpeg",
	".m4a":  "audio/mp4",
	".flac": "audio/flac",
	".ogg":  "audio/ogg",
	".opus": "audio/opus",
	".wav":  "audio/wav",
}

// hiddenMarker, dropped into an artist's folder, keeps the files on disk but
// out of the index, and the file server refuses them too, so the artist never
// reaches the API, the player, or a direct link.
const hiddenMarker = ".hidden"

// underHidden reports whether full (a path SafeJoin resolved inside root) sits
// in a top-level folder carrying the hidden marker.
func underHidden(root, full string) bool {
	absRoot, err := filepath.Abs(root)
	if err != nil {
		return false
	}
	if resolved, err := filepath.EvalSymlinks(absRoot); err == nil {
		absRoot = resolved
	}
	rel, err := filepath.Rel(absRoot, full)
	if err != nil {
		return false
	}
	top, _, nested := strings.Cut(filepath.ToSlash(rel), "/")
	if !nested {
		return false
	}
	_, err = os.Stat(filepath.Join(absRoot, top, hiddenMarker))
	return err == nil
}

// coverNames are tried in order when looking for album art.
var coverNames = []string{"cover.jpg", "cover.jpeg", "cover.png", "folder.jpg"}

type Track struct {
	Title     string `json:"title"`
	Artist    string `json:"artist"`
	Album     string `json:"album"`
	File      string `json:"file"`      // filename on disk, e.g. "Untitled Track 1.mp3"
	StreamURL string `json:"streamUrl"` // URL the player hits
	Size      int64  `json:"size"`
}

type Album struct {
	Name     string  `json:"name"`
	Artist   string  `json:"artist"`
	CoverURL string  `json:"coverUrl"` // empty when the album has no artwork
	Tracks   []Track `json:"tracks"`
}

type Artist struct {
	Name   string  `json:"name"`
	Albums []Album `json:"albums"`
}

// Library is an in-memory index of the audio directory. It is rebuilt on
// demand rather than watched: the collection changes when I add files and
// redeploy, not while the server runs.
type Library struct {
	root string

	mu      sync.RWMutex
	artists []Artist
}

func NewLibrary(root string) *Library {
	return &Library{root: root, artists: []Artist{}}
}

// Root is the directory the library indexes.
func (l *Library) Root() string { return l.root }

// Scan walks the audio directory and replaces the index.
func (l *Library) Scan() error {
	byArtist := map[string]map[string][]Track{}

	err := filepath.WalkDir(l.root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			// A single unreadable directory should not fail the whole scan.
			if errors.Is(err, fs.ErrPermission) {
				return nil
			}
			return err
		}
		if d.IsDir() {
			if filepath.Dir(p) == filepath.Clean(l.root) {
				if _, err := os.Stat(filepath.Join(p, hiddenMarker)); err == nil {
					return filepath.SkipDir
				}
			}
			return nil
		}
		ext := strings.ToLower(filepath.Ext(p))
		if _, ok := audioExtensions[ext]; !ok {
			return nil
		}
		rel, err := filepath.Rel(l.root, p)
		if err != nil {
			return nil
		}
		parts := strings.Split(filepath.ToSlash(rel), "/")
		if len(parts) != 3 {
			// Anything not Artist/Album/Track is not part of the library.
			return nil
		}
		artist, album, file := parts[0], parts[1], parts[2]

		var size int64
		if info, err := d.Info(); err == nil {
			size = info.Size()
		}

		if byArtist[artist] == nil {
			byArtist[artist] = map[string][]Track{}
		}
		byArtist[artist][album] = append(byArtist[artist][album], Track{
			Title:     strings.TrimSuffix(file, filepath.Ext(file)),
			Artist:    artist,
			Album:     album,
			File:      file,
			StreamURL: streamURL(artist, album, file),
			Size:      size,
		})
		return nil
	})
	if err != nil && !errors.Is(err, fs.ErrNotExist) {
		return err
	}

	artists := make([]Artist, 0, len(byArtist))
	for artistName, albumMap := range byArtist {
		albums := make([]Album, 0, len(albumMap))
		for albumName, tracks := range albumMap {
			sort.Slice(tracks, func(i, j int) bool { return tracks[i].Title < tracks[j].Title })
			albums = append(albums, Album{
				Name:     albumName,
				Artist:   artistName,
				CoverURL: l.coverURL(artistName, albumName),
				Tracks:   tracks,
			})
		}
		sort.Slice(albums, func(i, j int) bool { return albums[i].Name < albums[j].Name })
		artists = append(artists, Artist{Name: artistName, Albums: albums})
	}
	sort.Slice(artists, func(i, j int) bool { return artists[i].Name < artists[j].Name })

	l.mu.Lock()
	l.artists = artists
	l.mu.Unlock()
	return nil
}

// Artists returns the whole index.
func (l *Library) Artists() []Artist {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.artists
}

// Artist returns one artist by exact name.
func (l *Library) Artist(name string) (Artist, bool) {
	l.mu.RLock()
	defer l.mu.RUnlock()
	for _, a := range l.artists {
		if a.Name == name {
			return a, true
		}
	}
	return Artist{}, false
}

// Album returns one album by artist and album name.
func (l *Library) Album(artist, album string) (Album, bool) {
	a, ok := l.Artist(artist)
	if !ok {
		return Album{}, false
	}
	for _, al := range a.Albums {
		if al.Name == album {
			return al, true
		}
	}
	return Album{}, false
}

// coverURL returns the media URL for an album's artwork, or "" if the album
// has none.
func (l *Library) coverURL(artist, album string) string {
	for _, name := range coverNames {
		if _, err := os.Stat(filepath.Join(l.root, artist, album, name)); err == nil {
			return "/media/audio/" + path.Join(escape(artist), escape(album), escape(name))
		}
	}
	return ""
}

func streamURL(artist, album, file string) string {
	return "/media/audio/" + path.Join(escape(artist), escape(album), escape(file))
}
