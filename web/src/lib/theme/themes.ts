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
	/** Three colours for the switcher's preview chip: bg, accent, secondary. */
	swatch: [string, string, string];
}

export const THEMES: Theme[] = [
	{
		id: 'street',
		name: 'Street',
		blurb: 'Off-white, heavy black type, a band of forest camo. The house style.',
		style: 'bold',
		swatch: ['#f4f2ec', '#223f1f', '#d8a31c']
	},
	{
		id: 'night',
		name: 'Night',
		blurb: 'Black, white type, a band of midnight-purple camo.',
		style: 'bold',
		swatch: ['#0b0a0e', '#24183f', '#e0b84a']
	},
	{
		id: 'newsprint',
		name: 'Newsprint',
		blurb: 'Paper white, hairline black, one print green.',
		style: 'clean',
		swatch: ['#eceae2', '#0b7a34', '#1f39ff']
	},
	{
		id: 'aero',
		name: 'Aero',
		blurb: 'Obsidian and amethyst, lit glass. The house style.',
		style: 'clean',
		swatch: ['#17171c', '#b98cff', '#4fe0d8']
	},
	{
		id: 'slimewave',
		name: 'Slimewave',
		blurb: 'Acid green on wet black. The old house style.',
		style: 'clean',
		swatch: ['#04090b', '#9dff3c', '#ff4fd8']
	},
	{
		id: 'deepwater',
		name: 'Deepwater',
		blurb: 'Dim blue and a serif. Built for long reading.',
		style: 'clean',
		swatch: ['#070d18', '#5ee6ff', '#a688ff']
	},
	{
		id: 'glass',
		name: 'Tile & Glass',
		blurb: 'Sage tiles, majolica and leaded glass in an oak frame.',
		style: 'homey',
		swatch: ['#6d8a84', '#f1ead8', '#d9a441']
	},
	{
		id: 'walnut',
		name: 'Walnut',
		blurb: 'Walnut boards, a stone window and gilt.',
		style: 'homey',
		swatch: ['#3b2415', '#c9c4b4', '#c9a45c']
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
