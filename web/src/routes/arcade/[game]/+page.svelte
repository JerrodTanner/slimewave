<script lang="ts">
	import { page } from '$app/state';
	import { arcade } from '$lib/game/arcadeState.svelte';
	import { SLIME_RUN_DURATION } from '$lib/game/slimeRunScene';

	const gameId = $derived(page.params.game ?? '');
	const known = $derived(gameId === 'slime-run');

	// The scene itself is mounted by the shell's stage; this page is only the
	// HUD over it, which is why leaving does not cost a WebGL context.
</script>

<svelte:head>
	<title>{known ? 'Slime Run' : 'Arcade'} — slimewave</title>
</svelte:head>

<div class="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
	<div class="flex items-start justify-between gap-3">
		<div class="panel pointer-events-auto px-4 py-3">
			<h1 class="text-xl">{known ? 'Slime Run' : 'Unknown game'}</h1>
			{#if known}
				<p class="text-muted mt-1 font-mono text-[11px]">
					score <span style:color="var(--color-accent)">{arcade.score}</span>
					· best {arcade.best}
					{#if arcade.running}
						· <span class="tabular-nums">{arcade.timeLeft.toFixed(1)}s</span>
					{/if}
				</p>
			{/if}
		</div>

		<div class="panel pointer-events-auto flex gap-1 px-2 py-2">
			<a class="btn-ghost" href="/arcade">← arcade</a>
			<a class="btn-ghost" href="/">hub</a>
		</div>
	</div>

	{#if known && !arcade.running}
		<div class="flex justify-center">
			<div class="panel-raised pointer-events-auto max-w-md px-5 py-4 text-center">
				{#if arcade.lastResult}
					<p class="text-2xl">
						{arcade.lastResult.score}
						{arcade.lastResult.score === 1 ? 'orb' : 'orbs'}
					</p>
					<p class="label mt-1">
						{arcade.lastResult.best ? 'new best' : `best is ${arcade.best}`}
					</p>
				{:else}
					<p class="text-muted text-sm leading-relaxed">
						{SLIME_RUN_DURATION} seconds. Roll into the orbs. They move when you take one.
					</p>
				{/if}
				<button
					type="button"
					class="btn-accent mt-4"
					onclick={() => {
						arcade.begin(SLIME_RUN_DURATION);
					}}
				>
					{arcade.lastResult ? 'run it back' : 'start'}
				</button>
				<p class="label mt-3">WASD or arrows · drag to orbit · space also starts</p>
			</div>
		</div>
	{:else if !known}
		<div class="flex justify-center">
			<div class="panel-raised pointer-events-auto px-5 py-4 text-center">
				<p class="text-muted text-sm">No game with that name.</p>
				<a class="btn-accent mt-3 inline-block" href="/arcade">back to the arcade</a>
			</div>
		</div>
	{:else}
		<div></div>
	{/if}
</div>
