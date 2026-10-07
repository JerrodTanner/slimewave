# slimewave

Jerrod Tanner's personal site, live at https://jerrodtanner.com. One Go binary
serves a JSON API, media files, and a SvelteKit SPA. The visible brand is
"ShineWave"; the repo, image, env vars and storage keys are "slimewave".

## What the site is for

A business tool first, portfolio second. The audience is small-business owners
who might hire Jerrod for reporting, databases, and workflows, plus recruiters
reading the resume. The pitch is one line, the Bold headline, which Clean and
Homey also carry in their header (`SiteMission.svelte`): "Less busywork. More
business."

The main menu has four things:

- **The window** — a 3D corridor (Babylon.js). Walking into a doorway navigates.
- **The pitch tile** (`IndustriesTile.svelte`) — "Time savers & workflow
  upgrades": the same rows as Bold's band, each scrolling the window down to
  its work sample. At the bottom: a message box, a CONTACT ME button,
  and the email address.
- **Three doors** — Resume (`/resume`), Plan a Project (`/plan`), Media (`/music`).

Under **Bold** (the default style) the main menu is different: a hero ("Less
busywork. More business."), a camo band of automation rows (`JOBS` in
`lib/content/jobs.ts`, rendered by
`BoldHero.svelte`; a row with an `infographic` opens a drawer holding a work
sample sheet, e.g. `LogKingBoard.svelte`. Five-step sheets are laid out by
`WorkSheet.svelte`, split ones by `SplitSheet.svelte`; the UI/UX gallery is
`DesignBoard.svelte`), then a closing contact section
(message box, CONTACT ME, Plan a Project, the email). There is no window, no
tile and no door tiles. The header is a flat bar with the name, the three
doors as plain links, Street/Night pills and the cog; it drops the header
sentence, since the hero makes the pitch. The page sits on a fixed wall of big
grey gradient tiles. The four things above describe Clean and Homey.

`/plan` is a questionnaire (domain, web design, reporting, database) that
builds a plain-text project brief. The brief goes out as a `mailto:` draft;
nothing is posted or stored.

Never edit `resume.md` (or the resume PDF) unless Jerrod explicitly asks.
Claims on the tile and the automation rows do not have to appear on the
resume.

## How it works

- **The canvas never unmounts.** A full page load would kill the WebGL context,
  so this is an SPA. `GameStage.svelte` creates the canvas once in the root layout.
  `HubFrame.svelte` holds empty placeholder boxes that the stage draws over.
  The `<audio>` element lives in the shell for the same reason.
- **Hub vs door.** On the hub (`/`) the corridor gets the big window. Behind a
  door, the page takes the window and the corridor moves into that door's tile.
  `crt.svelte.ts` hides the swap with a power-off/power-on effect.
  `portals.ts` holds the door list, `portalForPath` and `isFramed`.
- **Modes** (`ui.svelte.ts`, default `simple`, saved in localStorage). The cog menu
  labels them **3D Navigation off** (`simple`) / **on** (`advanced`); the code
  keeps the simple/advanced names. Under Bold the mode is always simple and
  the row is hidden; the stored choice (`#chosen`) is kept for the other styles:
  - *simple* — the corridor is a sealed backdrop, with no way in. Behind a door, the doors move into the header.
  - *advanced* — "click to activate" opens the corridor for first-person play.
    Behind a door, the doors stay in a side column.
  - The **main menu uses the same layout in both modes**: window (2 cols) and
    tile (1 col) on top, three doors across below. This is `lay-simple` +
    `lay-pitched` in `HubFrame.svelte`. The logo in `HubGate.svelte` sits in the
    same place in both modes; the CTA is absolutely positioned below it, so it
    never shifts the logo.
- **Themes** — each one block of CSS variables in `app.css` plus an entry in
  `themes.ts`. The `--scene-*` variables are read back and handed to Babylon.
- **Styles** — the cog menu's **Style** row: **Bold** (the default; Street,
  Night: a scroll-down pitch with no furniture, no window and no 3D, and the
  stage paused but still mounted), **Clean** (the hairline panels;
  Newsprint, Aero, Slimewave, Deepwater) or **Homey** (tile, leaded glass, wood
  and stone; Tile & Glass, Walnut). A theme belongs to one style, and the style
  is never stored: it follows from the theme and is set as `data-style` on
  `<html>` (before first paint too, in `app.html`). Homey's furniture is scoped
  `[data-style='homey']` blocks in `HubFrame`, `IndustriesTile` and `HubGate`,
  using pictures in `web/static/homey/`. Every one is original work or built
  from CC0 Poly Haven textures; `CREDITS.md` lists each file and its source.
  Keep it that way: anything added there must be original or CC0, with an entry
  in `CREDITS.md`.
- **Backdrop** — the card-plate image behind the frame. Its opacity defaults to 50%
  (`cardPlate.svelte.ts`) and can be adjusted in the cog menu.

## Content sources

| What | Where |
| --- | --- |
| Resume (the page) | `web/src/lib/content/resume.md`, typeset by `routes/resume/+page.svelte` |
| Resume (download) | `PDFs/Jerrod Tanner Resume.pdf`. **Separate file, re-export by hand when `resume.md` changes** |
| Time-saver rows (Bold band, Clean/Homey tile, window samples) | `JOBS` in `lib/content/jobs.ts` |
| Design examples (UI/UX gallery, `/plan` sample pages) | `lib/content/designs.ts`; images in `web/static/samples/` and `web/static/designs/` |
| Music | `audio/Artist/Album/Track.mp3`, indexed from disk |

## Routes

Frontend: `/`, `/resume`, `/plan`, `/music`, `/music/[artist]`,
`/music/[artist]/[album]`. Nothing else is linked. `/work`, `/writing`, `/admin`
and `/login` were removed as dead ends.

The Go API still has auth, documents and preferences endpoints (see README),
but no frontend page uses documents or login anymore. Leave them in place
unless asked to remove them.

## Commands

```
go run ./cmd/slimewave                    # API + media + built SPA on :8001
cd web && npm run dev                     # frontend with HMR, proxies API to :8001
go test ./...                             # backend tests
cd web && npm run check                   # svelte-check, must stay at 0 errors
```

Deploy: push to `main` → CI runs vet, test, svelte-check and build →
the image goes to GHCR → Watchtower on the host pulls it. The host reaches the
internet through a Cloudflare tunnel (`docker-compose.yml`). The SQLite database
lives on the `/app/data` volume.

## Conventions

- Comments explain *why*, in full sentences. That is the house style throughout;
  match it.
- Style with theme tokens (`--color-*`, `--radius-panel`, `--font-mono`), never
  hard-coded colors. The resume sheet is the one deliberate exception.
- Icons are stroked `d` strings on a 24×24 grid (`doorIcons.ts` convention), so
  one path works in both an `<svg>` and a canvas `Path2D`.

## To do: email endpoint

Both contact paths (the tile's CONTACT ME button and the `/plan` brief) use
`mailto:`. They silently do nothing for visitors with no mail client configured
(webmail-only users), and long briefs can be truncated. The planned fix:

- `POST /api/contact` in `internal/api`. Validate the fields (required, length
  caps, email format). **Save to SQLite first**, so nothing is lost, then send
  through a transactional provider.
- Spam protection: a honeypot field and a per-IP rate limit. The visitor's real
  IP is in `CF-Connecting-IP`, because the site sits behind the Cloudflare tunnel.
- Config through env vars in the existing `SLIMEWAVE_*` pattern (provider API
  key, to/from address).
- Frontend: both buttons `fetch` the endpoint and show sent/error states, with
  the plain email address kept as a fallback. The `brief` string in `/plan` is
  already the full payload.
- Needs from Jerrod before it can go live: a provider account (Resend is the
  suggested choice; its free tier covers the volume), the SPF/DKIM DNS records
  on jerrodtanner.com in Cloudflare, and the API key in the host's `.env`.
