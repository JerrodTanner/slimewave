<script lang="ts">
	import { page } from '$app/state';
	import MusicPlayer from '$lib/components/MusicPlayer.svelte';

	const artistName = $derived(decodeURIComponent(page.params.artist ?? ''));
	const albumName = $derived(decodeURIComponent(page.params.album ?? ''));
</script>

<svelte:head>
	<title>{albumName} — {artistName} — ShineWave</title>
</svelte:head>

<MusicPlayer />
