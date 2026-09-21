<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';

	// Only the hub is resident in the engine all the time. Everything listed
	// here is built on entry and released on exit, sharing the same WebGL
	// context rather than opening a new one.
	const GAMES = [
		{
			id: 'slime-run',
			name: 'Slime Run',
			blurb:
				'Forty-five seconds, one arena, seven orbs that keep moving. Roll into them. Best score is kept in your browser.',
			controls: 'WASD or arrows to move · drag to orbit · space to start'
		}
	];
</script>

<svelte:head>
	<title>Arcade — slimewave</title>
</svelte:head>

<PageShell
	title="Arcade"
	lede="Small games that share the hub's engine. Leaving one frees its meshes; the hub behind it keeps running either way."
>
	<ul class="grid gap-px sm:grid-cols-2">
		{#each GAMES as game (game.id)}
			<li class="panel flex flex-col p-5">
				<h2 class="text-2xl">{game.name}</h2>
				<p class="text-muted mt-2 flex-1 text-sm leading-relaxed">{game.blurb}</p>
				<p class="label mt-4">{game.controls}</p>
				<a class="btn-accent mt-4 self-start" href="/arcade/{game.id}">play</a>
			</li>
		{/each}
		<li class="panel flex flex-col justify-center p-5">
			<p class="text-muted text-sm leading-relaxed">
				More to come. The scene contract is small — a palette hook, an interactivity hook, and
				an update function — so adding one is mostly writing the scene.
			</p>
		</li>
	</ul>
</PageShell>
