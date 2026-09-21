import { tick } from 'svelte';
import { browser } from '$app/environment';
import { portalForPath, type PortalKey } from './portals';

/**
 * The set switching off and back on.
 *
 * Choosing a section does not slide anything: the two boxes whose contents
 * are about to trade places collapse to a line, then to a dot, the route
 * changes while the screen is dark, and they come back on holding each
 * other's contents. The corridor lands in the tile you picked; that tile's
 * page lands in the corridor's window.
 *
 * This module only owns the timing and *which* boxes take part. The picture
 * itself is CSS — `.crt-off` / `.crt-on` in app.css — because the canvas layer
 * is not a child of the frame and has to die on the same frame as the boxes
 * that are.
 *
 * The two durations below mirror the `crt-off` / `crt-on` animations there.
 */
export const CRT_OFF_MS = 280;
export const CRT_ON_MS = 460;

export type CrtPhase = 'idle' | 'off' | 'on';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class CrtState {
	phase = $state<CrtPhase>('idle');
	/** The tile the corridor is leaving, or `null` when it is leaving the window. */
	from = $state<PortalKey | null>(null);
	/** The tile it is landing in, or `null` when it is going back to the window. */
	to = $state<PortalKey | null>(null);

	/** A second click while the tube is dark would strand the layout. */
	get busy() {
		return this.phase !== 'idle';
	}

	/**
	 * Only the two tiles that change role flicker; the rest stay lit. The big
	 * window needs no such test — it changes hands on every cycle, so it takes
	 * part whenever `phase` is not idle.
	 */
	touches(key: PortalKey) {
		return this.phase !== 'idle' && (key === this.from || key === this.to);
	}

	/**
	 * Off, navigate, on. `navigate` runs while the screen is dark, so the slot
	 * swap and the canvas re-measure are never seen.
	 */
	async cycle(
		href: string,
		navigate: (href: string) => void | Promise<void>,
		fromPath: string
	): Promise<void> {
		if (this.phase !== 'idle') return;

		const reduced = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		this.from = portalForPath(fromPath);
		this.to = portalForPath(href);

		try {
			this.phase = 'off';
			if (!reduced) await wait(CRT_OFF_MS);
			await navigate(href);
			// Let the new route mount and the canvas claim its new slot before
			// anything is lit again.
			await tick();
			this.phase = 'on';
			if (!reduced) await wait(CRT_ON_MS);
		} finally {
			this.phase = 'idle';
			this.from = null;
			this.to = null;
		}
	}
}

export const crt = new CrtState();
