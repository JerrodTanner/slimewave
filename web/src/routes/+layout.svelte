<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	import GameStage from '$lib/components/GameStage.svelte';
	import HubFrame from '$lib/components/HubFrame.svelte';
	import NowPlaying from '$lib/components/NowPlaying.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import { isFramed } from '$lib/game/portals';
	import { session } from '$lib/state/session.svelte';
	import { theme } from '$lib/theme/theme.svelte';
	import { ui } from '$lib/state/ui.svelte';

	let { children } = $props();

	/**
	 * The shell.
	 *
	 * Everything in this file outlives navigation: the Babylon canvas, the
	 * audio element, the frame, the theme. Routed pages mount and unmount
	 * inside `children` around them. That is the entire architectural point of
	 * the project, so nothing persistent should be moved down into a route.
	 *
	 * The hub frame is one of those persistent things now. The hub and its
	 * four doors all render inside it — the corridor and the chosen page just
	 * swap boxes — so it cannot belong to `/` any more than the canvas can.
	 */
	onMount(() => {
		theme.init();
		ui.init();
		void session.load();
	});

	const path = $derived(page.url.pathname);
	/** The hub and its four doors. Everything else gets the plain nav. */
	const framed = $derived(isFramed(path));
	/** An arcade game is the one route that takes the whole screen. */
	const arcadeGame = $derived(path.startsWith('/arcade/'));
	const hub = $derived(path === '/');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<GameStage />

{#if framed}
	<HubFrame>{@render children()}</HubFrame>
{:else}
	<div class="relative z-20 min-h-dvh" class:pointer-events-none={arcadeGame}>
		{#if !arcadeGame}
			<SiteNav />
		{/if}

		<main class:pointer-events-none={arcadeGame}>
			{@render children()}
		</main>
	</div>
{/if}

<NowPlaying bar={!hub} />
