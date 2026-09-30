# Credits and third-party assets

A record of every picture in `web/static/homey/` (the Homey style) and where it
came from. Kept here rather than beside the pictures because everything under
`web/static/` is served publicly.

**Status: cleared.** Every file is either original work made for this site or
built from CC0 (public domain) textures. None of it needs permission or credit.

## CC0 textures from Poly Haven

[Poly Haven](https://polyhaven.com) publishes all its assets under
[CC0](https://polyhaven.com/license): free to use, change and publish, with no
credit required. The authors are listed anyway, as a courtesy and so the source
of each file stays on record. Downloaded 2026-09-30 as 2K colour maps.

| Poly Haven texture | Authors | Used for | Shipped files |
| --- | --- | --- | --- |
| [`dark_wood`](https://polyhaven.com/a/dark_wood) | Dario Barresi, Dimitrios Savva, Rico Cilliers | Walnut: the wall boards, the hallway's panelling and door, the floor | `wall-walnut.jpg`, `hall.jpg` |
| [`teak_veneer`](https://polyhaven.com/a/teak_veneer) | Jenelle van Heerden | Oak: the window frame and the doors tile's frame | `frame-oak.jpg` |
| [`dirty_carpet`](https://polyhaven.com/a/dirty_carpet) | Rohit Seervi | Fibre detail in the hallway's runner rug, re-tinted green | `hall.jpg` |

The textures were turned so their grain runs along each board, recoloured,
tiled, and in `hall.jpg` mapped onto the lit 3D hallway.

## Original work

Made for this site from procedural noise and hand-set geometry, using no
outside images:

- `majolica-a.jpg`, `majolica-b.jpg`, `majolica-ring.jpg`: two majolica-style
  tiles, a medallion and a floral cross, drawn from scratch in the tradition
  (not traced), then glazed and bevelled. The ring is a checker of the two.
- `marble.jpg`: generated white marble.
- The hallway's front door in `hall.jpg`: raised panels and an oval light,
  drawn procedurally on the walnut.
- `wall-sage.jpg`, `frame-gilt.jpg`, `frame-stone.jpg`, `stone.jpg`,
  `glass-resume.jpg`, `glass-plan.jpg`, `glass-media.jpg`, `glass-opal.jpg`.

## History

The first version of the style (commit `8c7d6f4`) was built partly from
material that was never cleared for use. On 2026-09-30 every file made from it
was regenerated from the sources above, and nothing from those sources remains
in the working tree:

- **URBAN 128x resource pack**, by Aryan Nikose (`urbanresourcepack` on
  [CurseForge](https://www.curseforge.com/minecraft/texture-packs/urban-free-128x)
  and [Modrinth](https://modrinth.com/resourcepack/urban_128x)), licensed
  All Rights Reserved. The site used its `stripped_dark_oak_log`,
  `spruce_door_top` / `spruce_door_bottom`, `green_wool` and `calcite`
  textures.
- **A Euro Tile Store product photograph** of hand-painted majolica tiles
  (eurotilestore.com), no license found. Two tile designs were cropped from it.

Those earlier versions still exist in git history, in commit `8c7d6f4`, but not
in the current files.
