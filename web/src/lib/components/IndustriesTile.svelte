<script lang="ts">
	/**
	 * The pitch in one tile: the same kind of work, done in three industries.
	 *
	 * Icons are stroked `d` strings on a 24×24 grid, the same convention as
	 * lib/game/doorIcons.ts, so they sit beside the door glyphs without looking
	 * borrowed. The figures come from the resume; change them there first.
	 */
	const INDUSTRIES = [
		{
			name: 'Healthcare',
			tool: 'Epic · Radiant',
			proof: 'Parsed CT data streams to catch critically tagged findings, like strokes, and alert doctors right away.',
			icon: [
				'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
				'M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27'
			]
		},
		{
			name: 'Finance ops',
			tool: 'Python · SQL',
			proof: 'Reconciliation tools that save HR 20 hours a week and catch $12k a month in 401k errors.',
			icon: [
				'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z',
				'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8',
				'M12 17.5v-11'
			]
		},
		{
			name: 'Hospitality',
			tool: 'C# · SQL Server',
			proof: 'Booking features for sales reps, and backend queries made up to 10× faster.',
			icon: [
				'M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z',
				'M20 16a8 8 0 1 0-16 0',
				'M12 4v4',
				'M10 4h4'
			]
		}
	];

	// Same inbox as the brief on /plan. A mail draft, so nothing is posted or stored.
	const CONTACT = 'jerrod@jerrodtanner.com';

	let message = $state('');
	const mailto = $derived(
		`mailto:${CONTACT}?subject=${encodeURIComponent('Inquiry from jerrodtanner.com')}&body=${encodeURIComponent(message.trim())}`
	);
</script>

{#snippet glyph(paths: string[], size: number)}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#each paths as d (d)}<path {d} />{/each}
	</svg>
{/snippet}

<section class="tile" aria-labelledby="industries-head">
	<span class="cap"></span>

	<p class="kicker">BACK-OFFICE AUTOMATION</p>
	<h2 id="industries-head" class="head">Experience automating back‑office work in three industries</h2>

	<ul class="rows">
		{#each INDUSTRIES as row (row.name)}
			<li class="row">
				<span class="icon">{@render glyph(row.icon, 22)}</span>
				<div class="min-w-0">
					<div class="rowhead">
						<span class="name">{row.name}</span>
						<span class="tool">{row.tool}</span>
					</div>
					<p class="proof">{row.proof}</p>
				</div>
			</li>
		{/each}
	</ul>

	<div class="foot">
		<label class="text-muted" for="industries-message">Your spreadsheets, reports and handoffs are next.</label>
		<textarea
			class="field message"
			id="industries-message"
			rows="2"
			placeholder="What would you like automated?"
			bind:value={message}
		></textarea>
		<div class="send">
			<a class="email" href="mailto:{CONTACT}">{CONTACT}</a>
			<a
			class="btn-accent cta"
			class:pointer-events-none={!message.trim()}
			class:opacity-40={!message.trim()}
			aria-disabled={!message.trim()}
			href={mailto}
		>
			CONTACT ME
			{@render glyph(['M5 12h14', 'm13 6 6 6-6 6'], 14)}
		</a>
		</div>
	</div>
</section>

<style>
	/* Ruled like the door tiles and the brief's sections: hairline box on
	   raised stock, checker cap down the left edge. */
	.tile {
		position: relative;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
		padding: 1.1rem 1.2rem 1.2rem 2rem;
		container-type: inline-size;
		/* Fills a fixed-height parent (the hub column), rows sharing the height. */
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow-y: auto;
	}

	.cap {
		position: absolute;
		left: 0;
		top: 0;
		width: 14px;
		height: 100%;
		background-image: repeating-conic-gradient(
			color-mix(in srgb, var(--color-accent) 55%, transparent) 0% 25%,
			transparent 0% 50%
		);
		background-size: 6px 6px;
	}

	.kicker,
	.tool {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.12em;
		color: var(--color-muted);
	}

	.head {
		margin: 0.3rem 0 0.8rem;
		font-size: 1.3rem;
		line-height: 1.2;
		text-wrap: balance;
		color: var(--color-ink);
	}

	.rows {
		flex: 1 1 auto;
		display: grid;
		grid-auto-rows: 1fr;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* Three across when there is room, stacked when there is not. */
	@container (min-width: 44rem) {
		.rows {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.8rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: var(--color-bg-deep);
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		width: 38px;
		height: 38px;
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
		border-radius: var(--radius-panel);
		background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
	}

	.rowhead {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.6rem;
	}

	.name {
		font-weight: 600;
		color: var(--color-ink);
	}

	.proof {
		margin: 0.3rem 0 0;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-muted);
	}

	.foot {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.8rem;
		font-size: 0.9375rem;
	}

	.message {
		resize: none;
		line-height: 1.45;
	}

	.send {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 0.75rem;
	}

	.email {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.cta {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
