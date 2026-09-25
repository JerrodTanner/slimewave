/**
 * The theme registry.
 *
 * Themes are a visitor-facing feature, so each one gets a name and a line of
 * copy for the switcher rather than being an anonymous id. The actual colours
 * live in src/app.css under `[data-theme='<id>']`; this file only describes
 * them to the UI.
 */
export type ThemeId =
	| 'newsprint'
	| 'aero'
	| 'slimewave'
	| 'deepwater';

export interface Theme {
	id: ThemeId;
	name: string;
	blurb: string;
	/** Three colours for the switcher's preview chip: bg, accent, secondary. */
	swatch: [string, string, string];
}

export const THEMES: Theme[] = [
	{
		id: 'newsprint',
		name: 'Newsprint',
		blurb: 'Paper white, hairline black, one print green. The house style.',
		swatch: ['#eceae2', '#0b7a34', '#1f39ff']
	},
	{
		id: 'aero',
		name: 'Aero',
		blurb: 'Obsidian and amethyst, lit glass. The house style.',
		swatch: ['#17171c', '#b98cff', '#4fe0d8']
	},
	{
		id: 'slimewave',
		name: 'Slimewave',
		blurb: 'Acid green on wet black. The old house style.',
		swatch: ['#04090b', '#9dff3c', '#ff4fd8']
	},
	{
		id: 'deepwater',
		name: 'Deepwater',
		blurb: 'Dim blue and a serif. Built for long reading.',
		swatch: ['#070d18', '#5ee6ff', '#a688ff']
	}
];

export const DEFAULT_THEME: ThemeId = 'newsprint';

export const THEME_IDS = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && (THEME_IDS as string[]).includes(value);
}

export function themeById(id: ThemeId): Theme {
	return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
