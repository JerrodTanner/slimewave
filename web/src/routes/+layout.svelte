<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import '../app.css';

	import GameStage from '$lib/components/GameStage.svelte';
	import HubFrame from '$lib/components/HubFrame.svelte';
	import NowPlaying from '$lib/components/NowPlaying.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import { isFramed } from '$lib/game/portals';
	import { cardPlate } from '$lib/state/cardPlate.svelte';
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
	 * doors all render inside it — the corridor and the chosen page just swap
	 * boxes — so it cannot belong to `/` any more than the canvas can.
	 */
	onMount(() => {
		theme.init();
		ui.init();
		cardPlate.init();
		void session.load();
	});

	const path = $derived(page.url.pathname);
	/** The hub and its doors. Everything else gets the plain nav. */
	const framed = $derived(isFramed(path));
</script>

<GameStage />

{#if framed}
	<HubFrame>{@render children()}</HubFrame>
{:else}
	<div class="relative z-20 min-h-dvh">
		<SiteNav />

		<main>
			{@render children()}
		</main>
	</div>
{/if}

<NowPlaying />
