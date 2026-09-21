import { browser } from '$app/environment';

const BACKDROP_KEY = 'slimewave:backdrop';

/**
 * How the visitor wants the game to behave while they are reading a page.
 *
 * "ambient" keeps the hub running behind the content at a reduced frame rate;
 * "still" pauses the render loop without unmounting anything, so switching
 * back resumes the same scene rather than rebuilding it.
 */
export type Backdrop = 'ambient' | 'still';

class UiState {
	backdrop = $state<Backdrop>('ambient');
	/** Open state of the theme switcher panel. */
	themePanelOpen = $state(false);
	/** Open state of the mobile nav. */
	navOpen = $state(false);

	init() {
		if (!browser) return;
		// Anyone who asked their OS for less motion gets the still backdrop by
		// default; they can still turn it on deliberately.
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let stored: string | null = null;
		try {
			stored = localStorage.getItem(BACKDROP_KEY);
		} catch {
			/* storage blocked */
		}
		if (stored === 'ambient' || stored === 'still') this.backdrop = stored;
		else if (reduced) this.backdrop = 'still';
	}

	setBackdrop(value: Backdrop) {
		this.backdrop = value;
		try {
			localStorage.setItem(BACKDROP_KEY, value);
		} catch {
			/* storage blocked */
		}
	}

	toggleBackdrop() {
		this.setBackdrop(this.backdrop === 'ambient' ? 'still' : 'ambient');
	}
}

export const ui = new UiState();
