import { browser } from '$app/environment';
import { ApiError, endpoints, type SessionUser } from '$lib/api/client';
import { theme } from '$lib/theme/theme.svelte';
import { isThemeId, type ThemeId } from '$lib/theme/themes';

/**
 * Who is looking at the site.
 *
 * Auth is optional here. Anonymous visitors get everything published; signing
 * in is for me (managing documents) and, for anyone who makes an account, for
 * carrying preferences between devices.
 */
class SessionState {
	user = $state<SessionUser | null>(null);
	registrationOpen = $state(false);
	loading = $state(true);
	error = $state<string | null>(null);

	get signedIn() {
		return this.user !== null;
	}

	get isOwner() {
		return this.user?.isOwner === true;
	}

	async load() {
		if (!browser) return;
		try {
			const { user, registrationOpen } = await endpoints.me();
			this.user = user;
			this.registrationOpen = registrationOpen;
			if (user) await this.#adoptServerPreferences();
		} catch (err) {
			// A failed /me is not worth showing anyone: the site works signed out.
			console.warn('session: could not load', err);
		} finally {
			this.loading = false;
		}
	}

	async login(email: string, password: string) {
		this.error = null;
		try {
			const { user } = await endpoints.login(email, password);
			this.user = user;
			await this.#adoptServerPreferences();
			return true;
		} catch (err) {
			this.error = err instanceof ApiError ? err.message : 'could not sign in';
			return false;
		}
	}

	async logout() {
		try {
			await endpoints.logout();
		} finally {
			this.user = null;
			theme.setSyncTarget(null);
		}
	}

	/**
	 * On sign-in the server's stored theme wins if it has one; otherwise the
	 * theme picked while signed out is pushed up, so a first login carries the
	 * visitor's choice with it instead of resetting it.
	 */
	async #adoptServerPreferences() {
		let serverTheme: string | null = null;
		try {
			const { preferences } = await endpoints.preferences();
			serverTheme = preferences.theme;
		} catch (err) {
			console.warn('session: could not load preferences', err);
		}

		if (isThemeId(serverTheme)) {
			theme.applyFromServer(serverTheme);
		} else {
			void this.#pushTheme(theme.current);
		}
		theme.setSyncTarget((id) => void this.#pushTheme(id));
	}

	async #pushTheme(id: ThemeId) {
		if (!this.user) return;
		try {
			await endpoints.savePreferences(id, {});
		} catch (err) {
			// Theme sync is a convenience; a failure must not interrupt browsing.
			console.warn('session: could not save theme', err);
		}
	}
}

export const session = new SessionState();
