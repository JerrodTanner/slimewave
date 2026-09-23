<script lang="ts">
	import { PORTAL } from '$lib/game/portals';

	/**
	 * The one sentence that says what this place does, with both halves wired
	 * to the doors that do them — so the copy is navigation as well as copy.
	 *
	 * It sits in the header card, which the hub and the flat pages both wear,
	 * so it lives here rather than in either of them. The hub hands in its own
	 * `select` to fade the corridor before the route changes; everywhere else
	 * the links are ordinary links and the prop is left off.
	 */
	interface Props {
		select?: (event: MouseEvent, href: string) => void;
	}

	let { select }: Props = $props();
</script>

<p class="mission">
	This site functions as a place to
	<a href={PORTAL.plan.href} onclick={(e) => select?.(e, PORTAL.plan.href)}
		>intake business inquiries</a
	> and provide an
	<a href={PORTAL.resume.href} onclick={(e) => select?.(e, PORTAL.resume.href)}
		>interactive portfolio</a
	>
</p>

<style>
	.mission {
		flex: 1 1 auto;
		min-width: 0;
		font-size: 1.1875rem;
		line-height: 1.4;
		color: var(--color-ink);
	}

	/* One line, because the sentence is a claim rather than a paragraph.
	   Only where there is room for one: below this the header has already
	   stacked, and holding the line there would push the page sideways
	   instead of just reading badly. */
	@media (min-width: 80rem) {
		.mission {
			white-space: nowrap;
		}
	}

	.mission a {
		color: var(--color-accent);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}

	.mission a:hover {
		color: var(--color-accent-2);
	}
</style>
