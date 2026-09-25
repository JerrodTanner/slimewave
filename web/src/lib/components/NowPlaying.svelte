<script lang="ts">
	import { coverOf, player, publishMediaSession } from '$lib/state/player.svelte';

	// The <audio> element is created here, in the shell, for the same reason
	// the canvas is: a routed page that owned it would stop the music every
	// time you clicked a link. The controls live elsewhere — the Media page
	// draws its own, and every other page wears MiniPlayer in its header.
	let audioEl: HTMLAudioElement;

	$effect(() => {
		if (audioEl) player.attach(audioEl);
	});

	$effect(() => {
		publishMediaSession(player.current, coverOf(player.current) ?? undefined);
	});
</script>

<audio bind:this={audioEl} preload="metadata"></audio>
