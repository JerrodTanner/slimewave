<script lang="ts">
	import { page } from '$app/state';
	import PageShell from '$lib/components/PageShell.svelte';
	import { endpoints, type Artist } from '$lib/api/client';
	import { player } from '$lib/state/player.svelte';

	const artistName = $derived(decodeURIComponent(page.params.artist ?? ''));

	let artist = $state<Artist | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		const name = artistName;
		loading = true;
		error = null;
		endpoints
			.artist(name)
			.then((res) => {
				// Guard against a slower response for a previous artist landing
				// after the visitor has already moved on.
				if (name === artistName) artist = res.artist;
			})
			.catch((err) => {
				if (name === artistName) error = err.message;
			})
			.finally(() => {
				if (name === artistName) loading = false;
			});
	});

	const allTracks = $derived(artist?.albums.flatMap((a) => a.tracks) ?? []);
</script>

<svelte:head>
	<title>{artistName} — slimewave</title>
</svelte:head>

<PageShell title={artistName} lede="Albums on the server.">
	{#snippet actions()}
		<a class="btn-ghost" href="/music">← all artists</a>
		{#if allTracks.length > 0}
			<button class="btn-accent" type="button" onclick={() => player.play(allTracks)}>
				play everything
			</button>
		{/if}
	{/snippet}

	{#if loading}
		<p class="label">loading…</p>
	{:else if error}
		<p class="panel px-4 py-3 text-sm" style:color="var(--color-warn)">{error}</p>
	{:else if artist}
		<ul class="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
			{#each artist.albums as album (album.name)}
				<li class="panel flex flex-col">
					<a
						href="/music/{encodeURIComponent(artist.name)}/{encodeURIComponent(album.name)}"
						class="block"
					>
						{#if album.coverUrl}
							<img
								src={album.coverUrl}
								alt="{album.name} cover"
								loading="lazy"
								class="aspect-square w-full object-cover"
							/>
						{:else}
							<div
								class="flex aspect-square w-full items-center justify-center"
								style:background-color="var(--color-surface-raised)"
							>
								<span class="label">no artwork</span>
							</div>
						{/if}
					</a>
					<div class="flex items-start gap-2 p-3">
						<div class="min-w-0 flex-1">
							<a
								href="/music/{encodeURIComponent(artist.name)}/{encodeURIComponent(album.name)}"
								class="block truncate text-sm font-medium"
							>
								{album.name}
							</a>
							<p class="text-muted mt-0.5 font-mono text-[11px]">
								{album.tracks.length}
								{album.tracks.length === 1 ? 'track' : 'tracks'}
							</p>
						</div>
						<button
							type="button"
							class="btn-ghost shrink-0 px-2"
							onclick={() => player.play(album.tracks)}
							aria-label="Play {album.name}"
						>
							▶
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</PageShell>
