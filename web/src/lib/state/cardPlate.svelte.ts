import { browser } from '$app/environment';

const PLATE_KEY = 'slimewave:card-plate';
const OPACITY_KEY = 'slimewave:card-opacity';

/** The plate that ships with the site. */
const SHIPPED = "url('/header-tissue.png')";
/** Percent of the plate that shows through the wash. */
const DEFAULT_OPACITY = 16;
/** Longest edge of a plate once it has been taken in, in px. */
const MAX_EDGE = 1200;

/**
 * The picture behind the main card, and how much of it shows.
 *
 * Both are CSS custom properties rather than values baked into a rule, so the
 * advanced panel can retune them on a live page. A plate chosen here never
 * leaves the browser: it is read off disk, shrunk, and kept in local storage,
 * which makes this a way to try a picture out rather than a way to publish
 * one. Settling on one means putting the file in static/ and pointing the
 * default at it.
 */
class CardPlate {
	opacity = $state(DEFAULT_OPACITY);
	/** A data URL the tester picked, or null for the shipped plate. */
	custom = $state<string | null>(null);
	/** Set when a pick could not be kept, so the panel can say why. */
	notice = $state<string | null>(null);

	init() {
		if (!browser) return;
		try {
			const storedOpacity = localStorage.getItem(OPACITY_KEY);
			if (storedOpacity !== null) {
				const n = Number(storedOpacity);
				if (Number.isFinite(n)) this.opacity = clamp(n);
			}
			const storedPlate = localStorage.getItem(PLATE_KEY);
			if (storedPlate) this.custom = storedPlate;
		} catch {
			/* storage blocked; the shipped plate stands */
		}
		this.#apply();
	}

	setOpacity(value: number) {
		this.opacity = clamp(value);
		this.#apply();
		try {
			localStorage.setItem(OPACITY_KEY, String(this.opacity));
		} catch {
			/* storage blocked; the choice still holds for this visit */
		}
	}

	async setFile(file: File) {
		this.notice = null;
		let url: string;
		try {
			url = await shrink(file);
		} catch {
			this.notice = 'That file could not be read as an image.';
			return;
		}
		this.custom = url;
		this.#apply();
		try {
			localStorage.setItem(PLATE_KEY, url);
		} catch {
			// Local storage is a few megabytes; a big picture can still miss.
			// The plate is already on screen, so this costs only the reload.
			this.notice = 'Shown, but too big to remember past a reload.';
		}
	}

	#apply() {
		if (!browser) return;
		const root = document.documentElement.style;
		root.setProperty('--card-plate', this.custom ? `url("${this.custom}")` : SHIPPED);
		root.setProperty('--card-wash', `${100 - this.opacity}%`);
	}
}

function clamp(value: number): number {
	return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Reads a picked file and hands back a data URL small enough to keep.
 *
 * The shrink is not politeness: a phone photograph as a data URL is several
 * megabytes of base64, which overruns local storage and re-parses on every
 * navigation. WebP where the browser will encode it, JPEG where it will not —
 * a refusing canvas returns a PNG URL, which is what the prefix check catches.
 */
async function shrink(file: File): Promise<string> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no 2d context');
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const webp = canvas.toDataURL('image/webp', 0.82);
	return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
}

export const cardPlate = new CardPlate();
