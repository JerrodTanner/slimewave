<script lang="ts">
	import { JOBS } from '$lib/content/jobs';
	import { workMenu } from '$lib/state/workMenu.svelte';

	/**
	 * The work samples, stacked under the corridor in the window's own scroll:
	 * one per time saver in lib/content/jobs, in the same order as the rows on
	 * the pitch tile, keyed by the row's name, which is what the tile asks for.
	 *
	 * A sample is a sheet that carries its own masthead, so nothing of the
	 * site's own type goes above it: any line there reads as a second,
	 * competing headline. The title is for the accessible name only.
	 */
	const WORK = JOBS.filter((job) => job.infographic).map((job) => ({
		key: job.name,
		title: job.name,
		body: job.infographic!
	}));

	/** Each sample's section, so a request from the pitch tile can be answered. */
	const sections: Record<string, HTMLElement> = $state({});

	// Clearing the request is what makes it a request rather than a selection:
	// the same row asked twice scrolls twice. Writing the state this effect
	// reads settles on the next run, because a null request returns before it
	// can write again.
	$effect(() => {
		const key = workMenu.request;
		if (!key) return;
		sections[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		workMenu.clear();
	});
</script>

{#each WORK as item (item.key)}
	{@const Body = item.body}
	<section class="item" id="work-{item.key}" aria-label={item.title} bind:this={sections[item.key]}>
		<Body />
	</section>
{/each}

<style>
	/* Rides up over the corridor, which is sticky behind it, so a sheet has to
	   be in the layer above rather than under the screen it scrolls across. */
	.item {
		position: relative;
		z-index: 1;
	}

	/* Two sheets are divided by a rule rather than by air: neither has a margin
	   to float on, because both run out to the window's own edge. */
	.item + .item {
		border-top: 1px solid var(--color-line);
	}
</style>
