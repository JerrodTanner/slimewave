/**
 * The theme registry.
 *
 * Themes are a visitor-facing feature, so each one gets a name and a line of
 * copy for the switcher rather than being an anonymous id. The actual colours
 * live in src/app.css under `[data-theme='<id>']`; this file only describes
 * them to the UI.
 */
export type ThemeId =
	| 'street'
	| 'night'
	| 'newsprint'
	| 'aero'
	| 'slimewave'
	| 'deepwater'
	| 'glass'
	| 'walnut';

/**
 * The three looks the site can wear. A style is the furniture — flat hairline
 * panels, or tile, glass, wood and stone — and a theme is a palette within
 * it, which is why every theme belongs to exactly one style. The style is
 * never stored on its own: it follows from the theme, so the two can never
 * disagree.
 *
 * Bold is the odd one out: it has no furniture and no 3D. Its front page is
 * a scroll-down pitch instead of a window onto the corridor.
 */
export type Style = 'bold' | 'clean' | 'homey';

export interface Theme {
	id: ThemeId;
	name: string;
	blurb: string;
	style: Style;
	/**
	 * The settings menu's little picture of the theme, in its real colours:
	 * the ground, the card on it, a headline in the ink, and a band of the
	 * accent (the camo, under Bold). Kept in step with app.css by hand.
	 */
	preview: { ground: string; card: string; ink: string; accent: string };
}

export const THEMES: Theme[] = [
	{
		id: 'street',
		name: 'Street',
		blurb: 'Off-white, heavy black type, a band of forest camo. The house style.',
		style: 'bold',
		preview: { ground: '#f4f2ec', card: '#f4f2ec', ink: '#111110', accent: '#223f1f' }
	},
	{
		id: 'night',
		name: 'Night',
		blurb: 'Black, white type, a band of midnight-purple camo.',
		style: 'bold',
		preview: { ground: '#0b0a0e', card: '#0b0a0e', ink: '#f4f2f8', accent: '#8f63e0' }
	},
	{
		id: 'newsprint',
		name: 'Newsprint',
		blurb: 'Paper white, hairline black, one print green.',
		style: 'clean',
		preview: { ground: '#eceae2', card: '#fafaf5', ink: '#14130f', accent: '#0b7a34' }
	},
	{
		id: 'aero',
		name: 'Aero',
		blurb: 'Obsidian and amethyst, lit glass. The house style.',
		style: 'clean',
		preview: { ground: '#17171c', card: '#221d2c', ink: '#f4effd', accent: '#b98cff' }
	},
	{
		id: 'slimewave',
		name: 'Slimewave',
		blurb: 'Acid green on wet black. The old house style.',
		style: 'clean',
		preview: { ground: '#04090b', card: '#102026', ink: '#dcf5ec', accent: '#9dff3c' }
	},
	{
		id: 'deepwater',
		name: 'Deepwater',
		blurb: 'Dim blue and a serif. Built for long reading.',
		style: 'clean',
		preview: { ground: '#070d18', card: '#0d1626', ink: '#dce7ff', accent: '#5ee6ff' }
	},
	{
		id: 'glass',
		name: 'Tile & Glass',
		blurb: 'Sage tiles, majolica and leaded glass in an oak frame.',
		style: 'homey',
		preview: { ground: '#6d8a84', card: '#efe8d6', ink: '#1d2b52', accent: '#8a2e14' }
	},
	{
		id: 'walnut',
		name: 'Walnut',
		blurb: 'Walnut boards, a stone window and gilt.',
		style: 'homey',
		preview: { ground: '#3b2415', card: '#efe8d6', ink: '#1d2b52', accent: '#c9a45c' }
	}
];

export const DEFAULT_THEME: ThemeId = 'street';

export const STYLES: { id: Style; name: string }[] = [
	{ id: 'bold', name: 'Bold' },
	{ id: 'clean', name: 'Clean' },
	{ id: 'homey', name: 'Homey' }
];

/** Where a style lands the first time it is picked. */
export const STYLE_DEFAULT_THEME: Record<Style, ThemeId> = {
	bold: DEFAULT_THEME,
	clean: 'newsprint',
	homey: 'glass'
};

export const THEME_IDS = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && (THEME_IDS as string[]).includes(value);
}

export function themeById(id: ThemeId): Theme {
	return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function themesForStyle(style: Style): Theme[] {
	return THEMES.filter((t) => t.style === style);
}
