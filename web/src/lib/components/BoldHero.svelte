<script lang="ts">
	import type { Component } from 'svelte';
	import CriticalResultsBoard from './CriticalResultsBoard.svelte';
	import LogKingBoard from './LogKingBoard.svelte';

	/**
	 * The Bold front page, above the tile and the doors: one huge line, then
	 * the jobs a business would hand over, on a band of camo.
	 *
	 * The page is Apple-calm and the band is the one loud thing. The camo is
	 * drawn here by hand (original work, so nothing to credit) as a few large
	 * shapes in close tones, sliced to cover rather than tiled, so it never
	 * reads as wallpaper.
	 */
	let { select }: { select: (event: MouseEvent | null, href: string) => void } = $props();

	/** A plain stroke, or the icon's body (tinted) or its accent (solid pop). */
	type Stroke = string | { d: string; tone: 'body' | 'pop' };

	interface Job {
		name: string;
		proof: string;
		tag: 'Reporting' | 'Databases' | 'Workflows';
		icon: Stroke[];
		/** A work sample that drawers out under the row; the proof becomes its subheader. */
		infographic?: Component;
	}

	const JOBS: Job[] = [
		{
			name: 'Customer history & automated billing',
			proof: 'Example: Tracking tenant and business-name history across leased office space, and automating the rent invoices.',
			tag: 'Databases',
			icon: [
				{ d: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', tone: 'body' },
				'M11 10a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
				'M5.5 16.5a3.5 3.5 0 0 1 7 0',
				'M15 9h4',
				'M15 12.5h4',
				'M15 16h2.5'
			]
		},
		{
			name: 'Reconciliation & error checks',
			proof: 'Example: Catching 401k matching errors, and reconciling insurance benefits for HR.',
			tag: 'Reporting',
			icon: [
				{ d: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
				'm7.5 8 1.5 1.5L12 6.5',
				'M14 8h3',
				'm7.5 13 1.5 1.5 3-3',
				'M14 13h3',
				'm7.5 18 1.5 1.5 3-3',
				'M14 18h3'
			]
		},
		{
			name: 'Business & customer notifications',
			proof: 'Example: Flagging critical CT findings, like strokes, and alerting hospital staff right away inside their EHR.',
			tag: 'Workflows',
			infographic: CriticalResultsBoard,
			icon: [
				{ d: 'M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8', tone: 'body' },
				'M10.3 21a1.94 1.94 0 0 0 3.4 0',
				'M2 7.5a10 10 0 0 1 2.2-4.5',
				'M22 7.5A10 10 0 0 0 19.8 3',
				{ d: 'M20.5 11a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0', tone: 'pop' }
			]
		},
		{
			name: 'Payment & expense labeling',
			proof: 'Example: Auto-labeling payment types, which saved accounts payable 10 hours a week.',
			tag: 'Workflows',
			icon: [
				{ d: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', tone: 'body' },
				'M2 7.5h20',
				'M5.5 11.5h4',
				{ d: 'M13 16h6l3 2.75-3 2.75h-6Z', tone: 'pop' }
			]
		},
		{
			name: 'KPI reporting at a glance',
			proof: 'Example: Building Epic SlicerDicer reports for department managers, doctors and nurses.',
			tag: 'Reporting',
			icon: [
				{ d: 'M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', tone: 'body' },
				'M2 7.5h20',
				'M11 14a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
				{ d: 'M8 11a3 3 0 0 1 3 3H8Z', tone: 'pop' },
				'M14.5 18v-3',
				'M18 18v-6'
			]
		},
		{
			name: 'Full-stack hosting, data tracking & styled reports',
			proof: 'Example: Building and hosting LogKing, which parses uploaded in-game activity logs into a database and serves them back as polished, shareable player performance reports.',
			tag: 'Reporting',
			infographic: LogKingBoard,
			icon: [
				{ d: 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
				'M7 7h6',
				'M7 11h8',
				'M7 15h4',
				{ d: 'M20 17.5a3 3 0 1 1-6 0a3 3 0 1 1 6 0', tone: 'pop' },
				'm19.2 19.7 2.3 2.3'
			]
		},
		{
			name: 'Moving between systems',
			proof: "Example: Automating the order crosswalk for a hospital's move from Cerner to Epic.",
			tag: 'Databases',
			icon: [
				{ d: 'M2 6c0-1.1 1.6-2 3.5-2S9 4.9 9 6v12c0 1.1-1.6 2-3.5 2S2 19.1 2 18Z', tone: 'body' },
				'M2 6c0 1.1 1.6 2 3.5 2S9 7.1 9 6',
				'M15 6c0-1.1 1.6-2 3.5-2S22 4.9 22 6v12c0 1.1-1.6 2-3.5 2S15 19.1 15 18Z',
				'M15 6c0 1.1 1.6 2 3.5 2S22 7.1 22 6',
				'M10.5 10h3',
				'm12.5 8.5 1.5 1.5-1.5 1.5',
				'M13.5 15h-3',
				'm11.5 13.5-1.5 1.5 1.5 1.5'
			]
		}
	];

	// The same inbox and the same mail draft as the tile's contact box under
	// the other styles: nothing is posted or stored.
	const CONTACT = 'jerrod@jerrodtanner.com';

	let message = $state('');
	const mailto = $derived(
		`mailto:${CONTACT}?subject=${encodeURIComponent('Inquiry from jerrodtanner.com')}&body=${encodeURIComponent(message.trim())}`
	);

	/** The camo band, which the hint under the headline scrolls into view. */
	let band = $state<HTMLElement | null>(null);

	function showExamples() {
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		band?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
	}
</script>

{#snippet row(job: Job)}
	<span class="badge">
		<svg viewBox="0 0 24 24" aria-hidden="true">
			{#each job.icon as stroke, i (i)}
				{#if typeof stroke === 'string'}
					<path d={stroke} />
				{:else}
					<path d={stroke.d} class:body={stroke.tone === 'body'} class:pop={stroke.tone === 'pop'} />
				{/if}
			{/each}
		</svg>
	</span>
	<span class="words">
		<span class="name">{job.name}</span>
		<span class="proof">{job.proof}</span>
	</span>
	<span class="tag">{job.tag}</span>
{/snippet}

<section class="hero">
	<h1 class="headline"><span>Less busywork.</span><span class="soft">More business.</span></h1>
	<p class="sub">Digitize your operations, move more work, and leave the paperwork behind.</p>
	<button type="button" class="hint" onclick={showExamples}>↓ BROWSE SOME EXAMPLES</button>
</section>

<section class="band" aria-labelledby="bold-jobs" bind:this={band}>
	<svg class="camo" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
		<defs>
			<linearGradient id="bold-sheen" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="var(--camo-ink)" stop-opacity=".10" />
				<stop offset=".5" stop-color="var(--camo-ink)" stop-opacity="0" />
				<stop offset="1" stop-color="var(--camo-1)" stop-opacity=".6" />
			</linearGradient>
		</defs>
		<rect width="1400" height="900" fill="var(--camo-2)" />
		<path fill="var(--camo-1)" d="M-60 120C80 40 260 90 330 200S300 420 430 470 640 400 700 520 560 760 380 780 60 700-60 560Z" />
		<path fill="var(--camo-3)" d="M520 -40C680 -80 860 20 900 150S820 330 940 400 1180 360 1230 470 1100 640 960 610 760 520 700 400 460 260 450 140 460 -20 520 -40Z" />
		<path fill="var(--camo-1)" d="M1040 60C1180 0 1400 40 1460 160V520C1400 560 1300 520 1260 440S1120 360 1060 300 960 120 1040 60Z" />
		<path fill="var(--camo-3)" d="M120 820C200 700 380 690 480 760S640 860 760 820 980 700 1100 760 1300 900 1260 960H80C60 920 80 870 120 820Z" />
		<path fill="var(--camo-1)" d="M1180 640C1260 600 1400 620 1460 680V960H1240C1180 900 1100 820 1120 740S1140 660 1180 640Z" />
		<rect width="1400" height="900" fill="url(#bold-sheen)" />
	</svg>

	<div class="jobs">
		<h2 id="bold-jobs" class="jobs-head"><em>Time savers</em> &amp; workflow upgrades</h2>
		<ul>
			{#each JOBS as job (job.name)}
				{#if job.infographic}
					<li>
						<details class="drawer">
							<summary class="job">{@render row(job)}</summary>
							<div class="engraved"><job.infographic /></div>
						</details>
					</li>
				{:else}
					<li class="job">{@render row(job)}</li>
				{/if}
			{/each}
		</ul>
	</div>
</section>

<section class="cta" aria-labelledby="bold-contact">
	<h2 id="bold-contact">What's eating your week?</h2>
	<p class="cta-sub">Tell me what you'd like automated, or plan a project step by step.</p>

	<label class="sr-only" for="bold-message">Your message</label>
	<textarea
		id="bold-message"
		class="message"
		rows="4"
		placeholder="What would you like automated?"
		bind:value={message}
	></textarea>

	<div class="send">
		<a class="email" href="mailto:{CONTACT}">{CONTACT}</a>
		<span class="actions">
			<a class="btn-quiet" href="/plan" onclick={(e) => select(e, '/plan')}>Plan a Project</a>
			<a class="btn-bold" class:off={!message.trim()} aria-disabled={!message.trim()} href={mailto}>Contact me →</a>
		</span>
	</div>
</section>

<style>
	.hero {
		/* The first screen, less the least that can sit above it: the mat,
		   the frame's padding and a one-line header come to about 7rem. Taken
		   off at its smallest, the band always starts below the fold; a header
		   that wraps only pushes it further down. */
		min-height: calc(100dvh - 6.5rem);
		display: grid;
		place-content: center;
		gap: 1.75rem;
		padding: 3rem 0;
		text-align: center;
	}

	.headline {
		font: 900 clamp(3rem, 9vw, 9rem) / 0.92 var(--font-display);
		letter-spacing: var(--tracking-display);
	}

	.headline span {
		display: block;
	}

	.soft,
	.sub,
	.hint {
		color: var(--color-muted);
	}

	.sub {
		font-size: clamp(1rem, 1.6vw, 1.25rem);
	}

	.hint {
		justify-self: center;
		margin-top: 1.5rem;
		padding: 0.5rem 0.75rem;
		border: 0;
		background: none;
		font: 600 0.75rem var(--font-mono);
		letter-spacing: 0.12em;
		cursor: pointer;
	}

	.hint:hover {
		color: var(--color-ink);
	}

	/* Edge to edge of the frame: the frame's padding is 18px. */
	.band {
		position: relative;
		overflow: hidden;
		margin-inline: -18px;
		color: var(--camo-ink);
	}

	.camo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.jobs {
		position: relative;
		max-width: 1200px;
		margin: 0 auto;
		padding: clamp(64px, 10vw, 140px) 24px;
	}

	.jobs-head {
		margin-bottom: 1.75rem;
		font: 900 clamp(2rem, 5vw, 4rem) / 1 var(--font-display);
		letter-spacing: var(--tracking-display);
	}

	/* The one tilt left on the band: a label slapped on the heading. */
	.jobs-head em {
		display: inline-block;
		padding: 0 0.18em;
		font-style: normal;
		background-color: var(--camo-ink);
		color: var(--camo-1);
		transform: rotate(-2deg);
	}

	ul {
		container-type: inline-size;
		display: grid;
		gap: 10px;
		padding: 0;
		list-style: none;
	}

	.job {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr) 120px;
		align-items: center;
		gap: 20px;
		padding: 22px 24px;
		border-left: 6px solid var(--camo-ink);
		background-color: var(--camo-plate);
		transition:
			background-color 0.18s ease,
			color 0.18s ease;
	}

	.job:hover {
		background-color: var(--camo-ink);
		color: var(--camo-1);
	}

	/* The proof stacks under the name, so the name gets the full width and
	   never wraps. */
	.words {
		display: grid;
		gap: 6px;
	}

	summary.job {
		cursor: pointer;
		list-style: none;
	}

	summary.job::-webkit-details-marker {
		display: none;
	}

	.drawer[open] summary.job {
		background-color: var(--camo-ink);
		color: var(--camo-1);
	}

	/* Slide open where the browser can animate to auto height; elsewhere it just opens. */
	.drawer {
		interpolate-size: allow-keywords;
	}

	.drawer::details-content {
		block-size: 0;
		overflow: hidden;
		transition:
			block-size 0.3s ease,
			content-visibility 0.3s allow-discrete;
	}

	.drawer[open]::details-content {
		block-size: auto;
	}

	/* Cut into the band rather than laid on it: the shadow sits over the sheet,
	   heaviest along the top edge as if lit from above, with a faint lip of
	   light where the cut meets the bottom. */
	.engraved {
		position: relative;
	}

	.engraved::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		box-shadow:
			inset 0 10px 18px -6px color-mix(in srgb, var(--camo-1) 85%, transparent),
			inset 0 0 0 2px color-mix(in srgb, var(--camo-1) 70%, transparent),
			inset 0 0 40px color-mix(in srgb, var(--camo-1) 35%, transparent),
			inset 0 -2px 0 color-mix(in srgb, var(--camo-ink) 18%, transparent);
	}

	.badge {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		border-radius: 14px;
		background-color: var(--camo-ink);
		color: var(--camo-1);
		transition:
			background-color 0.18s ease,
			color 0.18s ease;
	}

	.job:hover .badge,
	.drawer[open] .badge {
		background-color: var(--camo-1);
		color: var(--camo-ink);
	}

	.badge svg {
		width: 38px;
		height: 38px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.9;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.badge .body {
		fill: color-mix(in srgb, currentColor 16%, transparent);
	}

	.badge .pop {
		fill: var(--camo-pop);
		stroke: var(--camo-pop);
	}

	/* Every name scales with the list so the longest one still fits on one line.
	   278px is what the badge, tag, gaps, padding and border take from a row;
	   26 is roughly the longest name's width in ems. */
	.name {
		font: 900 clamp(1rem, calc((100cqi - 278px) / 26), 2rem) / 1.05 var(--font-display);
		letter-spacing: -0.035em;
		white-space: nowrap;
	}

	.proof {
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.tag {
		justify-self: end;
		padding: 6px 10px;
		font: 800 0.7rem var(--font-mono);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		background-color: var(--camo-ink);
		color: var(--camo-1);
	}

	.job:hover .tag,
	.drawer[open] .tag {
		background-color: var(--camo-1);
		color: var(--camo-ink);
	}

	/* The page's last word: one column, the heading over the message box,
	   the two ways forward under it. */
	.cta {
		display: grid;
		gap: 1.25rem;
		width: 100%;
		max-width: 720px;
		margin: 0 auto;
		padding: clamp(80px, 12vw, 160px) 0;
	}

	.cta h2 {
		font: 900 clamp(2rem, 5vw, 4rem) / 1 var(--font-display);
		letter-spacing: var(--tracking-display);
		text-align: center;
	}

	.cta-sub {
		margin-bottom: 0.75rem;
		text-align: center;
		color: var(--color-muted);
	}

	.message {
		width: 100%;
		padding: 16px 18px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		font: inherit;
		color: var(--color-ink);
		background-color: var(--color-surface);
		resize: vertical;
	}

	.message:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.send {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.email {
		font: 600 0.85rem var(--font-mono);
		color: var(--color-muted);
	}

	.email:hover {
		color: var(--color-ink);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.btn-bold,
	.btn-quiet {
		padding: 14px 26px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 1rem;
	}

	.btn-bold {
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
	}

	/* Nothing to send yet: the draft would open empty. */
	.btn-bold.off {
		pointer-events: none;
		opacity: 0.4;
	}

	.btn-quiet {
		border: 1px solid var(--color-line);
		color: var(--color-ink);
		background-color: var(--color-surface);
	}

	.btn-quiet:hover {
		border-color: var(--color-ink);
	}

	@media (max-width: 720px) {
		.job {
			grid-template-columns: 52px 1fr;
			gap: 8px 16px;
		}

		.badge {
			width: 52px;
			height: 52px;
			border-radius: 12px;
		}

		.badge svg {
			width: 30px;
			height: 30px;
		}

		.tag {
			grid-column: 2;
		}

		/* A phone has no room for the longest name on one line at a readable
		   size, so here the names wrap. */
		.name {
			white-space: normal;
			font-size: 1.3rem;
		}

		.tag {
			justify-self: start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.job,
		.drawer::details-content {
			transition: none;
		}
	}
</style>
