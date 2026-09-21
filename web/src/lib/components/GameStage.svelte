<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { stage } from '$lib/game/stage.svelte';
	import { crt } from '$lib/game/crt.svelte';
	import { hubGate } from '$lib/game/gate.svelte';
	import { gameViewport } from '$lib/game/viewport.svelte';
	import { isFramed, portalForPath } from '$lib/game/portals';
	import { room } from '$lib/game/room.svelte';
	import { createHubScene } from '$lib/game/hubScene';
	import { createSlimeRunScene } from '$lib/game/slimeRunScene';
	import { ui } from '$lib/state/ui.svelte';
	import PortalLabels from './PortalLabels.svelte';
	import HudOverlay from './HudOverlay.svelte';
	import ViewModel from './ViewModel.svelte';

	let canvas: HTMLCanvasElement;

	/**
	 * The canvas element below is mounted exactly once, by the root layout,
	 * and every routed page renders around it. Nothing in this component is
	 * allowed to destroy it — that is the whole reason the site is a SPA.
	 *
	 * It is always position:fixed. When a page claims a viewport rect (the hub
	 * does, so the corridor appears inside a window) the canvas is moved and
	 * resized onto that rect. It is never reparented, so the WebGL context
	 * survives.
	 *
	 * Everything drawn *on* the render — door labels, the suit readout, the
	 * viewmodel — is mounted in here rather than in the page, because all of
	 * it is positioned relative to the canvas and not to the viewport.
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
	const hub = $derived(page.url.pathname === '/');
	const framed = $derived(isFramed(page.url.pathname));
	// The corridor only goes immersive once someone opens the gate; until then
	// it is covered, paused and holds no pointer. See lib/game/gate.
	//
	// `framed` rather than `hub`, because behind a door the corridor is still
	// there — smaller, in a rail tile — and carries the same cover. Activating
	// it from the tile has to work exactly as it does on the big screen.
	const immersive = $derived((framed && hubGate.open) || arcadeGame !== null);

	const frame = $derived(gameViewport.rect);
	/** Windowed means a page has put the canvas somewhere specific. */
	const windowed = $derived(frame !== null);
	/**
	 * A page has said it wants a window but has not measured one yet. Painting
	 * during that gap would flash a fullscreen canvas over the whole layout.
	 */
	const settling = $derived(gameViewport.intent && frame === null);
	/**
	 * The corridor is being played in something tile-sized. The overlays are
	 * sized for a full window and have to stand down to fit.
	 */
	const cramped = $derived(frame !== null && frame.width < 560);

	/**
	 * Windowed, the canvas has to sit *above* the page so the window's glass
	 * does not paint over it. It is clipped to the claimed rect, so it covers
	 * the screen and nothing else — the titlebar and dock stay clickable.
	 */
	const layer = $derived(!immersive ? 'z-0' : windowed ? 'z-30' : 'z-10');

	// Which room the corridor thinks you are standing in. Owned here rather
	// than in the frame because this component is the one that is always
	// mounted; leaving the frame entirely has to put it back to the corridor.
	$effect(() => {
		room.key = framed ? portalForPath(page.url.pathname) : null;
	});

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

<!--
	The canvas layer takes the power cycle along with the boxes it is sitting
	on. It is not a child of the frame — it is fixed and moved onto whichever
	rect was claimed — so it cannot inherit the collapse and has to be given
	the same classes directly. See lib/game/crt.svelte.ts.
-->
<div
	class="pointer-events-none fixed overflow-hidden transition-[opacity,filter] duration-500 {layer}"
	class:crt-off={crt.phase === 'off'}
	class:crt-on={crt.phase === 'on'}
	style:top={frame ? `${frame.top}px` : '0'}
	style:left={frame ? `${frame.left}px` : '0'}
	style:width={frame ? `${frame.width}px` : '100%'}
	style:height={frame ? `${frame.height}px` : '100%'}
	style:border-radius={frame ? 'calc(var(--radius-panel) + 6px)' : '0'}
	style:opacity={stage.mode === 'paused' || settling ? 0 : immersive ? 1 : 0.35}
	style:filter={immersive ? 'none' : 'saturate(0.7) blur(1px)'}
	aria-hidden={!immersive}
>
	<!-- tabindex so the canvas can actually hold focus: Babylon listens for the
	     camera's keys on this element, and an unfocusable canvas never hears
	     them. -1 keeps it out of the tab order, where it would be a trap. -->
	<canvas
		bind:this={canvas}
		onpointerdown={onCanvasPointerDown}
		tabindex="-1"
		class="h-full w-full touch-none outline-none"
		class:pointer-events-auto={immersive}
		aria-label="Interactive 3D hub"
	></canvas>

	<!-- These belong to the hub *scene*, not to the hub route: behind a door the
	     corridor is still the thing on screen, just in a tile, and it is still
	     playable. Only an arcade game replaces it. -->
	{#if immersive && arcadeGame === null}
		<PortalLabels compact={cramped} />
		<HudOverlay compact={cramped} />
		<ViewModel />
	{/if}

	{#if !immersive && !windowed}
		<!-- Keeps text legible over whatever the scene is doing behind it. -->
		<div
			class="absolute inset-0"
			style="background: linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 82%, transparent), color-mix(in srgb, var(--color-bg-deep) 94%, transparent))"
		></div>
	{/if}
</div>

<!-- The doorway transition. A route change is a route change; this is what
     makes walking through a door feel like one continuous movement. -->
{#if stage.fade > 0}
	<div
		class="pointer-events-none fixed inset-0 z-50"
		style:opacity={stage.fade}
		style:background-color="var(--color-bg-deep)"
	></div>
{/if}

{#if stage.unsupported}
	<div
		class="fixed inset-x-0 top-0 z-40 px-4 py-2 text-center"
		style:background-color="var(--color-surface)"
	>
		<p class="label">
			This browser will not give us a WebGL context, so the 3D hub is off. Everything else works.
		</p>
	</div>
{/if}
