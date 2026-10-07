<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The printed sheet every work sample is set on: masthead, five numbered
	 * steps, a "what they see" mock-up, and the story behind it. A sample
	 * hands over its copy, its five drawings and the mock-up; the sheet does
	 * the layout, so the samples read as a set.
	 *
	 * Like the resume it sits outside the theme tokens on purpose: cream
	 * stock, ink, a sage-and-teal duotone for the drawings, serif headings
	 * over a sans body. It is a leave-behind shown inside the site and must
	 * look the same whichever theme is on. Each sample picks one accent for
	 * the steps that carry the point, passed in as `accent`.
	 *
	 * Type is sized in `cqw` between clamps, so the sheet re-typesets with the
	 * width it is given rather than shrinking to nothing; the five steps fall
	 * to two columns and then one the same way. The mock-up's own styles stay
	 * in the sample, which can lean on the same container and on `--hot`.
	 */
	interface Step {
		name: string;
		line: string;
		note: string;
		hot: boolean;
	}

	let {
		eyebrow,
		site,
		title,
		deck,
		steps,
		icon,
		accent,
		seenTitle,
		seen,
		story
	}: {
		eyebrow: string;
		/** A live address, linked at the end of the eyebrow. */
		site?: string;
		title: string;
		deck: string;
		steps: Step[];
		/** Draws step i's picture, on a 48 grid. */
		icon: Snippet<[number]>;
		/** The accent ink, and the paler rule it sits on. */
		accent: { ink: string; rule: string };
		seenTitle: string;
		seen: Snippet;
		/** "How it was done", one string per paragraph. */
		story: string[];
	} = $props();
</script>

<div class="sheet" style:--hot={accent.ink} style:--hot-rule={accent.rule}>
	<p class="eyebrow">
		{eyebrow}
		{#if site}
			· <a href={site} target="_blank" rel="noopener">{new URL(site).host}</a>
		{/if}
	</p>
	<h3 class="masthead">{title}</h3>

	<div class="rule-heavy"></div>

	<p class="deck">{deck}</p>

	<ol class="steps">
		{#each steps as step, i (step.name)}
			<li class="step">
				<p class="numeral" class:hot={step.hot}>{i + 1}</p>
				<div class="artbox">{@render icon(i)}</div>
				<h4 class="stepname" class:hot={step.hot}>{step.name}</h4>
				<p class="stepline">{step.line}</p>
				<p class="stepnote" class:hot={step.hot}>{step.note}</p>
			</li>
		{/each}
	</ol>

	<div class="rule-hair"></div>

	<h4 class="subhead">{seenTitle}</h4>

	<div class="seen">{@render seen()}</div>

	<div class="rule-hair"></div>

	<div class="story">
		<h4 class="storyhead">How it was done</h4>
		<div class="storycols">
			{#each story as paragraph, i (i)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</div>
</div>

<style>
	/* The stock: #F6F1E7 paper, #1C1A17 ink, #4C463C body, #8A7F6E and
	   #6E6558 for the small type, #D9D0BF rules. The one concession is the
	   typeface: the mockup's headings are Fraunces, but a site that ships as
	   one binary pulls no webfont, so this uses the wordmark's local serif. */
	.sheet {
		container-type: inline-size;
		/* Tight all round: the sheet is read inside a window rather than held
		   in a hand, so a printed margin only costs it room. */
		padding: clamp(0.8rem, 1.8cqw, 2.25rem);
		background-color: #F6F1E7;
		color: #1C1A17;
		font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.5;
	}

	.eyebrow,
	.stepnote {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
	}

	.masthead,
	.stepname,
	.subhead,
	.numeral,
	.storyhead {
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

	.eyebrow a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.eyebrow a:hover {
		color: var(--hot);
	}

	.masthead {
		margin: clamp(0.5rem, 0.8cqw, 1rem) 0 0;
		font-size: clamp(1.75rem, 3.1cqw, 3.875rem);
		line-height: 1.02;
		letter-spacing: -0.015em;
		text-wrap: balance;
	}

	.rule-heavy {
		height: 3px;
		margin: clamp(0.9rem, 1.4cqw, 1.75rem) 0 clamp(0.7rem, 1cqw, 1.25rem);
		background-color: #1C1A17;
	}

	.rule-hair {
		height: 1px;
		margin: clamp(1.1rem, 2.2cqw, 2.75rem) 0 clamp(0.9rem, 1.6cqw, 2rem);
		background-color: #1C1A17;
	}

	.deck {
		margin: 0;
		max-width: 66ch;
		font-size: clamp(0.9rem, 0.9cqw, 1.125rem);
		line-height: 1.5;
		color: #4C463C;
	}

	/* --- the five steps ---------------------------------------------------
	   Hairline rules between the columns: a border on every column but the
	   first gives the same lines at any column count. */
	.steps {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(1rem, 1.9cqw, 2.4rem);
		margin: clamp(1.4rem, 2.6cqw, 3.25rem) 0 0;
		padding: 0;
		list-style: none;
	}

	@container (min-width: 34rem) {
		.steps {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@container (min-width: 62rem) {
		.steps {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}

	/* A column, so the note can sink to the bottom: every note and its rule
	   then sit on one line across the row, however long the text above runs. */
	.step {
		display: flex;
		flex-direction: column;
		padding-left: clamp(0.9rem, 1.5cqw, 1.9rem);
		border-left: 1px solid #D9D0BF;
	}

	.step:first-child {
		padding-left: 0;
		border-left: 0;
	}

	.numeral {
		margin: 0;
		font-size: clamp(2rem, 3.1cqw, 3.875rem);
		line-height: 1;
	}

	.hot {
		color: var(--hot);
	}

	.artbox {
		margin-top: clamp(0.6rem, 0.9cqw, 1.15rem);
		height: clamp(3.5rem, 5.2cqw, 6.5rem);
		display: flex;
		align-items: center;
	}

	.artbox :global(svg) {
		width: clamp(3.5rem, 5.2cqw, 6.5rem);
		height: clamp(3.5rem, 5.2cqw, 6.5rem);
	}

	.stepname {
		margin: clamp(0.7rem, 1cqw, 1.25rem) 0 0;
		font-size: clamp(1.0625rem, 1.35cqw, 1.6875rem);
		line-height: 1.15;
	}

	.stepline {
		margin: clamp(0.4rem, 0.5cqw, 0.625rem) 0 clamp(0.6rem, 0.8cqw, 1rem);
		font-size: clamp(0.8125rem, 0.825cqw, 1.03rem);
		line-height: 1.55;
		color: #4C463C;
	}

	.stepnote {
		margin: auto 0 0;
		padding-top: clamp(0.4rem, 0.5cqw, 0.625rem);
		border-top: 1px solid #D9D0BF;
		font-size: clamp(0.5625rem, 0.6cqw, 0.75rem);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #6E6558;
	}

	.stepnote.hot {
		border-top-color: var(--hot-rule);
		color: var(--hot);
	}

	/* --- what they see ------------------------------------------------------ */
	.subhead {
		margin: 0 0 clamp(0.9rem, 1.4cqw, 1.75rem);
		font-size: clamp(1.25rem, 1.8cqw, 2.25rem);
		line-height: 1.1;
	}

	/* The mock-up, and a note beside it once there is room for one. */
	.seen {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(1.1rem, 2.4cqw, 3rem);
		align-items: start;
	}

	@container (min-width: 56rem) {
		.seen {
			grid-template-columns: minmax(0, 1320fr) minmax(0, 460fr);
			/* Wide enough for a pointer to sit in, rather than across the note. */
			gap: clamp(2rem, 4cqw, 5rem);
		}
	}

	/* --- the story --------------------------------------------------------- */
	.story {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(0.8rem, 1.5cqw, 1.9rem);
	}

	@container (min-width: 56rem) {
		.story {
			grid-template-columns: minmax(0, 320fr) minmax(0, 1440fr);
		}
	}

	.storyhead {
		margin: 0;
		font-size: clamp(1.0625rem, 1.2cqw, 1.5rem);
		line-height: 1.2;
	}

	.storycols {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(0.8rem, 1.5cqw, 1.9rem);
	}

	@container (min-width: 48rem) {
		.storycols {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.storycols p {
		margin: 0;
		font-size: clamp(0.8125rem, 0.85cqw, 1.0625rem);
		line-height: 1.55;
		color: #4C463C;
	}
</style>
