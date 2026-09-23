import { browser } from '$app/environment';

const BACKDROP_KEY = 'slimewave:backdrop';
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
 * that — the backdrop switch and anything else that belongs to the scene
 * rather than to the content.
 */
export type Mode = 'simple' | 'advanced';

class UiState {
	backdrop = $state<Backdrop>('ambient');
	mode = $state<Mode>('simple');
	/** Open state of the settings menu behind the header's cog. */
	settingsOpen = $state(false);

	init() {
		if (!browser) return;
		// Anyone who asked their OS for less motion gets the still backdrop by
		// default; they can still turn it on deliberately.
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let storedBackdrop: string | null = null;
		let storedMode: string | null = null;
		try {
			storedBackdrop = localStorage.getItem(BACKDROP_KEY);
			storedMode = localStorage.getItem(MODE_KEY);
		} catch {
			/* storage blocked */
		}
		if (storedBackdrop === 'ambient' || storedBackdrop === 'still') this.backdrop = storedBackdrop;
		else if (reduced) this.backdrop = 'still';

		if (storedMode === 'simple' || storedMode === 'advanced') this.mode = storedMode;
	}

	setBackdrop(value: Backdrop) {
		this.backdrop = value;
		this.#store(BACKDROP_KEY, value);
	}

	toggleBackdrop() {
		this.setBackdrop(this.backdrop === 'ambient' ? 'still' : 'ambient');
	}

	setMode(value: Mode) {
		this.mode = value;
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
