<script lang="ts">
	import { PORTALS } from '$lib/game/portals';

	/**
	 * The suit readout, drawn over the corridor.
	 *
	 * The borrowed shape is an FPS HUD, but it only says things that are true:
	 * how many doors there are, which keys move you, and how to stop. The
	 * controls are not in a corner: they sit under the crosshair, just above
	 * the bottom edge, because that is where someone who has just been handed
	 * a camera is already looking.
	 *
	 * The door count is derived rather than typed in, for the same reason.
	 */
	const doors = PORTALS.length;

	/**
	 * Set when the corridor is being played in a rail tile rather than on the
	 * big screen. The readouts are sized in rem against a full window; at a
	 * fifth of the size they would cover the corridor they are decorating, so
	 * the tile keeps the one part that is actually useful — the crosshair.
	 */
	let { compact = false }: { compact?: boolean } = $props();
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
	<!-- Crosshair, on the vanishing point. -->
	<svg
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		width={compact ? 20 : 34}
		height={compact ? 20 : 34}
		viewBox="0 0 34 34"
		fill="none"
	>
		<g stroke="var(--color-ink)" stroke-width="2" stroke-linecap="round" opacity="0.8">
			<line x1="17" y1="2" x2="17" y2="10" />
			<line x1="17" y1="24" x2="17" y2="32" />
			<line x1="2" y1="17" x2="10" y2="17" />
			<line x1="24" y1="17" x2="32" y2="17" />
		</g>
	</svg>

	{#if !compact}
		<div class="hud-chip absolute top-3 left-3">
			<span class="hud-dot"></span>
			SECTOR C · MAIN CORRIDOR
		</div>

		<div class="hud-optional absolute right-3 bottom-3 flex flex-col items-end gap-1">
			<span class="hud-label">DOORS</span>
			<div class="hud-readout hud-readout-right">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 21h18" />
					<path d="M6 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17" />
					<circle cx="13" cy="12" r="1" fill="currentColor" />
				</svg>
				<span class="hud-value">{doors}</span>
			</div>
		</div>

		<!-- Pointer lock hands the camera the keyboard, so this is the one
		     readout a visitor actually needs — and the way back out, which is
		     the other thing a locked pointer has to tell you. -->
		<div class="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
			<span class="hud-label">MOVE</span>
			<div class="flex flex-col items-center gap-1.5">
				<kbd class="hud-key">&#8593;</kbd>
				<div class="flex gap-1.5">
					<kbd class="hud-key">&#8592;</kbd>
					<kbd class="hud-key">&#8595;</kbd>
					<kbd class="hud-key">&#8594;</kbd>
				</div>
			</div>
			<span class="hud-note">PRESS ESC TO PAUSE</span>
		</div>
	{/if}
</div>

<style>
	/* The HUD sits on top of a render that any theme can recolour, so it
	   carries its own plate rather than trusting contrast with the scene. */
	.hud-label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.22em;
		color: var(--color-warn);
	}

	.hud-readout {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.7rem;
		color: var(--color-warn);
		background-color: color-mix(in srgb, var(--color-bg-deep) 62%, transparent);
		border-left: 3px solid var(--color-warn);
	}

	.hud-readout-right {
		border-left: none;
		border-right: 3px solid var(--color-warn);
	}

	/* Big enough to read at a glance from the middle of the screen: this is
	   the one thing on the HUD a visitor has to act on, and it was sized for a
	   corner it no longer sits in. */
	.hud-key {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 46px;
		height: 46px;
		font-family: var(--font-mono);
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-warn);
		background-color: color-mix(in srgb, var(--color-bg-deep) 62%, transparent);
		border: 2px solid var(--color-warn);
	}

	/* Quieter than the keys above it: the same warn colour, let down towards
	   the render so it reads as a footnote to them rather than a fourth key. */
	.hud-note {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: color-mix(in srgb, var(--color-warn) 78%, transparent);
	}

	.hud-value {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 14px color-mix(in srgb, var(--color-warn) 70%, transparent);
	}

	.hud-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.65rem;
		font-family: var(--font-mono);
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-bg-deep) 62%, transparent);
		border-left: 3px solid var(--color-accent);
	}

	.hud-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--color-accent);
		box-shadow: 0 0 9px var(--color-accent);
	}

	/* In a small window the hand already covers the right-hand corner, and two
	   readouts crowd the left. Keep the one that anchors the joke. */
	@media (max-width: 900px) {
		.hud-optional {
			display: none;
		}
	}
</style>
