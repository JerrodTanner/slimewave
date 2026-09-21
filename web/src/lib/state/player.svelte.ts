import { browser } from '$app/environment';
import type { Track } from '$lib/api/client';

const VOLUME_KEY = 'slimewave:volume';

/**
 * The audio player.
 *
 * Like the canvas, the <audio> element lives in the root layout and is never
 * unmounted, so a track keeps playing while you browse. This class owns the
 * element and the queue; the UI is just a view of it.
 */
class PlayerState {
	queue = $state<Track[]>([]);
	index = $state(-1);
	playing = $state(false);
	position = $state(0);
	duration = $state(0);
	volume = $state(0.8);
	/** Set when the browser refuses to start playback (usually autoplay policy). */
	blocked = $state(false);

	#el: HTMLAudioElement | null = null;

	get current(): Track | null {
		return this.queue[this.index] ?? null;
	}

	get hasNext() {
		return this.index >= 0 && this.index < this.queue.length - 1;
	}

	get hasPrev() {
		return this.index > 0;
	}

	/** Called once by the shell, with the element it owns. */
	attach(el: HTMLAudioElement) {
		this.#el = el;

		try {
			const stored = Number(localStorage.getItem(VOLUME_KEY));
			if (Number.isFinite(stored) && stored >= 0 && stored <= 1) this.volume = stored;
		} catch {
			/* storage blocked */
		}
		el.volume = this.volume;

		el.addEventListener('timeupdate', () => (this.position = el.currentTime));
		el.addEventListener('durationchange', () => (this.duration = el.duration || 0));
		el.addEventListener('play', () => {
			this.playing = true;
			this.blocked = false;
		});
		el.addEventListener('pause', () => (this.playing = false));
		el.addEventListener('ended', () => this.next());
		el.addEventListener('error', () => {
			this.playing = false;
		});
	}

	/** Replaces the queue and starts at `startAt`. */
	play(tracks: Track[], startAt = 0) {
		if (tracks.length === 0) return;
		this.queue = tracks;
		this.#load(Math.max(0, Math.min(startAt, tracks.length - 1)));
	}

	toggle() {
		const el = this.#el;
		if (!el || !this.current) return;
		if (el.paused) void this.#start();
		else el.pause();
	}

	next() {
		if (this.hasNext) this.#load(this.index + 1);
		else this.playing = false;
	}

	prev() {
		// Standard player behaviour: restart the track unless you're near the top.
		if (this.#el && this.#el.currentTime > 3) {
			this.#el.currentTime = 0;
			return;
		}
		if (this.hasPrev) this.#load(this.index - 1);
	}

	seek(seconds: number) {
		if (this.#el && Number.isFinite(seconds)) this.#el.currentTime = seconds;
	}

	setVolume(value: number) {
		this.volume = Math.max(0, Math.min(1, value));
		if (this.#el) this.#el.volume = this.volume;
		try {
			localStorage.setItem(VOLUME_KEY, String(this.volume));
		} catch {
			/* storage blocked */
		}
	}

	clear() {
		this.#el?.pause();
		this.queue = [];
		this.index = -1;
		this.playing = false;
		this.position = 0;
		this.duration = 0;
	}

	/** True when `track` is the one currently loaded. */
	isCurrent(track: Track) {
		return this.current?.streamUrl === track.streamUrl;
	}

	#load(index: number) {
		const el = this.#el;
		const track = this.queue[index];
		if (!el || !track) return;
		this.index = index;
		this.position = 0;
		this.duration = 0;
		el.src = track.streamUrl;
		void this.#start();
	}

	async #start() {
		const el = this.#el;
		if (!el) return;
		try {
			await el.play();
		} catch {
			// Autoplay policies reject playback that no gesture asked for.
			this.blocked = true;
			this.playing = false;
		}
	}
}

export const player = new PlayerState();

export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const total = Math.floor(seconds);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

/** Media Session metadata, so the OS media keys show the right track. */
export function publishMediaSession(track: Track | null, coverUrl?: string) {
	if (!browser || !('mediaSession' in navigator)) return;
	if (!track) {
		navigator.mediaSession.metadata = null;
		return;
	}
	navigator.mediaSession.metadata = new MediaMetadata({
		title: track.title,
		artist: track.artist,
		album: track.album,
		artwork: coverUrl ? [{ src: coverUrl, sizes: '512x512', type: 'image/jpeg' }] : []
	});
}
