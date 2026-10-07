import { browser } from '$app/environment';
import { DEFAULT_THEME, STYLE_DEFAULT_THEME, isThemeId, themeById, type Style, type ThemeId } from './themes';

/**
 * Versioned on purpose.
 *
 * A stored preference outranks DEFAULT_THEME, so without a bump every returning
 * visitor keeps whatever they were last served and never sees a new house
 * style. Changing the key is a one-time reset: old values are ignored, the new
 * default lands, and the next deliberate choice is stored under the new key.
 * Bump it when the default changes, not when a theme is merely edited.
 *
 * Not bumped for Bold, on purpose. A theme is only stored when someone picks
 * one, so visitors who never chose already get the new default; a bump would
 * only override the people who deliberately chose something else.
 *
 * Bold is now the only style offered, so a stored theme is only honoured when
 * it is a Bold one (see `honoured`); an old Clean or Homey choice is dropped
 * and the visitor lands on Bold. app.html applies the same rule before paint.
 */
const STORAGE_KEY = 'slimewave:theme:v2';
const LEGACY_STORAGE_KEYS = ['slimewave:theme'];
/** The theme last worn in each style, so switching style and back returns to it. */
const LAST_KEY = (style: Style) => `slimewave:theme-last:${style}`;

/** A stored theme that still applies: a real id, and a Bold one. */
function honoured(id: string | null | undefined): id is ThemeId {
	return isThemeId(id) && themeById(id).style === 'bold';
}

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

	/** The furniture the current theme belongs to. */
	get style(): Style {
		return themeById(this.current).style;
	}

	/** Reads whatever the inline script in app.html already applied. */
	init() {
		if (!browser) return;
		const fromDom = document.documentElement.dataset.theme;
		if (honoured(fromDom)) {
			this.current = fromDom;
			document.documentElement.dataset.style = this.style;
			return;
		}
		try {
			for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
			const stored = localStorage.getItem(STORAGE_KEY);
			if (honoured(stored)) this.set(stored);
			else if (stored) localStorage.removeItem(STORAGE_KEY);
		} catch {
			/* storage blocked; the default stands */
		}
		// A retired theme id from app.html would leave the page unstyled.
		document.documentElement.dataset.theme = this.current;
		document.documentElement.dataset.style = this.style;
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
		document.documentElement.dataset.style = this.style;
		if (persist) {
			try {
				localStorage.setItem(STORAGE_KEY, id);
				localStorage.setItem(LAST_KEY(this.style), id);
			} catch {
				/* storage blocked; the theme still applies for this visit */
			}
			this.#push?.(id);
		}
		// The CSS variables change on the same frame the attribute does, but
		// reading them immediately can catch the old values in some browsers.
		requestAnimationFrame(() => this.#notify());
	}

	/**
	 * Switches the furniture. The style has no storage of its own; it lands on
	 * the theme last worn in it, or on its default the first time.
	 */
	setStyle(style: Style) {
		if (style === this.style) return;
		let next = STYLE_DEFAULT_THEME[style];
		try {
			const last = localStorage.getItem(LAST_KEY(style));
			if (isThemeId(last) && themeById(last).style === style) next = last;
		} catch {
			/* storage blocked; the style's default stands */
		}
		this.set(next);
	}

	/** Applies a theme that came from the server without echoing it back. */
	applyFromServer(id: string) {
		this.syncedWithServer = true;
		if (!honoured(id) || id === this.current) return;
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
