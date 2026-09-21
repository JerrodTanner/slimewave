import type { PortalKey } from './portals';

/**
 * The door glyphs, as path data on a 24×24 grid, meant to be stroked rather
 * than filled.
 *
 * One set, three places: the rail wears them at 21px, the window's titlebar at
 * 16px once that door is the page you are reading, and the corridor paints
 * them onto a plate hanging in the doorway itself. A door is then the same
 * sign whether you meet it as a tile, as a titlebar or as an opening in a wall.
 *
 * They are plain `d` strings because that is the one shape both an `<svg>` and
 * a canvas `Path2D` will take — which is what lets a glyph be a DOM icon and a
 * texture without being drawn twice and drifting apart. For the same reason a
 * circle is written as two arcs rather than as a `<circle>`.
 */
export const DOOR_ICON: Record<PortalKey, string[]> = {
	resume: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
	plan: ['M3 7h18v13H3z', 'M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2', 'M3 12h18'],
	media: [
		'M9 18V5l12-2v13',
		'M3 18a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
		'M15 16a3 3 0 1 0 6 0a3 3 0 1 0-6 0'
	]
};

/**
 * What the door of the room you are already in wears instead of its own glyph.
 *
 * The same swap the label makes: that door is the way out, not a link back to
 * the page under your nose, so it stops advertising the section and points at
 * the door you came in by. See room.svelte.ts.
 */
export const EXIT_ICON: string[] = ['M19 12H5', 'm11 18-6-6 6-6'];
