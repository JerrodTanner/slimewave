<script lang="ts">
	import { PORTALS } from '$lib/game/portals';

	/**
	 * The suit readout, drawn over the corridor.
	 *
	 * It is decoration, not instrumentation: there is no health to lose on a
	 * personal site. The one number that means anything is the door count,
	 * which is why it is derived rather than typed in.
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

		<div class="absolute bottom-3 left-3 flex items-end gap-3">
			<div class="flex flex-col gap-1">
				<span class="hud-label">HEALTH</span>
				<div class="hud-readout">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
					</svg>
					<span class="hud-value">100</span>
				</div>
			</div>
			<div class="hud-optional flex flex-col gap-1">
				<span class="hud-label">SUIT</span>
				<div class="hud-readout">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2 4 5v7c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5z" />
					</svg>
					<span class="hud-value">100</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* The HUD sits on top of a render that any theme can recolour, so it
	   carries its own plate rather than trusting contrast with the scene. */
	.hud-label {
		font-family: var(--font-mono);
		font-size: 0.5625rem;
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
