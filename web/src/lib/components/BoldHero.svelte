<script lang="ts">
	/**
	 * The Bold front page, above the tile and the doors: one huge line, then
	 * the jobs a business would hand over, on a band of camo.
	 *
	 * The page is Apple-calm and the band is the one loud thing. The camo is
	 * drawn here by hand (original work, so nothing to credit) as a few large
	 * shapes in close tones, sliced to cover rather than tiled, so it never
	 * reads as wallpaper. Every proof line is on resume.md; change it there
	 * first, the same rule as the industries tile.
	 */
	let { select }: { select: (event: MouseEvent | null, href: string) => void } = $props();

	/** A plain stroke, or the icon's body (tinted) or its accent (solid pop). */
	type Stroke = string | { d: string; tone: 'body' | 'pop' };

	interface Job {
		name: string;
		proof: string;
		tag: 'Reporting' | 'Databases' | 'Workflows';
		icon: Stroke[];
	}

	const JOBS: Job[] = [
		{
			name: 'Weekly business reports',
			proof: 'Led radiology reporting for hospital operations, tailored to make each team faster.',
			tag: 'Reporting',
			icon: [
				{ d: 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
				'M14 2v6h6',
				'M8 18v-3',
				'M12 18v-6',
				'M16 18v-4'
			]
		},
		{
			name: 'Self-serve dashboards for every team',
			proof: 'Built Epic SlicerDicer reports for department managers, doctors and nurses.',
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
			name: 'Log monitoring & error alerts',
			proof: 'Built an app to parse large log volumes, speeding up production debugging.',
			tag: 'Reporting',
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
			name: 'Customer history, in one place',
			proof: 'Tracked tenant and business-name history across leased office space, helping it bring in an extra $1M a year.',
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
			name: 'Business & customer notifications',
			proof: 'Flagged critical CT findings, like strokes, and alerted doctors right away.',
			tag: 'Workflows',
			icon: [
				{ d: 'M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8', tone: 'body' },
				'M10.3 21a1.94 1.94 0 0 0 3.4 0',
				'M2 7.5a10 10 0 0 1 2.2-4.5',
				'M22 7.5A10 10 0 0 0 19.8 3',
				{ d: 'M20.5 11a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0', tone: 'pop' }
			]
		},
		{
			name: 'Invoices & billing',
			proof: 'Automated invoice generation for rent collection.',
			tag: 'Workflows',
			icon: [
				{ d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z', tone: 'body' },
				'M15 8.5h-3.5a1.75 1.75 0 0 0 0 3.5h1a1.75 1.75 0 0 1 0 3.5H9',
				'M12 6.5v11'
			]
		},
		{
			name: 'Reconciliation & error checks',
			proof: 'Caught $12k a month in 401k matching errors; saved HR 20 hours a week on benefits.',
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
			name: 'Payment & expense labeling',
			proof: 'Auto-labeled payment types, saving accounts payable 10 hours a week.',
			tag: 'Workflows',
			icon: [
				{ d: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', tone: 'body' },
				'M2 7.5h20',
				'M5.5 11.5h4',
				{ d: 'M13 16h6l3 2.75-3 2.75h-6Z', tone: 'pop' }
			]
		},
		{
			name: 'Inventory tracking',
			proof: "Built a web tool for managing a university's textbook inventory.",
			tag: 'Databases',
			icon: [
				{ d: 'M8 2h8v8H8Z', tone: 'body' },
				'M3 13h8v8H3Z',
				'M13 13h8v8h-8Z',
				'M12 2v3',
				'M7 13v3',
				'M17 13v3'
			]
		},
		{
			name: 'Moving between systems',
			proof: "Automated the order crosswalk for a hospital's move from Cerner to Epic.",
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
</script>

<section class="hero">
	<h1 class="headline"><span>Less busywork.</span><span class="soft">More business.</span></h1>
	<p class="sub">Digitize your operations, move more work, and leave the paperwork behind.</p>
	<span class="hint" aria-hidden="true">↓ SEE WHAT IT SAVES</span>
</section>

<section class="band" aria-labelledby="bold-jobs">
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
				<li class="job">
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
					<span class="name">{job.name}</span>
					<span class="proof">{job.proof}</span>
					<span class="tag">{job.tag}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="cta">
	<h2>What's eating your week?</h2>
	<a class="btn-bold" href="/plan" onclick={(e) => select(e, '/plan')}>Plan a Project →</a>
</section>

<style>
	.hero {
		/* The first screen, less the header above it. */
		min-height: calc(100dvh - 9rem);
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
		margin-top: 1.5rem;
		font: 600 0.75rem var(--font-mono);
		letter-spacing: 0.12em;
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
		display: grid;
		gap: 10px;
		padding: 0;
		list-style: none;
	}

	.job {
		display: grid;
		grid-template-columns: 64px minmax(0, 1.1fr) minmax(0, 1.5fr) 120px;
		align-items: center;
		gap: 20px;
		padding: 22px 24px;
		border-left: 6px solid var(--camo-ink);
		background-color: var(--camo-plate);
		transition:
			transform 0.18s ease,
			background-color 0.18s ease,
			color 0.18s ease;
	}

	.job:hover {
		transform: translateX(10px);
		background-color: var(--camo-ink);
		color: var(--camo-1);
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

	.job:hover .badge {
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

	.name {
		font: 900 clamp(1.3rem, 2.4vw, 2rem) / 1.05 var(--font-display);
		letter-spacing: -0.035em;
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

	.job:hover .tag {
		background-color: var(--camo-1);
		color: var(--camo-ink);
	}

	.cta {
		display: grid;
		justify-items: center;
		gap: 1.5rem;
		padding: clamp(80px, 12vw, 160px) 0;
		text-align: center;
	}

	.cta h2 {
		font: 900 clamp(2rem, 5vw, 4rem) / 1 var(--font-display);
		letter-spacing: var(--tracking-display);
	}

	.btn-bold {
		padding: 16px 30px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 1.05rem;
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
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

		.proof,
		.tag {
			grid-column: 2;
		}

		.tag {
			justify-self: start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.job,
		.job:hover {
			transform: none;
			transition: none;
		}
	}
</style>
