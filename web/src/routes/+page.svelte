<script lang="ts">
	import { goto } from '$app/navigation';
	import PortalLabels from '$lib/components/PortalLabels.svelte';
	import { PORTALS } from '$lib/game/portals';
	import { stage } from '$lib/game/stage.svelte';
	import { theme } from '$lib/theme/theme.svelte';
	import { THEMES } from '$lib/theme/themes';

	// The hub is the 3D scene; this page is only the HUD drawn over it.
	// Everything here is also reachable without touching the game, because
	// "walk into a portal" is a nice way in, not the only one.
	let showHelp = $state(true);

	const touch = $derived(
		typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
	);

	function enter(href: string) {
		void stage.transitionTo(href, (target) => goto(target));
	}
</script>

<svelte:head>
	<title>Jerrod Tanner — slimewave</title>
</svelte:head>

<PortalLabels />

<div class="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
	<div class="flex items-start justify-between gap-4">
		<div class="panel pointer-events-auto max-w-sm px-4 py-3">
			<h1 class="text-2xl sm:text-3xl">Jerrod Tanner</h1>
			<p class="text-muted mt-1.5 font-mono text-xs leading-relaxed">
				Go on the back, Svelte on the front, Babylon in the middle. Walk into a portal, or use
				the list.
			</p>
		</div>

		<div class="panel pointer-events-auto flex flex-wrap items-center gap-1 px-2 py-2">
			{#each THEMES as t (t.id)}
				<button
					type="button"
					class="flex gap-px p-1 transition-transform hover:scale-110"
					style:outline={t.id === theme.current ? '1px solid var(--color-accent)' : 'none'}
					title={t.name}
					aria-label={`Theme: ${t.name}`}
					onclick={() => theme.set(t.id)}
				>
					{#each t.swatch as color (color)}
						<span class="h-5 w-1.5" style:background-color={color}></span>
					{/each}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap items-end justify-between gap-3">
		<div class="panel pointer-events-auto flex flex-wrap gap-1 px-2 py-2">
			{#each PORTALS as portal (portal.href)}
				<button type="button" class="btn-ghost" onclick={() => enter(portal.href)}>
					{portal.label.toLowerCase()}
				</button>
			{/each}
			<a href="/login" class="btn-ghost">sign in</a>
		</div>

		{#if showHelp && !stage.unsupported}
			<div class="panel pointer-events-auto flex items-center gap-3 px-3 py-2">
				<p class="text-muted font-mono text-[11px] leading-relaxed">
					{#if touch}
						Drag to look. Tap a portal to go there.
					{:else}
						Click to look around · <kbd>W A S D</kbd> to walk · <kbd>Esc</kbd> to release the
						cursor. Walk into a portal.
					{/if}
				</p>
				<button
					type="button"
					class="text-muted shrink-0 font-mono text-xs"
					onclick={() => (showHelp = false)}
					aria-label="Dismiss controls"
				>
					✕
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	kbd {
		font-family: var(--font-mono);
		border: 1px solid var(--color-line-bright);
		border-radius: 2px;
		padding: 0 0.25em;
		color: var(--color-ink);
	}
</style>
