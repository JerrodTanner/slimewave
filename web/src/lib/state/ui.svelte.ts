import { browser } from '$app/environment';
import { theme } from '$lib/theme/theme.svelte';

const MODE_KEY = 'slimewave:mode';

/**
 * How the visitor wants the game to behave while they are reading a page.
 *
 * "ambient" keeps the hub running behind the content at a reduced frame rate;
 * "still" pauses the render loop without unmounting anything, so switching
 * back resumes the same scene rather than rebuilding it.
 */
export type Backdrop = 'ambient' | 'still';

/**
 * How much of the machinery the header admits to.
 *
 * "simple" is the site a reader came for: the name, what the place is for, and
 * the doors. "advanced" puts back the controls that would otherwise clutter
 * that — anything that belongs to the scene
 * rather than to the content.
 */
export type Mode = 'simple' | 'advanced';

class UiState {
	backdrop = $state<Backdrop>('ambient');
	/** What the visitor picked, kept even while Bold overrides it. */
	#chosen = $state<Mode>('simple');

	/**
	 * The mode in force. Bold has no 3D, so it is always simple there, but
	 * the stored choice is left alone: going back to Clean or Homey returns
	 * whatever the visitor had.
	 */
	get mode(): Mode {
		return theme.style === 'bold' ? 'simple' : this.#chosen;
	}
	/** Open state of the settings menu behind the header's cog. */
	settingsOpen = $state(false);

	init() {
		if (!browser) return;
		// No switch for it any more: anyone who asked their OS for less motion
		// gets the still backdrop, everyone else the running one.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.backdrop = 'still';
		let storedMode: string | null = null;
		try {
			// Retired with the switch; don't let an old choice linger.
			localStorage.removeItem('slimewave:backdrop');
			storedMode = localStorage.getItem(MODE_KEY);
		} catch {
			/* storage blocked */
		}

		if (storedMode === 'simple' || storedMode === 'advanced') this.#chosen = storedMode;
	}

	setMode(value: Mode) {
		this.#chosen = value;
		this.#store(MODE_KEY, value);
	}

	#store(key: string, value: string) {
		try {
			localStorage.setItem(key, value);
		} catch {
			/* storage blocked; the choice still holds for this visit */
		}
	}
}

export const ui = new UiState();
