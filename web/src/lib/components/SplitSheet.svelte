<script lang="ts">
	/**
	 * A work sample split down the middle: two halves, each a problem, three
	 * steps with an icon apiece, and the result at the foot. For a row that is
	 * two small things side by side, where the five-step WorkSheet would be
	 * too much. A half can carry a before-and-after `sample` table, and can
	 * leave out the big `stat` when its point is not a number.
	 *
	 * Same printed stock as WorkSheet, and outside the theme tokens for the
	 * same reason: it is a leave-behind and must read the same under every
	 * theme. The halves stack once the sheet is too narrow to split.
	 */
	export interface Half {
		eyebrow: string;
		title: string;
		problem: string;
		/** `icon` is stroked `d` strings on a 24×24 grid, the doorIcons convention. */
		steps: { name: string; line: string; icon: string[] }[];
		/** `typos` sets the left column as the raw, mis-typed input. */
		sample?: { from: string; to: string; rows: [string, string][]; typos?: boolean };
		stat?: string;
		unit?: string;
		result: string;
	}

	let { halves }: { halves: Half[] } = $props();
</script>

<div class="sheet">
	{#each halves as half (half.title)}
		<section class="half">
			<p class="eyebrow">{half.eyebrow}</p>
			<h3 class="title">{half.title}</h3>
			<p class="problem">{half.problem}</p>

			<ol class="steps">
				{#each half.steps as step (step.name)}
					<li>
						<span class="icon">
							<svg viewBox="0 0 24 24" aria-hidden="true">
								{#each step.icon as d (d)}<path {d} />{/each}
							</svg>
						</span>
						<span><strong>{step.name}.</strong> {step.line}</span>
					</li>
				{/each}
			</ol>

			{#if half.sample}
				<table class="sample">
					<thead>
						<tr><th scope="col">{half.sample.from}</th><th scope="col">{half.sample.to}</th></tr>
					</thead>
					<tbody>
						{#each half.sample.rows as [raw, clean] (raw)}
							<tr><td class:raw={half.sample.typos}>{raw}</td><td>{clean}</td></tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<span></span>
			{/if}

			{#if half.stat}
				<p class="stat"><span class="figure">{half.stat}</span> {half.unit}</p>
			{:else}
				<span></span>
			{/if}
			<p class="result" class:alone={!half.stat}>{half.result}</p>
		</section>
	{/each}
</div>

<style>
	/* The stock: #F6F1E7 paper, #1C1A17 ink, #4C463C body, #8A7F6E small
	   type, #D9D0BF rules, and teal (#17564F) for the numbers that matter. */
	.sheet {
		container-type: inline-size;
		display: grid;
		grid-template-columns: 1fr;
		padding: clamp(0.8rem, 1.8cqw, 2.25rem);
		background-color: #F6F1E7;
		color: #1C1A17;
		font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.5;
	}

	/* Stacked, the halves are divided by a rule across. */
	.half + .half {
		border-top: 1px solid #1C1A17;
	}

	/* Split down the middle by a single rule, once there is room for two. */
	@container (min-width: 44rem) {
		.sheet {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.half + .half {
			border-top: 0;
			border-left: 1px solid #1C1A17;
		}
	}

	/* Each half takes its seven slots (eyebrow, title, problem, steps,
	   sample, stat, result) from rows the two halves share, so every part
	   lines up across the split, closing line and its rule included,
	   whichever half runs longer or leaves a slot empty. */
	.half {
		display: grid;
		grid-row: span 7;
		grid-template-rows: subgrid;
		row-gap: 0;
		padding: clamp(1rem, 2cqw, 2.5rem);
	}

	.eyebrow {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
	}

	.title,
	.figure {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-weight: 700;
	}

	.eyebrow {
		margin: 0;
		font-size: clamp(0.625rem, 0.75cqw, 0.8125rem);
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: #8A7F6E;
	}

	.title {
		margin: 0.5rem 0 0;
		padding-bottom: clamp(0.7rem, 1cqw, 1rem);
		border-bottom: 3px solid #1C1A17;
		font-size: clamp(1.5rem, 2.6cqw, 2.5rem);
		line-height: 1.05;
		text-wrap: balance;
	}

	.problem {
		margin: clamp(0.8rem, 1.2cqw, 1.25rem) 0 0;
		font-size: clamp(0.9rem, 1cqw, 1.0625rem);
		color: #4C463C;
	}

	.steps {
		display: grid;
		gap: 0.75rem;
		margin: clamp(1.1rem, 1.8cqw, 1.75rem) 0 0;
		padding: 0;
		list-style: none;
	}

	.steps li {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		font-size: clamp(0.85rem, 0.95cqw, 1rem);
		color: #4C463C;
	}

	.steps strong {
		color: #1C1A17;
	}

	.icon {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background-color: #DCE6E2;
		color: #17564F;
	}

	.icon svg {
		width: 1.2rem;
		height: 1.2rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.9;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* A before-and-after table, for a half whose point is the data itself. */
	.sample {
		width: 100%;
		margin-top: clamp(1rem, 1.6cqw, 1.5rem);
		border-collapse: collapse;
		font-size: clamp(0.8rem, 0.9cqw, 0.9375rem);
	}

	.sample th {
		padding: 0 0 0.35rem;
		border-bottom: 1px solid #D9D0BF;
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.75em;
		font-weight: 400;
		letter-spacing: 0.12em;
		text-align: left;
		text-transform: uppercase;
		color: #6E6558;
	}

	.sample td {
		padding: 0.3rem 0;
		border-bottom: 1px solid #EDE6D9;
		color: #1C1A17;
	}

	.sample .raw {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.9em;
		color: #9E2B20;
	}

	.stat {
		align-self: end;
		margin: 0;
		padding-top: clamp(1.25rem, 2cqw, 2rem);
		font-size: clamp(0.85rem, 1cqw, 1rem);
		color: #4C463C;
	}

	.figure {
		display: block;
		font-size: clamp(1.75rem, 3cqw, 2.75rem);
		line-height: 1;
		color: #17564F;
	}

	.result {
		margin: 0.5rem 0 0;
		padding-top: 0.5rem;
		border-top: 1px solid #D9D0BF;
		font-size: clamp(0.8rem, 0.85cqw, 0.9375rem);
		color: #6E6558;
	}

	/* With no number above it, the line carries the half's point in teal. */
	.result.alone {
		color: #17564F;
	}
</style>
