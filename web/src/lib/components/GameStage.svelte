<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { stage } from '$lib/game/stage.svelte';
	import { crt } from '$lib/game/crt.svelte';
	import { hubGate } from '$lib/game/gate.svelte';
	import { gameViewport } from '$lib/game/viewport.svelte';
	import { isFramed, portalForPath } from '$lib/game/portals';
	import { room } from '$lib/game/room.svelte';
	import { createHubScene } from '$lib/game/hubScene';
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
		stage.setNavigator((href) => {
			void stage.transitionTo(href, (target) => goto(target));
		});
		stage.mount(canvas);
		stage.activate('hub');

		return () => stage.dispose();
	});

	// The hub scene is the only scene, and it runs under every route — in a
	// window on the framed pages, as a backdrop everywhere else.
	const framed = $derived(isFramed(page.url.pathname));
	// The corridor only goes immersive once someone opens the gate; until then
	// it is covered, paused and holds no pointer. See lib/game/gate.
	//
	// `framed` rather than the hub route, because behind a door the corridor is
	// still there — smaller, in a rail tile — and carries the same cover.
	// Activating it from the tile has to work exactly as it does on the big
	// screen.
	const immersive = $derived(framed && hubGate.open);

	const frame = $derived(gameViewport.rect);
	/** Windowed means a page has put the canvas somewhere specific. */
	const windowed = $derived(frame !== null);
	/**
	 * A framed page always draws the corridor into a rect it claimed. When that
	 * rect is missing — the first frame after mount, or the gap between the
	 * window and a rail tile during a power cycle — the canvas waits.
	 *
	 * It used to stretch to the whole viewport instead. Immersive that put an
	 * opaque canvas above the page with pointer events on, which ate every
	 * click on the way back from a door. There is no case inside the frame
	 * where filling the screen is the right answer, so it no longer can.
	 */
	const stranded = $derived((framed || gameViewport.intent) && frame === null);
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
	const layer = $derived(stranded || !immersive ? 'z-0' : windowed ? 'z-30' : 'z-10');

	// Which room the corridor thinks you are standing in. Owned here rather
	// than in the frame because this component is the one that is always
	// mounted; leaving the frame entirely has to put it back to the corridor.
	$effect(() => {
		room.key = framed ? portalForPath(page.url.pathname) : null;
	});

	// The stage's own guards read the state they are about to write
	// (`activeSceneId`, `mode`), so calling in tracked would make this effect
	// depend on what it sets. Every real dependency is read above the untrack.
	$effect(() => {
		if (!stage.ready) return;
		untrack(() => stage.activate('hub'));
	});

	$effect(() => {
		if (!stage.ready) return;
		const next = immersive ? 'immersive' : ui.backdrop === 'ambient' ? 'ambient' : 'paused';
		untrack(() => stage.setMode(next));
	});

	// Dropping back to simple while standing in the corridor puts the pointer
	// back and shuts the gate. Here rather than in the menu because this is the
	// component that is always mounted, whatever the route.
	$effect(() => {
		if (ui.mode !== 'advanced') hubGate.stand();
	});

	function onCanvasPointerDown() {
		// Pointer lock has to come from a real gesture, so it is requested here
		// rather than when the mode changes.
		if (immersive && !stranded && !stage.pointerLocked) stage.requestPointerLock();
	}

	/**
	 * Escape pauses: the pointer comes back and the cover drops over the
	 * corridor again, which is what the HUD promises.
	 *
	 * It has to be caught twice. The keydown below is the path for a visitor
	 * who never got pointer lock (a touchscreen, or a browser that refused it);
	 * while the pointer *is* locked, browsers keep Escape for themselves and
	 * release the lock without telling the page, so the lock being dropped is
	 * the only signal there is. Either way it lands on the same call, and
	 * `stand()` is a no-op when the gate is already shut.
	 */
	let hadLock = false;
	$effect(() => {
		if (stage.pointerLocked) {
			hadLock = true;
			return;
		}
		if (!hadLock) return;
		hadLock = false;
		untrack(() => hubGate.stand());
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key !== 'Escape') return;
		stage.exitPointerLock();
		hubGate.stand();
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
	style:width={frame ? `${frame.width}px` : stranded ? '0' : '100%'}
	style:height={frame ? `${frame.height}px` : stranded ? '0' : '100%'}
	style:border-radius={frame ? 'calc(var(--radius-panel) + 6px)' : '0'}
	style:opacity={stage.mode === 'paused' || stranded ? 0 : immersive ? 1 : 0.35}
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
		class:pointer-events-auto={immersive && !stranded}
		aria-label="Interactive 3D hub"
	></canvas>

	<!-- These belong to the hub *scene*, not to the hub route: behind a door the
	     corridor is still the thing on screen, just in a tile, and it is still
	     playable. -->
	{#if immersive}
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
