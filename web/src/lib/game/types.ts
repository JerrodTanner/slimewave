import type { Scene } from '@babylonjs/core/scene';
import type { ScenePalette } from '$lib/theme/theme.svelte';

/**
 * Every scene the stage can show implements this. Scenes do not own the
 * engine, the canvas, or the render loop — the stage does — which is what
 * allows several of them to share one WebGL context.
 */
export interface SceneHandle {
	readonly id: string;
	readonly scene: Scene;
	/** Recolour to match the active site theme. */
	setPalette(palette: ScenePalette): void;
	/** Attach or detach player input. Ambient scenes run with input off. */
	setInteractive(interactive: boolean): void;
	/** Per-frame update, in milliseconds since the previous frame. */
	update?(deltaMs: number): void;
	dispose(): void;
}

export type SceneFactory = (ctx: SceneContext) => SceneHandle;

export interface SceneContext {
	scene: Scene;
	canvas: HTMLCanvasElement;
	palette: ScenePalette;
	/** Walking into a portal calls this; the shell fades, then navigates. */
	navigate(href: string): void;
}
