export interface PortalSpec {
	href: string;
	label: string;
	caption: string;
}

/**
 * The portals are the site's navigation. Walking into one goes to that
 * section; the order here is the order they appear across the arc, left to
 * right.
 *
 * Kept in its own module so the HUD can list them without importing the
 * Babylon scene — the fallback list on the hub page has to work even when the
 * browser gives us no WebGL context at all.
 */
export const PORTALS: PortalSpec[] = [
	{ href: '/work', label: 'WORK', caption: 'what I have built' },
	{ href: '/resume', label: 'RESUME', caption: 'the one-pager' },
	{ href: '/music', label: 'MUSIC', caption: 'the library' },
	{ href: '/writing', label: 'WRITING', caption: 'notes and posts' },
	{ href: '/arcade', label: 'ARCADE', caption: 'the other games' }
];
