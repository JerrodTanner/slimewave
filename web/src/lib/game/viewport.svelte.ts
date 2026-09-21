import { browser } from '$app/environment';

export interface ViewportRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

/** Below this, a measurement is the power cycle mid-collapse, not a layout. */
const MIN_USEFUL_PX = 8;
/** Frames to keep waiting for the cycle to settle before taking what we have. */
const SETTLE_FRAMES = 90;

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
	#settleTries = 0;
	/**
	 * The last rect written, kept off `$state` on purpose.
	 *
	 * `claim()` is called from an effect, so anything `#measure` reads becomes
	 * a dependency of that effect — and `#measure` writes `rect`. Comparing
	 * against `rect` itself made the effect depend on the state it sets, which
	 * re-ran it forever (`effect_update_depth_exceeded`). This is the same
	 * value, untracked.
	 */
	#last: ViewportRect | null = null;

	/** Called during a page's setup, not from an effect. */
	intend() {
		if (browser) this.intent = true;
	}

	/**
	 * Called when the owner unmounts — NOT when it merely swaps slots.
	 *
	 * `claim`'s teardown used to clear the intent, which meant it only survived
	 * until the first navigation. After that `intent` was false forever, the
	 * shell stopped covering for a missing rect, and any gap in the measurement
	 * painted a fullscreen canvas over the page.
	 */
	release() {
		if (browser) this.intent = false;
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
		// The power cycle collapses the boxes with a transform, and a transform
		// changes no border box, so the observer never hears it. These do — and
		// they are what puts the canvas back once the cycle finishes.
		window.addEventListener('animationend', this.#schedule, { passive: true, capture: true });
		window.addEventListener('transitionend', this.#schedule, { passive: true, capture: true });
		// Capture, because the scroll that moves the placeholder may happen on
		// any ancestor rather than on the window.
		window.addEventListener('scroll', this.#schedule, { passive: true, capture: true });

		return () => {
			if (this.#el !== el) return;
			this.#observer?.disconnect();
			this.#observer = null;
			window.removeEventListener('resize', this.#schedule);
			window.removeEventListener('scroll', this.#schedule, { capture: true });
			window.removeEventListener('animationend', this.#schedule, { capture: true });
			window.removeEventListener('transitionend', this.#schedule, { capture: true });
			cancelAnimationFrame(this.#frame);
			this.#el = null;
			this.#last = null;
			this.rect = null;
		};
	}

	#schedule = () => {
		cancelAnimationFrame(this.#frame);
		this.#settleTries = 0;
		this.#frame = requestAnimationFrame(() => this.#measure());
	};

	#measure() {
		const el = this.#el;
		if (!el) return;
		const box = el.getBoundingClientRect();

		// `getBoundingClientRect` reports the TRANSFORMED box; `offsetWidth` and
		// `offsetHeight` report the layout one. The power cycle collapses the
		// slot with a scale, so mid-cycle the two disagree — and because a
		// transform resizes no border box, the observer never fires to tell us
		// it finished. Publishing the collapsed numbers stranded the canvas at a
		// few pixels for the rest of the session.
		//
		// So while they disagree, look again next frame instead. This settles
		// itself in the ~740ms a cycle takes and needs no event to end it; the
		// cap is only there so a permanently transformed slot cannot spin.
		const collapsed =
			Math.abs(box.width - el.offsetWidth) > 1 ||
			Math.abs(box.height - el.offsetHeight) > 1 ||
			box.width < MIN_USEFUL_PX ||
			box.height < MIN_USEFUL_PX;
		if (collapsed && this.#settleTries < SETTLE_FRAMES) {
			this.#settleTries++;
			this.#frame = requestAnimationFrame(() => this.#measure());
			return;
		}
		this.#settleTries = 0;
		// Viewport coordinates, which is exactly what position:fixed wants.
		const next = {
			top: box.top,
			left: box.left,
			width: box.width,
			height: box.height
		};
		const prev = this.#last;
		if (
			prev &&
			Math.abs(prev.top - next.top) < 0.5 &&
			Math.abs(prev.left - next.left) < 0.5 &&
			Math.abs(prev.width - next.width) < 0.5 &&
			Math.abs(prev.height - next.height) < 0.5
		) {
			return;
		}
		this.#last = next;
		this.rect = next;
	}
}

export const gameViewport = new GameViewportState();
