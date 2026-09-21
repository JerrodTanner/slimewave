<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		lede?: string;
		/** Rendered on the right of the header row. */
		actions?: Snippet;
		children: Snippet;
	}

	let { title, lede, actions, children }: Props = $props();
</script>

<!-- Bottom padding leaves room for the persistent player bar. -->
<div class="mx-auto w-full max-w-6xl px-4 pt-10 pb-32 sm:px-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-4xl sm:text-5xl">{title}</h1>
			{#if lede}
				<p class="text-muted mt-3 max-w-2xl text-sm leading-relaxed">{lede}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex items-center gap-2">{@render actions()}</div>
		{/if}
	</div>

	<div class="rule mt-6 pt-6">
		{@render children()}
	</div>
</div>
