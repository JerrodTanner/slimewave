import type { PortalKey } from './portals';

/**
 * Which room the visitor is standing in.
 *
 * The corridor does not go away when you walk through a door — it carries on
 * in a rail tile beside the page you opened. So the doorway you came in by is
 * still there in front of you, and on its own terms it still leads to the page
 * you are already reading, which is a dead end.
 *
 * This is what the scene asks instead. The door of the room you are in stops
 * being that room's door and becomes the way out: relabelled, lit in the other
 * accent, and pointing at the hub.
 *
 * It is deliberately a room rather than a route. The scene has no business
 * knowing about URLs — that is why portals.ts exists — so the shell translates
 * the route into this and the corridor reads it.
 */
class RoomState {
	/** The door the visitor is behind, or `null` out in the corridor itself. */
	key = $state<PortalKey | null>(null);
}

export const room = new RoomState();

/** What the door of the room you are in says, instead of the room's name. */
export const EXIT_LABEL = 'BACK TO THE HUB';
export const EXIT_CAPTION = 'the door you came in by';
export const EXIT_HREF = '/';
