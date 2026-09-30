# Bold style: a scroll-down front page with a number wall

Date: 2026-09-30
Status: approved in chat, awaiting spec review

## Intent

The front page should sell the business at first glance, the way an Apple or
BAPE landing page does: one huge message, then proof. The look is a hybrid.
The pacing and whitespace come from Apple, and there is one loud streetwear
accent: a camo band behind three real numbers.

The audience is unchanged: small-business owners who might hire Jerrod for
back-office automation, and recruiters.

Success means that a first-time visitor sees the headline and the three numbers
before anything else, and one click takes them to `/plan`.

## Decisions

| Question | Decision |
| --- | --- |
| Where the pitch lives | A new third style, **Bold**, which becomes the default |
| Relationship to the existing menu | The hero fills the first screen, and the current menu sits one scroll below |
| Loud accent | An original camo band in three tones of the theme |
| Headline | "Less busywork. More business." |
| 3D | None under Bold. There is no window and no corridor, and the 3D Navigation toggle is hidden |
| Returning visitors | A stored theme wins. The storage key is not bumped |

## 1. The style

- `Style` becomes `'clean' | 'homey' | 'bold'`. The cog menu's Style row gets a
  third option, **Bold**.
- Two themes, each a block in `app.css` plus an entry in `themes.ts`:
  - **Street** (`street`), the default: an off-white page, near-black ink, and
    a camo band in three dark greens.
  - **Night** (`night`): a black page, white ink, and a camo band in three
    purples.
- Each theme adds `--camo-1`, `--camo-2` and `--camo-3`. It also carries the
  full `--scene-*` set, because the stage reads it on every theme change even
  while paused.
- The type is a system stack (`'Helvetica Neue', 'Arial Black', system-ui,
  sans-serif`) at weight 900 with tight tracking. There are still no webfonts.
- `DEFAULT_THEME` becomes `street`, and `STYLE_DEFAULT_THEME.bold` is `street`.
- In `app.html`, the pre-paint script maps `street`/`night` to
  `data-style="bold"`. With no stored theme, the default attributes become
  `data-theme="street" data-style="bold"`, so there is no flash of Clean.

### Returning visitors

A theme is only written to storage when a visitor picks one, so:

- Anyone who never picked a theme gets Bold, including returning visitors.
- Anyone who picked a theme keeps it.
- Anyone can pick Bold from the Style row.

`slimewave:theme:v2` is **not** bumped. The comment in `theme.svelte.ts` says
to bump it when the default changes. It gains a note on why this change is the
exception: a bump would override deliberate choices.

## 2. The front page under Bold

`HubFrame` renders a new `BoldHero.svelte` when the style is Bold and the route
is `/`. Clean and Homey do not change.

From top to bottom:

1. **Hero, full viewport height.** The existing header stays. Below it:
   - The headline **"Less busywork. More business."**, centered, at about
     `clamp(3rem, 9vw, 9rem)`, on two lines on phones.
   - A sub-line in small muted type: "Get your business digitized. Move more
     work, faster, with the team you already have." The site header keeps its
     own sentence ("I build reporting, databases, and workflows for
     businesses."): the header says what Jerrod does, and the hero says what
     the visitor gets.
2. **Camo band, full-bleed.** It breaks out of the frame's padding and spans
   the viewport.
   - The camo is an inline SVG of blob paths, written by hand and filled with
     `--camo-1/2/3`. It is original work, so it needs no `CREDITS.md` entry,
     and it is `aria-hidden`.
   - On it are three figures in heavy white type, each with a caption:
     - **20 HRS**: back per week · HR reconciliation
     - **$12K**: caught per month · 401k errors
     - **10×**: faster · booking queries
   - The figures count up once, the first time the band enters the viewport
     (IntersectionObserver). With `prefers-reduced-motion` they render at their
     final values. The final values are always in the markup, so screen
     readers never hear a mid-count number.
   - They sit three across on desktop and stack on phones.
   - White on every camo tone must reach a contrast of at least 4.5:1, checked
     by calculation, not by eye.
3. **CTA.** "What's eating your week?" with a **Plan a Project** button to
   `/plan`.
4. **The main menu, without the window.** The industries tile runs full
   width, with the three doors across below it.

Every figure is already on `resume.md`: 20 hours per week, $12k per month, and
up to 10× faster. That keeps the rule that every claim on the site appears on
the resume.

`.mat` currently has `lg:overflow-hidden`. Under Bold on the hub, it scrolls on
desktop too.

## 3. No 3D under Bold

- `ui.mode` becomes the *effective* mode: always `simple` under Bold,
  otherwise the stored choice. The stored choice moves to its own field and is
  never overwritten, so switching back to Clean or Homey restores it. Every
  existing reader of `ui.mode` keeps working unchanged.
- The cog menu hides the **3D Navigation** row under Bold.
- There is no window on the hub and no corridor tile behind a door. The canvas
  **stays mounted** (the site's core rule) but the stage is paused and draws
  nothing: no claimed rect and zero opacity. Leaving Bold resumes it with the
  same WebGL context.
- Door transitions keep the CRT power cycle.

## 4. Navigation

- Walking through a door resets `.mat`'s scroll to the top.
- Returning to `/` from a door scrolls to the main menu, past the hero. A fresh
  load starts at the hero.

## 5. Docs

`CLAUDE.md` gets a short paragraph on Bold: it is the default style, it has
the hero and number wall, and it has no window, no corridor and no 3D mode.
The four-things description of the main menu gets a note that it applies to
Clean and Homey.

## Testing

- `cd web && npm run check` stays at 0 errors. `go test ./...` still passes
  (the backend does not change).
- In a real browser:
  - Bold at desktop and phone widths: the hero, the band, the count-up and the
    CTA.
  - With reduced-motion on, the figures render at their final values.
  - Walk through each door and back. The door page opens at the top, and the
    hub comes back to the menu.
  - Switch between Street, Night, Newsprint and Tile & Glass. Leaving Bold
    brings the corridor back live, and returning to Bold hides it.
  - Storage: with no stored theme you get Street. With `newsprint` stored you
    keep Newsprint. With 3D on under Clean, switching to Bold and back keeps it
    on.
  - No flash of Clean on a hard reload under Bold.

## Out of scope

- Bold treatments for the doors, the tile or the door pages.
- More Bold themes.
- The contact email endpoint (still in `CLAUDE.md`'s to-do).
