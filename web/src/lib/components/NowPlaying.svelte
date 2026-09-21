<script lang="ts">
	import { formatTime, player, publishMediaSession } from '$lib/state/player.svelte';

	// The <audio> element is created here, in the shell, for the same reason
	// the canvas is: a routed page that owned it would stop the music every
	// time you clicked a link.
	let audioEl: HTMLAudioElement;

	$effect(() => {
		if (audioEl) player.attach(audioEl);
	});

	$effect(() => {
		publishMediaSession(player.current);
	});

	const progress = $derived(player.duration > 0 ? player.position / player.duration : 0);
</script>

<audio bind:this={audioEl} preload="metadata"></audio>

{#if player.current}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-6 sm:pb-4">
		<div class="panel-raised pointer-events-auto mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
			<div class="flex shrink-0 items-center gap-1">
				<button
					type="button"
					class="btn-ghost px-2"
					onclick={() => player.prev()}
					disabled={!player.hasPrev && player.position < 3}
					aria-label="Previous track"
				>
					&#9664;&#9664;
				</button>
				<button
					type="button"
					class="btn-accent px-3"
					onclick={() => player.toggle()}
					aria-label={player.playing ? 'Pause' : 'Play'}
				>
					{player.playing ? '❚❚' : '▶'}
				</button>
				<button
					type="button"
					class="btn-ghost px-2"
					onclick={() => player.next()}
					disabled={!player.hasNext}
					aria-label="Next track"
				>
					&#9654;&#9654;
				</button>
			</div>

			<div class="min-w-0 flex-1">
				<p class="truncate font-mono text-[13px]">{player.current.title}</p>
				<p class="text-muted truncate font-mono text-[11px]">
					{player.current.artist} — {player.current.album}
					{#if player.blocked}
						<span style:color="var(--color-warn)"> · press play to start</span>
					{/if}
				</p>

				<div class="mt-1.5 flex items-center gap-2">
					<span class="text-muted font-mono text-[10px] tabular-nums"
						>{formatTime(player.position)}</span
					>
					<input
						type="range"
						class="h-1 flex-1 cursor-pointer appearance-none"
						style:background="linear-gradient(to right, var(--color-accent) {progress *
							100}%, var(--color-line) {progress * 100}%)"
						min="0"
						max={player.duration || 0}
						step="0.5"
						value={player.position}
						oninput={(e) => player.seek(Number(e.currentTarget.value))}
						aria-label="Seek"
					/>
					<span class="text-muted font-mono text-[10px] tabular-nums"
						>{formatTime(player.duration)}</span
					>
				</div>
			</div>

			<div class="hidden shrink-0 items-center gap-2 sm:flex">
				<label class="label" for="volume">vol</label>
				<input
					id="volume"
					type="range"
					class="h-1 w-20 cursor-pointer appearance-none"
					style:background="linear-gradient(to right, var(--color-accent) {player.volume *
						100}%, var(--color-line) {player.volume * 100}%)"
					min="0"
					max="1"
					step="0.01"
					value={player.volume}
					oninput={(e) => player.setVolume(Number(e.currentTarget.value))}
				/>
			</div>

			<button
				type="button"
				class="btn-ghost shrink-0 px-2"
				onclick={() => player.clear()}
				aria-label="Close the player"
			>
				✕
			</button>
		</div>
	</div>
{/if}

<style>
	input[type='range'] {
		border-radius: 999px;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 11px;
		height: 11px;
		border-radius: 999px;
		background: var(--color-accent);
		cursor: pointer;
	}

	input[type='range']::-moz-range-thumb {
		width: 11px;
		height: 11px;
		border: none;
		border-radius: 999px;
		background: var(--color-accent);
		cursor: pointer;
	}
</style>
