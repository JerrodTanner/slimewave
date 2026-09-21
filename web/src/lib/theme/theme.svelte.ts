import { browser } from '$app/environment';
import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes';

/**
 * Versioned on purpose.
 *
 * A stored preference outranks DEFAULT_THEME, so without a bump every returning
 * visitor keeps whatever they were last served and never sees a new house
 * style. Changing the key is a one-time reset: old values are ignored, the new
 * default lands, and the next deliberate choice is stored under the new key.
 * Bump it when the default changes, not when a theme is merely edited.
 */
const STORAGE_KEY = 'slimewave:theme:v2';
const LEGACY_STORAGE_KEYS = ['slimewave:theme'];

/** Colours the 3D scene reads from the active theme. */
export interface ScenePalette {
	sky: string;
	fog: string;
	ground: string;
	grid: string;
	portal: string;
	portalAlt: string;
	light: string;
}

type Listener = (palette: ScenePalette) => void;

class ThemeState {
	current = $state<ThemeId>(DEFAULT_THEME);
	/** Set once the server's stored preference has been applied, if any. */
	syncedWithServer = $state(false);

	#listeners = new Set<Listener>();
	#push: ((theme: ThemeId) => void) | null = null;

	/** Reads whatever the inline script in app.html already applied. */
	init() {
		if (!browser) return;
		const fromDom = document.documentElement.dataset.theme;
		if (isThemeId(fromDom)) {
			this.current = fromDom;
			return;
		}
		try {
			for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
			const stored = localStorage.getItem(STORAGE_KEY);
			if (isThemeId(stored)) this.set(stored);
		} catch {
			/* storage blocked; the default stands */
		}
	}

	/**
	 * Registers the function that persists a theme to the backend. The session
	 * layer installs this on login and removes it on logout, which keeps this
	 * module from having to know anything about auth.
	 */
	setSyncTarget(push: ((theme: ThemeId) => void) | null) {
		this.#push = push;
	}

	set(id: ThemeId, opts: { persist?: boolean } = {}) {
		const { persist = true } = opts;
		this.current = id;
		if (!browser) return;

		document.documentElement.dataset.theme = id;
		if (persist) {
			try {
				localStorage.setItem(STORAGE_KEY, id);
			} catch {
				/* storage blocked; the theme still applies for this visit */
			}
			this.#push?.(id);
		}
		// The CSS variables change on the same frame the attribute does, but
		// reading them immediately can catch the old values in some browsers.
		requestAnimationFrame(() => this.#notify());
	}

	/** Applies a theme that came from the server without echoing it back. */
	applyFromServer(id: string) {
		this.syncedWithServer = true;
		if (!isThemeId(id) || id === this.current) return;
		this.set(id, { persist: false });
		try {
			localStorage.setItem(STORAGE_KEY, id);
		} catch {
			/* ignored */
		}
	}

	/** Subscribes to theme changes. Returns an unsubscribe function. */
	onChange(fn: Listener): () => void {
		this.#listeners.add(fn);
		return () => this.#listeners.delete(fn);
	}

	/**
	 * Resolves the scene palette from the live CSS. Going through the
	 * stylesheet rather than duplicating the colours in TypeScript means a
	 * theme is defined in exactly one place.
	 */
	palette(): ScenePalette {
		const fallback: ScenePalette = {
			sky: '#04090b',
			fog: '#071418',
			ground: '#0b1a1e',
			grid: '#16414a',
			portal: '#9dff3c',
			portalAlt: '#ff4fd8',
			light: '#b8ffd9'
		};
		if (!browser) return fallback;

		const css = getComputedStyle(document.documentElement);
		const read = (name: string, dflt: string) => css.getPropertyValue(name).trim() || dflt;
		return {
			sky: read('--scene-sky', fallback.sky),
			fog: read('--scene-fog', fallback.fog),
			ground: read('--scene-ground', fallback.ground),
			grid: read('--scene-grid', fallback.grid),
			portal: read('--scene-portal', fallback.portal),
			portalAlt: read('--scene-portal-alt', fallback.portalAlt),
			light: read('--scene-light', fallback.light)
		};
	}

	#notify() {
		const palette = this.palette();
		for (const fn of this.#listeners) fn(palette);
	}
}

export const theme = new ThemeState();
