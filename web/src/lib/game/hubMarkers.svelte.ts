import type { PortalSpec } from './portals';

export interface PortalMarker extends PortalSpec {
	/** Position on the canvas, 0–1 from the top-left. */
	x: number;
	y: number;
	/** False when the portal is behind the camera or off screen. */
	visible: boolean;
	/** Metres from the camera; drives label size and fade. */
	distance: number;
}

/**
 * Portal labels are HTML over the canvas, not textures inside the scene.
 *
 * That costs a projection per portal per frame and buys a lot: the labels are
 * real text in the site's own fonts, they restyle with the theme for free, they
 * stay crisp at any resolution, and they are anchors — so the portals are
 * keyboard-navigable and legible to a screen reader, which geometry never is.
 *
 * The hub scene writes here on every frame; the hub page reads.
 */
class HubMarkerState {
	markers = $state<PortalMarker[]>([]);

	set(next: PortalMarker[]) {
		this.markers = next;
	}

	clear() {
		this.markers = [];
	}
}

export const hubMarkers = new HubMarkerState();
