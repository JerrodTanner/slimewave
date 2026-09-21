<script lang="ts">
	import { goto } from '$app/navigation';
	import { hubMarkers } from '$lib/game/hubMarkers.svelte';
	import { stage } from '$lib/game/stage.svelte';

	// Labels for the 3D portals, drawn as HTML over the canvas and positioned
	// from the scene's own projection each frame. They are anchors, so the
	// portals are reachable by keyboard and readable by a screen reader.

	function enter(event: MouseEvent, href: string) {
		event.preventDefault();
		void stage.transitionTo(href, (target) => goto(target));
	}

	/** Nearer labels are larger, and distant ones fade rather than clutter. */
	function scaleFor(distance: number) {
		return Math.max(0.62, Math.min(1.25, 26 / distance));
	}

	function opacityFor(distance: number) {
		return Math.max(0.35, Math.min(1, 44 / distance));
	}
</script>

<div class="pointer-events-none fixed inset-0 z-10" aria-label="Portals">
	{#each hubMarkers.markers as marker (marker.href)}
		{#if marker.visible}
			<a
				href={marker.href}
				class="pointer-events-auto absolute block -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap"
				style:left="{marker.x * 100}%"
				style:top="{marker.y * 100}%"
				style:transform="translate(-50%, -50%) scale({scaleFor(marker.distance)})"
				style:opacity={opacityFor(marker.distance)}
				onclick={(e) => enter(e, marker.href)}
			>
				<span class="portal-label block">{marker.label}</span>
				<span class="portal-caption block">{marker.caption}</span>
			</a>
		{/if}
	{/each}
</div>

<style>
	/* The scene behind these can be any colour a theme asks for, so the label
	   carries its own plate rather than relying on contrast with the render. */
	.portal-label {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-bg-deep) 72%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
		padding: 0.15em 0.55em;
		line-height: 1.15;
	}

	.portal-caption {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-ink);
		background-color: color-mix(in srgb, var(--color-bg-deep) 62%, transparent);
		padding: 0.25em 0.6em;
		margin-top: 2px;
	}

	a:hover .portal-label,
	a:focus-visible .portal-label {
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
	}
</style>
