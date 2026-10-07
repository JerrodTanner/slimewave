<script lang="ts">
	import { DESIGNS as PAGES } from '$lib/content/designs';

	/**
	 * The UI/UX row's work sample: a gallery of pages, each with what it was
	 * designed to do. The pages are in lib/content/designs, shared with the
	 * "View sample pages" dialog on /plan.
	 *
	 * Same printed stock as the other sheets, outside the theme tokens for the
	 * same reason. Arrows, the arrow keys and the thumbnail strip all move
	 * through it; the description under the picture is the point.
	 */

	let at = $state(0);
	const page = $derived(PAGES[at]);

	/** The thumbnail strip, kept scrolled so the current page is in view. */
	let strip = $state<HTMLElement | null>(null);

	// Scrolls the strip itself rather than calling scrollIntoView, which would
	// also move the page.
	$effect(() => {
		const thumb = strip?.children[at] as HTMLElement | undefined;
		if (!strip || !thumb) return;
		strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2, behavior: 'smooth' });
	});

	function step(by: number) {
		at = (at + by + PAGES.length) % PAGES.length;
	}

	function keys(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') step(-1);
		else if (e.key === 'ArrowRight') step(1);
	}
</script>

<div class="sheet">
	<p class="eyebrow">UI / UX design</p>
	<h3 class="title">Pages designed for the people using them</h3>

	<!-- Focusable so the arrow keys work once a reader has clicked into it;
	     the buttons stay the way through for everyone else. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div class="stage" tabindex="0" role="group" aria-roledescription="gallery" aria-label="Design examples" onkeydown={keys}>
		<button type="button" class="arrow" aria-label="Previous page" onclick={() => step(-1)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
		</button>

		<figure class="frame">
			<img src={page.src} alt="{page.project}: {page.title}" />
		</figure>

		<button type="button" class="arrow" aria-label="Next page" onclick={() => step(1)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
		</button>
	</div>

	<div class="caption" aria-live="polite">
		<p class="where"><span>{page.project}</span><span class="count">{at + 1} / {PAGES.length}</span></p>
		<h4 class="pagetitle">{page.title}</h4>
		<p class="about">{page.about}</p>
	</div>

	<div class="thumbs" bind:this={strip}>
		{#each PAGES as p, i (p.src)}
			<button type="button" class="thumb" class:on={i === at} aria-label="{p.project}: {p.title}" aria-current={i === at} onclick={() => (at = i)}>
				<img src={p.src} alt="" loading="lazy" />
			</button>
		{/each}
	</div>
</div>

<style>
	/* The stock: #F6F1E7 paper, #1C1A17 ink, #4C463C body, #8A7F6E small
	   type, #D9D0BF rules, and teal (#17564F) for what is selected. */
	.sheet {
		container-type: inline-size;
		padding: clamp(0.8rem, 1.8cqw, 2.25rem);
		background-color: #F6F1E7;
		color: #1C1A17;
		font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.5;
	}

	.eyebrow,
	.where {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
	}

	.title,
	.pagetitle {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-weight: 700;
	}

	.eyebrow {
		margin: 0;
		font-size: clamp(0.625rem, 0.65cqw, 0.8125rem);
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: #8A7F6E;
	}

	.title {
		margin: clamp(0.5rem, 0.8cqw, 1rem) 0 0;
		padding-bottom: clamp(0.9rem, 1.4cqw, 1.75rem);
		border-bottom: 3px solid #1C1A17;
		font-size: clamp(1.75rem, 3.1cqw, 3.25rem);
		line-height: 1.02;
		letter-spacing: -0.015em;
		text-wrap: balance;
	}

	/* --- the picture, between its arrows ----------------------------------- */
	.stage {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: clamp(0.5rem, 1.2cqw, 1.25rem);
		margin-top: clamp(1.25rem, 2cqw, 2rem);
		border-radius: 6px;
	}

	.stage:focus-visible {
		outline: 2px solid #17564F;
		outline-offset: 6px;
	}

	/* Every page sits in the same frame, whatever its own proportions. */
	.frame {
		margin: 0;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border: 1px solid #C9BFAC;
		border-radius: 6px;
		background-color: #1C1A17;
		box-shadow: 0 10px 28px rgba(28, 26, 23, 0.15);
	}

	.frame img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.arrow {
		display: grid;
		place-items: center;
		width: clamp(2.25rem, 3cqw, 3rem);
		height: clamp(2.25rem, 3cqw, 3rem);
		border: 1px solid #C9BFAC;
		border-radius: 50%;
		background-color: #FFFFFF;
		color: #1C1A17;
		cursor: pointer;
	}

	.arrow:hover {
		border-color: #17564F;
		background-color: #17564F;
		color: #F6F1E7;
	}

	.arrow svg {
		width: 55%;
		height: 55%;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* --- what the page is for ---------------------------------------------- */
	.caption {
		max-width: 62rem;
		margin: clamp(1rem, 1.6cqw, 1.5rem) auto 0;
		text-align: center;
	}

	.where {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin: 0;
		font-size: clamp(0.625rem, 0.7cqw, 0.8125rem);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #17564F;
	}

	.count {
		color: #8A7F6E;
	}

	.pagetitle {
		margin: 0.35rem 0 0;
		font-size: clamp(1.25rem, 1.8cqw, 2rem);
		line-height: 1.15;
	}

	.about {
		margin: 0.5rem auto 0;
		max-width: 60ch;
		font-size: clamp(0.9rem, 1cqw, 1.0625rem);
		color: #4C463C;
	}

	/* --- every page at a glance -------------------------------------------- */
	.thumbs {
		position: relative;
		display: flex;
		gap: 0.6rem;
		margin-top: clamp(1.25rem, 2cqw, 2rem);
		padding: 0.5rem 0.25rem 0.75rem;
		overflow-x: auto;
		border-top: 1px solid #D9D0BF;
	}

	.thumb {
		flex: 0 0 auto;
		width: clamp(5.5rem, 9cqw, 8rem);
		aspect-ratio: 16 / 9;
		padding: 0;
		overflow: hidden;
		border: 2px solid transparent;
		border-radius: 4px;
		background-color: #1C1A17;
		opacity: 0.6;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.thumb:hover {
		opacity: 1;
	}

	.thumb.on {
		border-color: #17564F;
		opacity: 1;
	}

	.thumb img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
	}

	@media (prefers-reduced-motion: reduce) {
		.thumb {
			transition: none;
		}
	}
</style>
