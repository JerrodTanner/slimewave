<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { stage } from '$lib/game/stage.svelte';
	import { createHubScene } from '$lib/game/hubScene';
	import { createSlimeRunScene } from '$lib/game/slimeRunScene';
	import { ui } from '$lib/state/ui.svelte';

	let canvas: HTMLCanvasElement;

	/**
	 * The canvas element below is mounted exactly once, by the root layout,
	 * and every routed page renders around it. Nothing in this component is
	 * allowed to destroy it — that is the whole reason the site is a SPA.
	 */
	onMount(() => {
		stage.register('hub', createHubScene);
		stage.register('slime-run', createSlimeRunScene);
		stage.setNavigator((href) => {
			void stage.transitionTo(href, (target) => goto(target));
		});
		stage.mount(canvas);
		stage.activate('hub');

		return () => stage.dispose();
	});

	// Which scene belongs to which route. Everything that is not an arcade
	// game shows the hub, in the background.
	const arcadeGame = $derived(
		page.url.pathname.startsWith('/arcade/') ? page.url.pathname.split('/')[2] : null
	);
	const immersive = $derived(page.url.pathname === '/' || arcadeGame !== null);

	$effect(() => {
		if (!stage.ready) return;
		if (arcadeGame === 'slime-run') stage.activate('slime-run');
		else stage.activate('hub');
	});

	// Leaving the arcade frees the game's meshes and textures. The hub is
	// never released: it is the one scene that has to survive navigation.
	$effect(() => {
		const current = arcadeGame;
		return () => {
			if (current === 'slime-run' && stage.activeSceneId !== 'slime-run') {
				stage.release('slime-run');
			}
		};
	});

	$effect(() => {
		if (!stage.ready) return;
		if (immersive) stage.setMode('immersive');
		else stage.setMode(ui.backdrop === 'ambient' ? 'ambient' : 'paused');
	});

	function onCanvasPointerDown() {
		// Pointer lock has to come from a real gesture, so it is requested here
		// rather than when the mode changes.
		if (immersive && !stage.pointerLocked) stage.requestPointerLock();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') stage.exitPointerLock();
	}}
/>

<div
	class="pointer-events-none fixed inset-0 transition-[opacity,filter] duration-500"
	class:z-0={!immersive}
	class:z-10={immersive}
	style:opacity={stage.mode === 'paused' ? 0 : immersive ? 1 : 0.35}
	style:filter={immersive ? 'none' : 'saturate(0.7) blur(1px)'}
	aria-hidden={!immersive}
>
	<canvas
		bind:this={canvas}
		onpointerdown={onCanvasPointerDown}
		class="h-full w-full touch-none outline-none"
		class:pointer-events-auto={immersive}
		aria-label="Interactive 3D hub"
	></canvas>

	{#if !immersive}
		<!-- Keeps text legible over whatever the scene is doing behind it. -->
		<div
			class="absolute inset-0"
			style="background: linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 82%, transparent), color-mix(in srgb, var(--color-bg-deep) 94%, transparent))"
		></div>
	{/if}
</div>

<!-- The portal transition. A route change is a route change; this is what
     makes walking through a portal feel like one continuous movement. -->
{#if stage.fade > 0}
	<div
		class="pointer-events-none fixed inset-0 z-50"
		style:opacity={stage.fade}
		style:background-color="var(--color-bg-deep)"
	></div>
{/if}

{#if stage.unsupported}
	<div class="fixed inset-x-0 top-0 z-40 px-4 py-2 text-center" style:background-color="var(--color-surface)">
		<p class="label">
			This browser will not give us a WebGL context, so the 3D hub is off. Everything else works.
		</p>
	</div>
{/if}
