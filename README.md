# slimewave

My site, live at [jerrodtanner.com](https://jerrodtanner.com): where small
businesses find me for reporting, databases, and workflows, and where the
resume lives. The front of it is a 3D corridor you can walk around in, and
there is a music library behind one of the doors. One Go binary serves all of it.

```
go run ./cmd/slimewave          # API + media + the built SPA on :8001
cd web && npm install && npm run dev   # frontend with hot reload, proxying to :8001
```

## What is on it

The main menu is the corridor's window, a tile that makes the pitch
(back-office automation in healthcare, finance ops and hospitality, with a
message box and my email), and three doors:

| Door | Route | |
| --- | --- | --- |
| Resume | `/resume` | typeset from `web/src/lib/content/resume.md`; the PDF in `PDFs/` is the download |
| Plan a project | `/plan` | a questionnaire that writes a project brief |
| Media | `/music` | artist / album / track browsing and a player that survives navigation |

**3D Navigation** is a toggle in the cog menu beside the name. **Off**, the
default, keeps the corridor a backdrop. **On** adds "click to activate" and
lets you walk in. The main menu is laid out the same either way.

Both contact paths, the tile's button and the brief, open a `mailto:` draft
for now. A real `POST /api/contact` is the next thing to build; the plan is in
`CLAUDE.md`.

## Why it is built this way

The hard requirement is that **the game stays alive while you browse**. A full
page load destroys the WebGL context and resets the scene, so the site has to
be a single page app, and the canvas has to live somewhere that navigation
never unmounts. Everything else follows from that:

- **SvelteKit**, because the pattern this needs — a persistent shell with
  swappable routed content — is what `+layout.svelte` plus `{@render children()}`
  already is, with no virtual DOM competing with the canvas for frame budget.
- **Go as an API and file server only.** No templates. Once the SPA exists,
  server-rendered HTML would be a second rendering path for no gain.
- **Babylon.js on one engine.** Browsers cap live WebGL contexts, so every
  scene shares a single engine and the stage swaps which one renders.

The canvas is created once in `web/src/lib/components/GameStage.svelte`, which
the root layout mounts. Routed pages render around it. So does the `<audio>`
element, for the same reason: a player inside a route would stop the music on
every link click.

Walking into a portal does change the route — the smoothness is a timed fade
(`stage.transitionTo`), not preserved page state. Only the canvas behind the
fade genuinely survives.

## Layout

```
cmd/slimewave/      entrypoint
internal/
  api/              routes and handlers
  auth/             bcrypt, session cookies, request context
  config/           environment
  httpx/            JSON helpers, SPA fallback server
  media/            music index, range-request file server
  store/            SQLite: users, sessions, documents, preferences
web/
  src/lib/game/     stage (engine + scene manager), hub scene
  src/lib/theme/    theme registry and state
  src/lib/state/    session, audio player, UI prefs
  src/routes/       pages that mount around the persistent shell
audio/              Artist/Album/Track.mp3, with an optional cover.jpg
PDFs/               downloadable documents
```

## Themes

Five, visitor-selectable, in the cog menu beside the name. A theme is one block of
CSS custom properties in `web/src/app.css` plus an entry in
`web/src/lib/theme/themes.ts` — nothing else. The `--scene-*` variables in each
block are read back out with `getComputedStyle` and handed to Babylon, so
changing the theme reskins the 3D scene too.

Preference is stored in `localStorage`. The API can sync it to an account,
but the site no longer has a sign-in page, so in practice it stays local. An inline script in `app.html` applies it before first paint so there is no
flash.

## API

The auth and documents endpoints predate the current frontend. Nothing on the
site calls documents or sign-in anymore; they are kept in case writing comes
back.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/login` `/logout` `/register` | registration is off unless `SLIMEWAVE_ALLOW_REGISTRATION=true` |
| `GET` | `/api/auth/me` | anonymous is a normal answer, not a 401 |
| `GET`/`PUT` | `/api/preferences` | theme sync; requires a session |
| `GET` | `/api/documents`, `/api/documents/{slug}` | published only, unless you are the owner |
| `POST`/`PUT`/`DELETE` | `/api/documents[/{slug}]` | owner only |
| `GET` | `/api/music/library`, `/artists`, `/artists/{a}`, `/artists/{a}/albums/{b}` | read from the on-disk index |
| `POST` | `/api/music/rescan` | owner only |
| `GET` | `/media/audio/...`, `/media/docs/...` | range requests supported, so seeking works |

Anything under `/api/` that does not match returns JSON, not the SPA shell.
Everything else falls back to `index.html` so deep links survive a refresh.

## Configuration

All optional; the defaults run from a fresh checkout.

| Variable | Default | |
| --- | --- | --- |
| `SLIMEWAVE_ADDR` | `:8001` | listen address |
| `SLIMEWAVE_DB` | `data/slimewave.db` | SQLite file; its directory is created |
| `SLIMEWAVE_WEB_DIR` | `web/build` | built SPA; missing is fine in dev |
| `SLIMEWAVE_AUDIO_DIR` | `audio` | music library root |
| `SLIMEWAVE_DOCS_DIR` | `PDFs` | downloadable files |
| `SLIMEWAVE_SESSION_TTL` | `720h` | how long a login lasts |
| `SLIMEWAVE_SECURE_COOKIES` | `false` | set in production |
| `SLIMEWAVE_ALLOW_REGISTRATION` | `false` | public sign-ups |
| `SLIMEWAVE_ADMIN_EMAIL` / `_PASSWORD` | — | seeds the owner account on first run |

## Deployment

`docker build -t slimewave .` produces a single image: Node builds the bundle,
Go builds a static binary (`CGO_ENABLED=0`, pure-Go SQLite driver), and the
runtime stage carries the binary, the bundle, `audio/` and `PDFs/`.

Pushing to `main` runs `go vet`, `go test`, `svelte-check` and the frontend
build, then publishes to GHCR; Watchtower pulls it on the host. Mount a volume
at `/app/data` — the image is replaced on every deploy and the database is not.

## Tests

```
go test ./...                 # API, auth, documents, music index, range requests, path traversal
cd web && npm run check       # svelte-check
```
