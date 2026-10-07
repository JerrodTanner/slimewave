<script lang="ts">
	import { JOBS, type Stroke } from '$lib/content/jobs';
	import { workMenu } from '$lib/state/workMenu.svelte';
	import { CONTACT, drafts } from '$lib/contact';
	import SendMenu from './SendMenu.svelte';

	/**
	 * The pitch in one tile, under Clean and Homey: the same time savers as
	 * the rows on the Bold front page (JOBS, in lib/content/jobs), then a
	 * message box and the way to send it.
	 *
	 * Every row is a way in as well as a claim: clicking it scrolls the window
	 * straight down to that job's work sample (WorkPanel), asking by the
	 * job's name. Icons are the rows' own, stroked on the 24 grid that
	 * lib/game/doorIcons uses, so they sit beside the door glyphs.
	 */
	const strokeD = (stroke: Stroke) => (typeof stroke === 'string' ? stroke : stroke.d);

	// Same inbox as the brief on /plan (lib/contact). A draft, so nothing is
	// posted or stored.
	let message = $state('');
	const draft = $derived(drafts('Inquiry from jerrodtanner.com', message.trim()));
</script>

{#snippet glyph(paths: Stroke[], size: number)}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#each paths as stroke, i (i)}
			<path d={strokeD(stroke)} class:body={typeof stroke !== 'string' && stroke.tone === 'body'} />
		{/each}
	</svg>
{/snippet}

<section class="tile" aria-labelledby="industries-head">
	<span class="cap"></span>

	<p class="kicker">BACK-OFFICE AUTOMATION</p>
	<h2 id="industries-head" class="head">Time savers &amp; workflow upgrades</h2>

	<ul class="rows">
		{#each JOBS as job (job.name)}
			<li class="row" class:row-linked={job.infographic}>
				<!-- The button is stretched over the whole row, the same way a door
				     on the rail carries its cover, so the claim itself is the
				     target rather than a "see more" tacked on the end. -->
				{#if job.infographic}
					<button
						type="button"
						class="rowcover"
						aria-label="See the {job.name.toLowerCase()} example"
						onclick={() => workMenu.show(job.name)}
					></button>
				{/if}
				<span class="icon">{@render glyph(job.icon, 22)}</span>
				<div class="min-w-0 flex-1">
					<div class="rowhead">
						<span class="name">{job.name}</span>
						<span class="tool">{job.tag}</span>
					</div>
					<p class="proof">{job.proof}</p>
				</div>
				{#if job.infographic}
					<span class="go" aria-hidden="true">{@render glyph(['M5 12h14', 'm13 6 6 6-6 6'], 14)}</span>
				{/if}
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
			<SendMenu drafts={draft} disabled={!message.trim()}>
				{#snippet trigger(props)}
					<button class="btn-accent cta" class:opacity-40={!message.trim()} {...props}>
						CONTACT ME
						{@render glyph(['M5 12h14', 'm13 6 6 6-6 6'], 14)}
					</button>
				{/snippet}
			</SendMenu>
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
		/* Fills a fixed-height parent (the hub column), scrolling past it. */
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
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.8rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: var(--color-bg-deep);
	}

	/* The cover over a row that has a sheet behind it (see the markup). */
	.rowcover {
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: var(--radius-panel);
		cursor: pointer;
	}

	.rowcover:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.row-linked:hover {
		border-color: color-mix(in srgb, var(--color-accent) 55%, var(--color-line));
		background-color: var(--color-surface);
	}

	/* The arrow only says which way the row goes, so it stays quiet until the
	   row is under the pointer. */
	.go {
		flex: 0 0 auto;
		color: var(--color-accent);
		opacity: 0.45;
		transition: opacity 120ms ease;
	}

	.row-linked:hover .go,
	.row-linked:has(.rowcover:focus-visible) .go {
		opacity: 1;
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

	.icon .body {
		fill: color-mix(in srgb, currentColor 16%, transparent);
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

	/* --- the Homey style -------------------------------------------------
	   The tile is a cream glazed panel set in a ring of majolica. The ring is
	   a border-image of a four-by-four checker of the two tiles, which is what
	   keeps them alternating all the way round whatever the panel's size. */
	:global([data-style='homey']) .tile {
		border-style: solid;
		border-color: transparent;
		border-width: 26px;
		border-image: var(--homey-ring) 128 / 26px round;
		border-radius: 0;
		padding: 0.65rem 0.9rem 0.7rem;
		background: linear-gradient(170deg, #f8f2e2, #ebe3ce);
		box-shadow: 0 10px 24px rgb(0 0 0 / 0.4);
	}

	:global([data-style='homey']) .cap {
		display: none;
	}

	:global([data-style='homey']) .kicker,
	:global([data-style='homey']) .tool {
		font-family: var(--font-display);
		font-variant: small-caps;
		letter-spacing: 0.16em;
	}

	/* Tighter than Clean, so the whole pitch fits the panel without a scroll:
	   the ring takes room Clean's hairline does not. */
	:global([data-style='homey']) .head {
		margin: 0.15rem 0 0.45rem;
		font-size: 1.15rem;
	}

	:global([data-style='homey']) .rows {
		gap: 0.35rem;
	}

	:global([data-style='homey']) .row {
		gap: 0.6rem;
		padding: 0.35rem 0.6rem;
		background-color: transparent;
		border-color: rgb(29 43 82 / 0.28);
	}

	:global([data-style='homey']) .proof {
		margin-top: 0.15rem;
		font-size: 0.8125rem;
		line-height: 1.35;
	}

	:global([data-style='homey']) .foot {
		gap: 0.35rem;
		margin-top: 0.5rem;
		font-size: 0.875rem;
	}

	:global([data-style='homey']) .message {
		padding-block: 0.4rem;
	}

	:global([data-style='homey']) .row-linked {
		border-color: rgb(29 43 82 / 0.5);
	}

	:global([data-style='homey']) .row-linked:hover {
		background-color: rgb(255 252 240 / 0.6);
	}

	:global([data-style='homey']) .icon {
		width: 28px;
		height: 28px;
		border: 0;
		background: none;
		color: var(--color-ink);
	}

	:global([data-style='homey']) .email {
		font-family: var(--font-body);
	}
</style>
