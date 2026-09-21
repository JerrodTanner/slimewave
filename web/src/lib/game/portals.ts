export type DoorSide = 'left' | 'right' | 'end';

export type PortalKey = 'resume' | 'plan' | 'media';

export interface PortalSpec {
	/** Stable handle, so the hub rail can find a door without matching copy. */
	key: PortalKey;
	href: string;
	label: string;
	/** Which surface of the corridor the doorway is cut into. */
	side: DoorSide;
	/** Metres down the corridor from the spawn end. */
	depth: number;
}

/**
 * The doorways are the site's navigation. Walking into one goes to that
 * section.
 *
 * The hub is a corridor, so the order here is the order you meet them walking
 * in: the two nearest doors face each other, then the one further down. That
 * makes the list an itinerary rather than an arc.
 *
 * Kept in its own module so the HUD can list them without importing the
 * Babylon scene — the fallback list on the hub page has to work even when the
 * browser gives us no WebGL context at all.
 */
export const PORTALS: PortalSpec[] = [
	{ key: 'resume', href: '/resume', label: 'RESUME', side: 'left', depth: 8 },
	{ key: 'plan', href: '/plan', label: 'PLAN A PROJECT', side: 'right', depth: 8 },
	{ key: 'media', href: '/music', label: 'MEDIA', side: 'left', depth: 18 }
];

/** The doors by key, for the rail on the hub page. */
export const PORTAL = Object.fromEntries(PORTALS.map((p) => [p.key, p])) as Record<
	PortalKey,
	PortalSpec
>;

/** Corridor dimensions, shared by the scene and anything that reasons about it. */
export const CORRIDOR = {
	halfWidth: 3.6,
	height: 4.4,
	doorWidth: 2.8,
	doorHeight: 3.2,
	wallThickness: 0.4,
	/** Back wall, behind the spawn point. */
	startZ: -6,
	/** Far wall, which carries the `end` door. */
	endZ: 28,
	spawnZ: -3,
	eyeHeight: 1.75
} as const;

/**
 * Which door a path belongs to, or `null` for the hub itself and for anything
 * that is not behind a door at all.
 *
 * The frame needs this to know which tile currently holds the corridor, so it
 * lives next to the door list rather than in a component.
 */
export function portalForPath(path: string): PortalKey | null {
	for (const portal of PORTALS) {
		if (path === portal.href || path.startsWith(`${portal.href}/`)) return portal.key;
	}
	return null;
}

/**
 * True for the routes that render inside the hub frame — the hub and its
 * doors. Everything else (the flat pages behind the plain nav) is not framed,
 * and the corridor does not follow it there.
 */
export function isFramed(path: string): boolean {
	if (path === '/') return true;
	return portalForPath(path) !== null;
}
