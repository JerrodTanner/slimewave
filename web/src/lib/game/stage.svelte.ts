import { browser } from '$app/environment';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { theme, type ScenePalette } from '$lib/theme/theme.svelte';
import type { SceneFactory, SceneHandle } from './types';

/**
 * The stage: one WebGL context for the whole site, created once when the root
 * layout mounts and never torn down.
 *
 * This is the piece the whole architecture exists for. A full page load would
 * destroy the context and reset the scene, which is why the site is a SPA and
 * why the canvas lives in the root layout rather than in any route.
 *
 * Modes:
 *   immersive — full viewport, input attached, full frame rate. The hub.
 *   ambient   — the same scene running behind page content, no input, frames
 *               throttled so the page keeps the render budget it needs.
 *   paused    — render loop stopped, scene retained. Nothing is unmounted, so
 *               going back to immersive resumes exactly where you left off.
 */
export type StageMode = 'immersive' | 'ambient' | 'paused';

/** Ambient mode renders at this cadence rather than every vsync. */
const AMBIENT_FPS = 24;

class StageState {
	mode = $state<StageMode>('paused');
	/** The scene currently on screen. */
	activeSceneId = $state<string | null>(null);
	/** 0 → clear, 1 → fully faded out. Drives the portal transition overlay. */
	fade = $state(0);
	ready = $state(false);
	/** Set when WebGL is unavailable, so the UI can offer a flat fallback. */
	unsupported = $state(false);
	/** True while the pointer is locked in immersive mode. */
	pointerLocked = $state(false);

	#engine: Engine | null = null;
	#canvas: HTMLCanvasElement | null = null;
	#factories = new Map<string, SceneFactory>();
	#scenes = new Map<string, SceneHandle>();
	#active: SceneHandle | null = null;
	#navigate: (href: string) => void = () => {};
	#unsubscribeTheme: (() => void) | null = null;
	#lastFrame = 0;
	#ambientAccumulator = 0;
	#resizeObserver: ResizeObserver | null = null;

	get engine() {
		return this.#engine;
	}

	get scene() {
		return this.#active?.scene ?? null;
	}

	/** Registers a scene factory. Scenes are built lazily on first activation. */
	register(id: string, factory: SceneFactory) {
		this.#factories.set(id, factory);
	}

	/** Called by the shell with the navigation function it wants portals to use. */
	setNavigator(fn: (href: string) => void) {
		this.#navigate = fn;
	}

	/**
	 * Creates the engine. Safe to call more than once: only the first call
	 * does anything, which matters because Svelte can re-run effects.
	 */
	mount(canvas: HTMLCanvasElement) {
		if (!browser || this.#engine) return;

		try {
			this.#engine = new Engine(canvas, true, {
				preserveDrawingBuffer: false,
				stencil: true,
				// Without this the context is lost on some mobile GPUs when the
				// tab is backgrounded — exactly the case this stage must survive.
				powerPreference: 'high-performance',
				failIfMajorPerformanceCaveat: false
			});
		} catch (err) {
			console.warn('stage: WebGL unavailable', err);
			this.unsupported = true;
			return;
		}

		this.#canvas = canvas;
		(window as any).__stage = this;
		this.ready = true;

		this.#unsubscribeTheme = theme.onChange((palette) => this.#applyPalette(palette));

		// ResizeObserver rather than window.resize: the canvas is styled by CSS
		// and can change size when the layout does, not only when the window does.
		this.#resizeObserver = new ResizeObserver(() => this.#engine?.resize());
		this.#resizeObserver.observe(canvas);

		document.addEventListener('pointerlockchange', this.#onPointerLockChange);

		this.#lastFrame = performance.now();
		this.#engine.runRenderLoop(this.#renderFrame);
	}

	/**
	 * Tears the stage down. Only called when the whole app goes away, which in
	 * an SPA means a real page unload — never on navigation.
	 */
	dispose() {
		document.removeEventListener('pointerlockchange', this.#onPointerLockChange);
		this.#resizeObserver?.disconnect();
		this.#unsubscribeTheme?.();
		for (const handle of this.#scenes.values()) handle.dispose();
		this.#scenes.clear();
		this.#active = null;
		this.#engine?.dispose();
		this.#engine = null;
		this.ready = false;
	}

	/** Builds the scene if needed and puts it on screen. */
	activate(id: string) {
		if (!this.#engine || this.activeSceneId === id) return;

		const existing = this.#scenes.get(id);
		if (existing) {
			this.#setActive(existing);
			return;
		}

		const factory = this.#factories.get(id);
		if (!factory) {
			console.warn(`stage: no scene registered as "${id}"`);
			return;
		}

		const scene = new Scene(this.#engine);
		const handle = factory({
			scene,
			canvas: this.#canvas!,
			palette: theme.palette(),
			navigate: (href) => this.#navigate(href)
		});
		this.#scenes.set(id, handle);
		this.#setActive(handle);
	}

	/**
	 * Drops a scene and its GPU resources. The hub is never released this way;
	 * one-off games are, when you leave them.
	 */
	release(id: string) {
		const handle = this.#scenes.get(id);
		if (!handle) return;
		if (this.#active === handle) {
			this.#active = null;
			this.activeSceneId = null;
		}
		handle.dispose();
		this.#scenes.delete(id);
	}

	setMode(mode: StageMode) {
		if (this.mode === mode) return;
		this.mode = mode;

		if (mode === 'immersive') {
			this.#active?.setInteractive(true);
		} else {
			this.#active?.setInteractive(false);
			this.exitPointerLock();
		}
	}

	requestPointerLock() {
		if (this.mode !== 'immersive') return;
		void this.#canvas?.requestPointerLock?.();
	}

	exitPointerLock() {
		if (browser && document.pointerLockElement) document.exitPointerLock();
	}

	/**
	 * The portal transition: fade the whole viewport out, navigate at the far
	 * end, then fade back in.
	 *
	 * The smoothness here is animation, not state preservation — the route
	 * genuinely changes. Only the canvas behind it survives, which is the
	 * point.
	 */
	async transitionTo(href: string, navigate: (href: string) => void | Promise<void>) {
		const reduced =
			browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			await navigate(href);
			return;
		}

		this.exitPointerLock();
		await this.#animateFade(0, 1, 260);
		await navigate(href);
		await this.#animateFade(1, 0, 320);
	}

	#setActive(handle: SceneHandle) {
		this.#active = handle;
		this.activeSceneId = handle.id;
		handle.setPalette(theme.palette());
		handle.setInteractive(this.mode === 'immersive');
	}

	#applyPalette(palette: ScenePalette) {
		for (const handle of this.#scenes.values()) handle.setPalette(palette);
	}

	#renderFrame = () => {
		const active = this.#active;
		if (!active || this.mode === 'paused') return;

		const now = performance.now();
		const delta = now - this.#lastFrame;
		this.#lastFrame = now;

		if (this.mode === 'ambient') {
			// Throttle rather than stop: the scene stays alive and visible, but
			// hands most of the frame budget back to the page.
			this.#ambientAccumulator += delta;
			const interval = 1000 / AMBIENT_FPS;
			if (this.#ambientAccumulator < interval) return;
			this.#ambientAccumulator = 0;
		}

		active.update?.(delta);
		active.scene.render();
	};

	#onPointerLockChange = () => {
		this.pointerLocked = browser && document.pointerLockElement === this.#canvas;
	};

	#animateFade(from: number, to: number, durationMs: number): Promise<void> {
		return new Promise((resolve) => {
			const start = performance.now();
			const step = () => {
				const t = Math.min(1, (performance.now() - start) / durationMs);
				// easeInOutQuad: no overshoot, reads as deliberate rather than snappy.
				const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
				this.fade = from + (to - from) * eased;
				if (t < 1) requestAnimationFrame(step);
				else resolve();
			};
			requestAnimationFrame(step);
		});
	}
}

export const stage = new StageState();
