<script lang="ts">
	import { page } from '$app/state';
	import MusicPlayer from '$lib/components/MusicPlayer.svelte';

	const artistName = $derived(decodeURIComponent(page.params.artist ?? ''));
</script>

<svelte:head>
	<title>{artistName} — ShineWave</title>
</svelte:head>

<MusicPlayer />
