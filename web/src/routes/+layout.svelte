<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	import GameStage from '$lib/components/GameStage.svelte';
	import NowPlaying from '$lib/components/NowPlaying.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import { session } from '$lib/state/session.svelte';
	import { theme } from '$lib/theme/theme.svelte';
	import { ui } from '$lib/state/ui.svelte';

	let { children } = $props();

	/**
	 * The shell.
	 *
	 * Everything in this file outlives navigation: the Babylon canvas, the
	 * audio element, the nav, the theme. Routed pages mount and unmount inside
	 * `children` around them. That is the entire architectural point of the
	 * project, so nothing persistent should be moved down into a route.
	 */
	onMount(() => {
		theme.init();
		ui.init();
		void session.load();
	});

	// The hub owns the whole viewport; every other route renders chrome.
	const hub = $derived(page.url.pathname === '/');
	const arcadeGame = $derived(page.url.pathname.startsWith('/arcade/'));
	const chromeless = $derived(hub || arcadeGame);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<GameStage />

<div class="relative z-20 min-h-dvh" class:pointer-events-none={chromeless}>
	{#if !chromeless}
		<SiteNav />
	{/if}

	<main class:pointer-events-none={chromeless}>
		{@render children()}
	</main>
</div>

<NowPlaying />
