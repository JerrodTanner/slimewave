import { browser } from '$app/environment';

export interface ViewportRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

/**
 * Where on screen the canvas should draw.
 *
 * The canvas is mounted once by the root layout and must never unmount — that
 * is the constraint the whole project is built around. But the hub page wants
 * it inside a window rather than filling the viewport, so the page *claims* a
 * rect and the stage moves the (still fixed-position, still mounted) canvas
 * onto it. Nothing is remounted; only CSS changes, so the WebGL context is
 * never at risk.
 *
 * `null` means nobody has claimed it and the canvas fills the viewport, which
 * is what every route other than the hub wants.
 */
class GameViewportState {
	rect = $state<ViewportRect | null>(null);
	/**
	 * Set synchronously by a page that is about to claim, before the DOM it
	 * will measure exists. Without it the canvas paints one fullscreen frame
	 * over the whole layout between mount and the first measurement.
	 */
	intent = $state(false);

	#el: HTMLElement | null = null;
	#observer: ResizeObserver | null = null;
	#frame = 0;

	/** Called during a page's setup, not from an effect. */
	intend() {
		if (browser) this.intent = true;
	}

	/**
	 * Points the canvas at `el` until the returned function is called. The
	 * element itself stays empty and transparent: it is a placeholder that
	 * says where the canvas goes, not a container for it.
	 */
	claim(el: HTMLElement): () => void {
		if (!browser) return () => {};

		this.#el = el;
		this.#measure();

		this.#observer = new ResizeObserver(() => this.#schedule());
		this.#observer.observe(el);
		window.addEventListener('resize', this.#schedule, { passive: true });
		// Capture, because the scroll that moves the placeholder may happen on
		// any ancestor rather than on the window.
		window.addEventListener('scroll', this.#schedule, { passive: true, capture: true });

		return () => {
			if (this.#el !== el) return;
			this.#observer?.disconnect();
			this.#observer = null;
			window.removeEventListener('resize', this.#schedule);
			window.removeEventListener('scroll', this.#schedule, { capture: true });
			cancelAnimationFrame(this.#frame);
			this.#el = null;
			this.rect = null;
			this.intent = false;
		};
	}

	#schedule = () => {
		cancelAnimationFrame(this.#frame);
		this.#frame = requestAnimationFrame(() => this.#measure());
	};

	#measure() {
		const el = this.#el;
		if (!el) return;
		const box = el.getBoundingClientRect();
		// Viewport coordinates, which is exactly what position:fixed wants.
		const next = {
			top: box.top,
			left: box.left,
			width: box.width,
			height: box.height
		};
		const prev = this.rect;
		if (
			prev &&
			Math.abs(prev.top - next.top) < 0.5 &&
			Math.abs(prev.left - next.left) < 0.5 &&
			Math.abs(prev.width - next.width) < 0.5 &&
			Math.abs(prev.height - next.height) < 0.5
		) {
			return;
		}
		this.rect = next;
	}
}

export const gameViewport = new GameViewportState();
