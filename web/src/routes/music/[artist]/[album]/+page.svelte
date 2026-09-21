<script lang="ts">
	import { page } from '$app/state';
	import PageShell from '$lib/components/PageShell.svelte';
	import { endpoints, type Album } from '$lib/api/client';
	import { player } from '$lib/state/player.svelte';

	const artistName = $derived(decodeURIComponent(page.params.artist ?? ''));
	const albumName = $derived(decodeURIComponent(page.params.album ?? ''));

	let album = $state<Album | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		const key = `${artistName}/${albumName}`;
		loading = true;
		error = null;
		endpoints
			.album(artistName, albumName)
			.then((res) => {
				if (key === `${artistName}/${albumName}`) album = res.album;
			})
			.catch((err) => {
				if (key === `${artistName}/${albumName}`) error = err.message;
			})
			.finally(() => {
				if (key === `${artistName}/${albumName}`) loading = false;
			});
	});
</script>

<svelte:head>
	<title>{albumName} — {artistName} — slimewave</title>
</svelte:head>

<PageShell title={albumName} lede={artistName}>
	{#snippet actions()}
		<a class="btn-ghost" href="/music/{encodeURIComponent(artistName)}">← {artistName}</a>
		{#if album && album.tracks.length > 0}
			<button class="btn-accent" type="button" onclick={() => player.play(album!.tracks)}>
				play album
			</button>
		{/if}
	{/snippet}

	{#if loading}
		<p class="label">loading…</p>
	{:else if error}
		<p class="panel px-4 py-3 text-sm" style:color="var(--color-warn)">{error}</p>
	{:else if album}
		<div class="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
			<div>
				{#if album.coverUrl}
					<img
						src={album.coverUrl}
						alt="{album.name} cover"
						class="panel aspect-square w-full object-cover"
					/>
				{:else}
					<div
						class="panel flex aspect-square w-full items-center justify-center"
						style:background-color="var(--color-surface-raised)"
					>
						<span class="label">no artwork</span>
					</div>
				{/if}
			</div>

			<ol class="space-y-px">
				{#each album.tracks as track, i (track.streamUrl)}
					{@const current = player.isCurrent(track)}
					<li>
						<button
							type="button"
							class="panel flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
							style:border-color={current ? 'var(--color-accent)' : undefined}
							onclick={() => player.play(album!.tracks, i)}
						>
							<span
								class="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums"
								style:color={current ? 'var(--color-accent)' : 'var(--color-muted)'}
							>
								{current && player.playing ? '▶' : i + 1}
							</span>
							<span
								class="min-w-0 flex-1 truncate text-sm"
								style:color={current ? 'var(--color-accent)' : undefined}
							>
								{track.title}
							</span>
							<span class="text-muted shrink-0 font-mono text-[10px] tabular-nums">
								{(track.size / 1024 / 1024).toFixed(1)} MB
							</span>
						</button>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
</PageShell>
