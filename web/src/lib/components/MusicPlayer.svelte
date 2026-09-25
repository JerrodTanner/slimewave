<script module lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { endpoints, type Artist, type ArtistSummary, type Track } from '$lib/api/client';

	// Module-level so walking between the three music routes, which each mount
	// their own copy of this component, does not refetch or re-measure.
	let artistsRequest: Promise<ArtistSummary[]> | null = null;
	const artistCache = new SvelteMap<string, Artist>();
	/** Track length in seconds, keyed by stream URL, read off the file's own metadata. */
	const durations = new SvelteMap<string, number>();
	/** Album artwork by `artist/album`, so the now-playing strip can show it on any page. */
	const covers = new SvelteMap<string, string>();

	function loadArtists() {
		artistsRequest ??= endpoints.artists().then((res) => res.artists);
		return artistsRequest;
	}

	async function loadArtist(name: string) {
		const hit = artistCache.get(name);
		if (hit) return hit;
		const { artist } = await endpoints.artist(name);
		artistCache.set(name, artist);
		for (const album of artist.albums) {
			if (album.coverUrl) covers.set(`${artist.name}/${album.name}`, album.coverUrl);
		}
		return artist;
	}

	// ponytail: the API carries no lengths, so each track's metadata is fetched
	// by a throwaway <audio>. Move it into the Go indexer if albums get long.
	function measure(tracks: Track[]) {
		for (const track of tracks) {
			if (durations.has(track.streamUrl)) continue;
			durations.set(track.streamUrl, 0);
			const probe = new Audio();
			probe.preload = 'metadata';
			probe.onloadedmetadata = () => {
				durations.set(track.streamUrl, probe.duration || 0);
				probe.removeAttribute('src');
			};
			probe.src = track.streamUrl;
		}
	}
</script>

<script lang="ts">
	import { page } from '$app/state';
	import { crt } from '$lib/game/crt.svelte';
	import { formatTime, player } from '$lib/state/player.svelte';

	/**
	 * The Media door: one player laid over the three music routes.
	 *
	 * The route only says what the main panel shows — every artist, one
	 * artist's albums, or one album's tracks. The library rail and the
	 * now-playing strip are the same on all three, and the strip replaces the
	 * shell's floating bar here, so there is one set of controls on the page.
	 */
	const artistName = $derived(page.params.artist ? decodeURIComponent(page.params.artist) : null);
	const albumName = $derived(page.params.album ? decodeURIComponent(page.params.album) : null);

	let artists = $state<ArtistSummary[]>([]);
	let artist = $state<Artist | null>(null);
	let error = $state<string | null>(null);
	let query = $state('');

	$effect(() => {
		loadArtists()
			.then((list) => {
				artists = list;
				for (const a of list) if (a.coverUrl && !covers.has(a.name)) covers.set(a.name, a.coverUrl);
			})
			.catch((err) => (error = err.message));
	});

	$effect(() => {
		const name = artistName;
		artist = null;
		if (!name) return;
		loadArtist(name)
			.then((a) => {
				// A slower response for the previous artist must not land on this one.
				if (name === artistName) artist = a;
			})
			.catch((err) => {
				if (name === artistName) error = err.message;
			});
	});

	const album = $derived(artist?.albums.find((a) => a.name === albumName) ?? null);

	// Home lists every album, so it needs every artist's detail, not just the summaries.
	$effect(() => {
		if (artistName) return;
		for (const a of artists) loadArtist(a.name).catch((err) => (error = err.message));
	});
	const allAlbums = $derived(artists.flatMap((a) => artistCache.get(a.name)?.albums ?? []));

	$effect(() => {
		if (album) measure(album.tracks);
	});

	const needle = $derived(query.trim().toLowerCase());
	const matches = (text: string) => !needle || text.toLowerCase().includes(needle);

	const artistHref = (name: string) => `/music/${encodeURIComponent(name)}`;
	const albumHref = (a: string, b: string) => `${artistHref(a)}/${encodeURIComponent(b)}`;
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 'S'}`;

	const albumSeconds = $derived(
		album ? album.tracks.reduce((sum, t) => sum + (durations.get(t.streamUrl) ?? 0), 0) : 0
	);
	const albumMeasured = $derived(
		album !== null && album.tracks.every((t) => (durations.get(t.streamUrl) ?? 0) > 0)
	);

	const albumIsCurrent = $derived(
		album !== null &&
			player.current !== null &&
			player.current.album === album.name &&
			player.current.artist === album.artist
	);

	function playAlbum() {
		if (!album) return;
		if (albumIsCurrent) player.toggle();
		else player.play(album.tracks);
	}

	function playTrack(i: number) {
		if (!album) return;
		if (player.isCurrent(album.tracks[i])) player.toggle();
		else player.play(album.tracks, i);
	}

	const nowCover = $derived(
		player.current
			? (covers.get(`${player.current.artist}/${player.current.album}`) ??
					covers.get(player.current.artist) ??
					null)
			: null
	);
	const progress = $derived(player.duration > 0 ? player.position / player.duration : 0);
</script>

{#snippet pauseIcon(size: number)}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" />
	</svg>
{/snippet}

{#snippet playIcon(size: number)}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M7 4.5v15l12.5-7.5z" />
	</svg>
{/snippet}

{#snippet cover(src: string | null | undefined, alt: string, size: number)}
	<span class="art" class:art-empty={!src} style:width="{size}px" style:height="{size}px">
		{#if src}<img {src} {alt} loading="lazy" />{/if}
	</span>
{/snippet}

<div class="player">
	<!-- top bar -->
	<div class="top">
		<a class="box brand" href="/music">
			<span class="brand-icon" aria-hidden="true">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
			</span>
			MUSIC PLAYER
		</a>
		<label class="search">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
			<span class="sr-only">Search the library</span>
			<input type="search" placeholder="Search your library" bind:value={query} />
		</label>
	</div>

	<div class="middle">
		<!-- library rail -->
		<aside class="box rail">
			<div class="boxbar">LIBRARY</div>
			<nav class="railnav" aria-label="Library">
				<a class="hov railitem" href="/music" aria-current={artistName === null ? 'page' : undefined}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></svg>
					Home
				</a>
			</nav>
			<div class="railhead">ARTISTS<span class="flex-1"></span><span class="muted">{artists.length}</span></div>
			<div class="artists">
				{#each artists.filter((a) => matches(a.name)) as a (a.name)}
					<a
						class="hov artist"
						class:here={a.name === artistName}
						href={artistHref(a.name)}
						aria-current={a.name === artistName ? 'page' : undefined}
					>
						{@render cover(a.coverUrl, '', 42)}
						<span class="stack">
							<span class="name">{a.name}</span>
							<span class="meta">{plural(a.albumCount, 'ALBUM')}</span>
						</span>
					</a>
				{/each}
			</div>
		</aside>

		<!-- the main panel: whatever the route asks for -->
		<main class="box panel">
			<div class="boxbar">
				<span class="chip-q">{album ? 'ALBUM' : artistName ? 'ARTIST' : 'ALL ALBUMS'}</span>
			</div>

			<div class="scroll">
				{#if error}
					<p class="note warn">{error}</p>
				{:else if album}
					<div class="hero">
						{@render cover(album.coverUrl, `${album.name} cover`, 156)}
						<div class="stack gap">
							<h1>{album.name}</h1>
							<div class="byline">
								<a class="strong" href={artistHref(album.artist)}>{album.artist}</a>
								<span class="meta"
									>{plural(album.tracks.length, 'TRACK')}{albumMeasured ? ` · ${formatTime(albumSeconds)}` : ''}</span
								>
							</div>
							<div class="actions">
								<button type="button" class="solid" onclick={playAlbum}>
									{#if albumIsCurrent && player.playing}{@render pauseIcon(14)} PAUSE{:else}{@render playIcon(14)} PLAY{/if}
								</button>
							</div>
						</div>
					</div>

					<div class="tracks">
						<div class="trow thead">
							<span>#</span><span>TITLE</span><span class="col-album">ALBUM</span><span class="right">TIME</span>
						</div>
						{#each album.tracks as track, i (track.streamUrl)}
							{@const current = player.isCurrent(track)}
							{#if matches(track.title)}
								<button type="button" class="hov trow" class:here={current} onclick={() => playTrack(i)}>
									<span class="num">
										{#if current && player.playing}{@render playIcon(12)}{:else}{String(i + 1).padStart(2, '0')}{/if}
									</span>
									<span class="stack">
										<span class="name">{track.title}</span>
										<span class="sub">{track.artist}</span>
									</span>
									<span class="sub col-album">{track.album}</span>
									<span class="time right">{durations.get(track.streamUrl) ? formatTime(durations.get(track.streamUrl)!) : '–'}</span>
								</button>
							{/if}
						{/each}
					</div>
				{:else if albumName}
					<p class="note">{artist ? `No album called “${albumName}”.` : 'loading…'}</p>
				{:else if artistName}
					{#if artist}
						{@const trackCount = artist.albums.reduce((n, a) => n + a.tracks.length, 0)}
						<div class="hero">
							<div class="stack gap">
								<h1>{artist.name}</h1>
								<span class="meta">{plural(artist.albums.length, 'ALBUM')} · {plural(trackCount, 'TRACK')}</span>
								<div class="actions">
									<button type="button" class="solid" onclick={() => player.play(artist!.albums.flatMap((a) => a.tracks))}>
										{@render playIcon(14)} PLAY EVERYTHING
									</button>
								</div>
							</div>
						</div>
						<div class="grid">
							{#each artist.albums.filter((a) => matches(a.name)) as a (a.name)}
								<a class="hov card" href={albumHref(artist.name, a.name)}>
									{@render cover(a.coverUrl, '', 64)}
									<span class="stack">
										<span class="name">{a.name}</span>
										<span class="meta">{plural(a.tracks.length, 'TRACK')}</span>
									</span>
								</a>
							{/each}
						</div>
					{:else}
						<p class="note">loading…</p>
					{/if}
				{:else}
					<div class="hero">
						<h1>All albums</h1>
					</div>
					<!-- Held until the power cycle is over. Tiles that mounted mid-cycle
					     kept a stale paint (their bottom rule missing until hovered);
					     laid down on a still screen they paint whole. -->
					{#if crt.phase === 'idle'}
						<div class="tiles">
							{#each allAlbums.filter((a) => matches(a.name) || matches(a.artist)) as a (`${a.artist}/${a.name}`)}
								<a class="tile" href={albumHref(a.artist, a.name)} title="{a.name} — {a.artist}">
									<span class="tile-art" class:art-empty={!a.coverUrl}>
										{#if a.coverUrl}
											<img src={a.coverUrl} alt="{a.name} by {a.artist}" loading="lazy" />
										{:else}
											<span class="sr-only">{a.name} by {a.artist}</span>
										{/if}
									</span>
									<span class="stack">
										<span class="name">{a.name}</span>
										<span class="meta">{plural(a.tracks.length, 'TRACK')}</span>
									</span>
								</a>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</main>
	</div>

	<!-- now playing -->
	<div class="box now">
		<span class="hazard" aria-hidden="true"></span>
		<div class="nowtrack">
			{@render cover(nowCover, '', 56)}
			<div class="stack">
				<span class="name">{player.current?.title ?? 'Nothing playing'}</span>
				<span class="sub">
					{#if player.current}{player.current.artist}{:else}Pick a track to start{/if}
					{#if player.blocked}<span class="warn"> · press play to start</span>{/if}
				</span>
			</div>
			{#if player.current && player.playing}<span class="chip-on">PLAYING</span>{/if}
		</div>

		<div class="transport">
			<div class="controls">
				<button type="button" class="hov btn" aria-label="Previous track" disabled={!player.current} onclick={() => player.prev()}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="5" width="3" height="14" /><path d="M20 5v14L8.5 12z" /></svg>
				</button>
				<button type="button" class="solid btn-main" aria-label={player.playing ? 'Pause' : 'Play'} disabled={!player.current} onclick={() => player.toggle()}>
					{#if player.playing}{@render pauseIcon(14)}{:else}{@render playIcon(14)}{/if}
				</button>
				<button type="button" class="hov btn" aria-label="Next track" disabled={!player.hasNext} onclick={() => player.next()}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="17" y="5" width="3" height="14" /><path d="M4 5v14l11.5-7z" /></svg>
				</button>
			</div>
			<div class="seek">
				<span>{formatTime(player.position)}</span>
				<input
					type="range"
					class="bar"
					style:--fill="{progress * 100}%"
					min="0"
					max={player.duration || 0}
					step="0.5"
					value={player.position}
					disabled={!player.current}
					oninput={(e) => player.seek(Number(e.currentTarget.value))}
					aria-label="Seek"
				/>
				<span>{formatTime(player.duration)}</span>
			</div>
		</div>

		<label class="volume">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></svg>
			<span class="sr-only">Volume</span>
			<input
				type="range"
				class="bar"
				style:--fill="{player.volume * 100}%"
				min="0"
				max="1"
				step="0.01"
				value={player.volume}
				oninput={(e) => player.setVolume(Number(e.currentTarget.value))}
			/>
		</label>
	</div>
</div>

<style>
	/* The Newsprint furniture — hairline boxes, a dither rule over each
	   titlebar, mono caps for labels — drawn from theme tokens so every
	   other theme gets the same player in its own palette. */
	.player {
		container-type: inline-size;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 14px;
		height: 100%;
		min-height: 520px;
		padding: 16px;
		/* The resume's paper stock, fixed across themes the same way it is there. */
		background-color: #f5f5dc;
		color: var(--color-ink);
	}

	.box {
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: var(--color-surface-raised);
	}

	.boxbar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 12px 9px;
		border-bottom: 1px solid var(--color-line);
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.12em;
		background-image: repeating-linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-line) 55%, transparent) 0 1px,
			transparent 1px 11px
		);
		background-size: 100% 6px;
		background-repeat: repeat-x;
		background-position: top;
	}

	.hov:hover:not(:disabled) {
		background-color: color-mix(in srgb, var(--color-accent) 16%, transparent);
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.gap {
		gap: 8px;
	}

	.name {
		overflow: hidden;
		font-size: 15px;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sub,
	.muted {
		font-size: 13px;
		color: var(--color-muted);
	}

	.meta,
	.time,
	.railhead,
	.seek {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		color: var(--color-muted);
	}

	.art {
		display: block;
		flex-shrink: 0;
		box-sizing: border-box;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
	}

	.art img,
	.tile-art img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.art-empty {
		background-color: var(--color-surface);
	}

	.chip-q,
	.chip-on {
		padding: 3px 8px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 400;
		letter-spacing: 0.12em;
		color: var(--color-muted);
		white-space: nowrap;
	}

	.chip-on {
		border-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
		color: var(--color-accent);
	}

	.solid {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		height: 38px;
		padding: 0 16px;
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-panel);
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.12em;
	}

	button:disabled {
		cursor: default;
		opacity: 0.45;
	}

	.warn {
		color: var(--color-warn);
	}

	/* --- top bar -------------------------------------------------------- */
	.top {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.brand {
		width: 250px;
		height: 44px;
		box-sizing: border-box;
		padding: 0 10px 0 4px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 12px;
		font-family: var(--font-display);
		font-size: 20px;
		letter-spacing: var(--tracking-display);
		white-space: nowrap;
		color: inherit;
	}

	.brand-icon {
		width: 36px;
		height: 36px;
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid color-mix(in srgb, var(--color-accent) 60%, transparent);
		border-radius: var(--radius-panel);
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
		color: var(--color-accent);
	}

	.search {
		width: min(420px, 100%);
		height: 44px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 12px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: var(--color-surface-raised);
		color: var(--color-accent);
	}

	.search:focus-within {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: none;
		background: transparent;
		font: 15px var(--font-body);
		color: var(--color-ink);
	}

	/* --- middle --------------------------------------------------------- */
	.middle {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		gap: 14px;
	}

	.rail {
		width: 250px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow-y: auto;
	}

	.railnav {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px;
	}

	.railitem {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 10px;
		border-radius: var(--radius-panel);
		font-size: 15px;
		font-weight: 700;
		color: inherit;
	}

	.railitem svg {
		color: var(--color-accent);
	}

	.railhead {
		display: flex;
		align-items: center;
		padding: 10px 12px 6px;
		border-top: 1px solid var(--color-line);
		font-weight: 600;
		letter-spacing: 0.12em;
		color: var(--color-ink);
	}

	.artists {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 0 8px 8px;
	}

	.artist {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px;
		border: 1px solid transparent;
		border-radius: var(--radius-panel);
		color: inherit;
	}

	.artist .name {
		font-size: 14px;
	}

	.here {
		border-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
	}

	.panel {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}

	.note {
		margin: 0;
		padding: 20px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-muted);
	}

	.hero {
		display: flex;
		align-items: flex-end;
		gap: 22px;
		padding: 20px;
	}

	.hero h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(28px, 4.2cqi, 44px);
		font-weight: 400;
		line-height: 1;
		letter-spacing: var(--tracking-display);
	}

	.byline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}

	.strong {
		font-size: 15px;
		font-weight: 700;
		color: inherit;
	}

	.actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 4px;
		padding: 0 20px 20px;
	}

	.card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px;
		border-radius: var(--radius-panel);
		color: inherit;
	}

	/* Home: every album as its own cover tile, the count under it. */
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 16px;
		padding: 0 20px 20px;
	}

	.tile {
		display: flex;
		flex-direction: column;
		gap: 8px;
		color: inherit;
	}

	.tile-art {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		box-sizing: border-box;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
	}

	.tile:hover .tile-art {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* --- tracks --------------------------------------------------------- */
	.tracks {
		display: flex;
		flex-direction: column;
		margin: 0 20px 20px;
		border-top: 1px solid var(--color-line);
	}

	.trow {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr) minmax(0, 260px) 70px;
		align-items: center;
		height: 52px;
		padding: 0 12px;
		border: 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-line) 20%, transparent);
		background: transparent;
		text-align: left;
		color: inherit;
	}

	.trow.here {
		background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.trow.here .num,
	.trow.here .name {
		color: var(--color-accent);
	}

	.thead {
		height: 34px;
		border-bottom-color: var(--color-line);
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.12em;
		color: var(--color-muted);
	}

	.num {
		display: inline-flex;
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 700;
		color: var(--color-muted);
	}

	.time {
		font-size: 12px;
		letter-spacing: normal;
		color: var(--color-ink);
	}

	.right {
		text-align: right;
	}

	/* --- now playing ---------------------------------------------------- */
	.now {
		flex-shrink: 0;
		display: grid;
		grid-template-columns: 8px minmax(0, 320px) minmax(0, 1fr) minmax(0, 240px);
		align-items: center;
		gap: 16px;
		height: 80px;
		padding-right: 16px;
		overflow: hidden;
	}

	.hazard {
		align-self: stretch;
		border-right: 1px solid var(--color-line);
		background-image: repeating-linear-gradient(-45deg, var(--color-accent) 0 4px, transparent 4px 8px);
	}

	.nowtrack {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.transport {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn {
		width: 32px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: var(--color-surface-raised);
		color: var(--color-ink);
	}

	.btn-main {
		width: 44px;
		height: 32px;
		justify-content: center;
		padding: 0;
	}

	.seek {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 11px;
		letter-spacing: normal;
		font-variant-numeric: tabular-nums;
	}

	.volume {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		color: var(--color-accent);
	}

	.volume .bar {
		width: 130px;
	}

	/* A hairline track, filled in the accent up to the value, with a square
	   thumb — the one slider shape the site uses. */
	.bar {
		flex: 1;
		height: 4px;
		margin: 0;
		appearance: none;
		cursor: pointer;
		background: linear-gradient(
			to right,
			var(--color-accent) var(--fill),
			color-mix(in srgb, var(--color-line) 15%, transparent) var(--fill)
		);
	}

	.bar:disabled {
		cursor: default;
	}

	.bar::-webkit-slider-thumb {
		appearance: none;
		width: 10px;
		height: 10px;
		box-sizing: border-box;
		border: 1px solid var(--color-line);
		background: var(--color-surface-raised);
	}

	.bar::-moz-range-thumb {
		width: 10px;
		height: 10px;
		box-sizing: border-box;
		border: 1px solid var(--color-line);
		border-radius: 0;
		background: var(--color-surface-raised);
	}

	/* --- narrow: the rail folds away (Home and the artist grid cover it),
	   and the now-playing strip drops its outer columns. */
	@container (max-width: 760px) {
		.rail,
		.brand {
			display: none;
		}

		.col-album {
			display: none;
		}

		.trow {
			grid-template-columns: 40px minmax(0, 1fr) 56px;
		}

		.hero {
			align-items: flex-start;
			flex-direction: column;
		}

		.now {
			grid-template-columns: 8px minmax(0, 1fr);
			height: auto;
			padding: 10px 12px 10px 0;
		}

		.now .hazard {
			grid-row: span 2;
		}

		.volume {
			display: none;
		}
	}
</style>
