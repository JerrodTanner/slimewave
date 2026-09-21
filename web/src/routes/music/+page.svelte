<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import { endpoints, type ArtistSummary } from '$lib/api/client';

	let artists = $state<ArtistSummary[]>([]);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		endpoints
			.artists()
			.then((res) => (artists = res.artists))
			.catch((err) => (error = err.message))
			.finally(() => (loading = false));
	});
</script>

<svelte:head>
	<title>Music — slimewave</title>
</svelte:head>

<PageShell
	title="Music"
	lede="A directory of records I keep on the server. Playback carries across the site — start something here and keep browsing."
>
	{#if loading}
		<p class="label">reading the library…</p>
	{:else if error}
		<p class="panel px-4 py-3 text-sm" style:color="var(--color-warn)">{error}</p>
	{:else if artists.length === 0}
		<p class="text-muted text-sm">Nothing indexed yet.</p>
	{:else}
		<ul class="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
			{#each artists as artist (artist.name)}
				<li>
					<a
						href="/music/{encodeURIComponent(artist.name)}"
						class="panel flex h-full items-center gap-4 p-3 transition-colors"
					>
						{#if artist.coverUrl}
							<img
								src={artist.coverUrl}
								alt=""
								loading="lazy"
								class="h-16 w-16 shrink-0 object-cover"
								style:border="1px solid var(--color-line)"
							/>
						{:else}
							<div
								class="h-16 w-16 shrink-0"
								style:background-color="var(--color-surface-raised)"
								style:border="1px solid var(--color-line)"
							></div>
						{/if}
						<div class="min-w-0">
							<p class="truncate text-base leading-tight font-medium">{artist.name}</p>
							<p class="text-muted mt-1 font-mono text-[11px]">
								{artist.albumCount}
								{artist.albumCount === 1 ? 'album' : 'albums'} · {artist.trackCount}
								{artist.trackCount === 1 ? 'track' : 'tracks'}
							</p>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</PageShell>
