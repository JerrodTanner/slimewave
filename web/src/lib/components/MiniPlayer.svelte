<script lang="ts">
	import { coverOf, player } from '$lib/state/player.svelte';

	/**
	 * The player everywhere but the Media page: it takes the sine mark's
	 * place in the heading rule while a track is loaded. The album cover is
	 * the face, with a drawer pulled out from behind its right edge holding
	 * the transport top to bottom — back, play/pause, forward — and a hairline
	 * along the cover's foot for how far in the track is. The header decides
	 * when it shows.
	 */
	let { size = 62 }: { size?: number } = $props();
	const cover = $derived(coverOf(player.current));
	const progress = $derived(player.duration > 0 ? player.position / player.duration : 0);
</script>

{#if player.current}
	<div class="mini" style:--size="{size}px" title="{player.current.title} — {player.current.artist}">
		<div class="drawer">
			<button type="button" class="ctl" aria-label="Previous track" onclick={() => player.prev()}>
				<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="5" width="3" height="14" /><path d="M20 5v14L8.5 12z" /></svg>
			</button>
			<button
				type="button"
				class="ctl main"
				aria-label="{player.playing ? 'Pause' : 'Play'} {player.current.title} by {player.current.artist}"
				onclick={() => player.toggle()}
			>
				{#if player.playing}
					<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" /></svg>
				{:else}
					<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" /></svg>
				{/if}
			</button>
			<button type="button" class="ctl" aria-label="Next track" disabled={!player.hasNext} onclick={() => player.next()}>
				<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="17" y="5" width="3" height="14" /><path d="M4 5v14l11.5-7z" /></svg>
			</button>
		</div>

		<span class="art" aria-hidden="true">
			{#if cover}<img src={cover} alt="" />{/if}
			<span class="progress" style:transform="scaleX({progress})"></span>
		</span>
	</div>
{/if}

<style>
	.mini {
		--drawer: 26px;
		position: relative;
		flex-shrink: 0;
		/* A little taller than the mark it replaces; bleeding into the
		   header's padding keeps the header from growing when music starts. */
		margin-block: -4px;
		width: calc(var(--size) + var(--drawer) - 1px);
		height: var(--size);
	}

	/* The cover sits on top; the drawer is behind it and slides out from
	   under its right edge, a few pixels shorter so it reads as pulled out. */
	.art {
		position: absolute;
		inset: 0 auto 0 0;
		z-index: 1;
		width: var(--size);
		overflow: hidden;
		box-sizing: border-box;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-raised));
	}

	.art img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.progress {
		position: absolute;
		inset: auto 0 0 0;
		height: 2px;
		background-color: var(--color-accent);
		transform-origin: left;
		will-change: transform;
	}

	.drawer {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: calc(var(--size) - 1px);
		width: var(--drawer);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: space-between;
		padding: 1px;
		border: 1px solid var(--color-line);
		border-left: 0;
		border-radius: 0 var(--radius-panel) var(--radius-panel) 0;
		background-color: var(--color-surface-raised);
		animation: pull-out 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	@keyframes pull-out {
		from {
			transform: translateX(calc(-1 * var(--drawer)));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.drawer {
			animation: none;
		}
	}

	.ctl {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		padding: 0;
		border: 0;
		border-radius: var(--radius-panel);
		background: transparent;
		color: var(--color-ink);
		cursor: pointer;
	}

	.ctl:hover:not(:disabled) {
		color: var(--color-accent);
	}

	.ctl:disabled {
		cursor: default;
		opacity: 0.35;
	}

	.ctl.main {
		flex: 1.3;
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
	}

	.ctl.main:hover {
		color: var(--color-accent-ink);
		filter: brightness(1.1);
	}

	.ctl:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}
</style>
