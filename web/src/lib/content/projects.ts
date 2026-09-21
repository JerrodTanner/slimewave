/**
 * Portfolio entries.
 *
 * These live in the repo rather than the database on purpose: they change
 * when the code changes, they want to be reviewed in a diff, and they should
 * never depend on the database being reachable. Writing goes in the database;
 * this does not.
 */
export interface Project {
	name: string;
	role: string;
	year: string;
	summary: string;
	stack: string[];
	links: { label: string; href: string }[];
	/** Marks the one or two things worth leading with. */
	featured?: boolean;
}

export const PROJECTS: Project[] = [
	{
		name: 'slimewave',
		role: 'Everything',
		year: '2024—',
		summary:
			'This site. A Go binary serves a JSON API, streams a music library with range requests, and hands back one SvelteKit bundle for every route. The 3D hub lives in the root layout and survives navigation, which is the constraint the whole stack was picked around.',
		stack: ['Go', 'SQLite', 'SvelteKit', 'Tailwind', 'Babylon.js', 'Docker'],
		links: [{ label: 'source', href: 'https://github.com/jerrodtanner/slimewave' }],
		featured: true
	},
	{
		name: 'Portal hub',
		role: 'Design and implementation',
		year: '2024',
		summary:
			'A first-person arena where each portal is a section of the site. Walking into one fades the viewport and routes; the WebGL context never goes away, so the scene is still running when you come back.',
		stack: ['Babylon.js', 'TypeScript'],
		links: [{ label: 'walk it', href: '/' }],
		featured: true
	},
	{
		name: 'Music library',
		role: 'Backend and player',
		year: '2024',
		summary:
			'Artist / album / track browsing over a directory tree on disk, with seeking that works because the Go handler answers range requests properly. The player element sits in the shell, so audio keeps going while you read.',
		stack: ['Go', 'SvelteKit', 'Media Session API'],
		links: [{ label: 'browse', href: '/music' }]
	}
];
