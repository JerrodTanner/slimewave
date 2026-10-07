<script lang="ts">
	import WorkSheet from './WorkSheet.svelte';

	/**
	 * The KPI reporting work sample: doctors and department managers asking
	 * for numbers about their departments, answered with reports built
	 * natively in the EHR's self-service reporting tool (Epic SlicerDicer).
	 *
	 * The mock-up follows the shape of that tool, a chart beside the panels
	 * that define it (population, measure, slice, dates), but it is drawn in
	 * the sheet's own stock with no product branding. Three tabs switch
	 * between the kinds of KPI that were asked for. The numbers are invented.
	 *
	 * The accent is plum, where the other sheets use crimson, teal and brass.
	 */
	const STEPS = [
		{
			name: 'A question comes in',
			line: 'A doctor or department manager asks about their department: how busy the IR rooms are, how fast reads come back.',
			note: 'Doctors & managers',
			hot: false
		},
		{
			name: 'Find the data',
			line: 'Track down where the EHR already records it, so nothing new has to be collected.',
			note: 'Already in the EHR',
			hot: false
		},
		{
			name: 'Build it natively',
			line: 'The report is built inside the EHR’s own self-service reporting tool, not exported to a spreadsheet.',
			note: 'Epic SlicerDicer',
			hot: false
		},
		{
			name: 'Sliced for them',
			line: 'Each KPI arrives already broken down the way they asked, by month, priority or location.',
			note: 'Built to the request',
			hot: true
		},
		{
			name: 'Drill in, export',
			line: 'They open it whenever they need it, drill into any bar to see the cases behind it, and export if they want.',
			note: 'Drill down & export',
			hot: true
		}
	];

	interface Kpi {
		tab: string;
		title: string;
		population: string;
		measure: string;
		slice: string;
		dates: string;
		/** [label, value] */
		bars: [string, number][];
		format: (n: number) => string;
		/** The cases behind one bar: what they are called, their columns, how many there are, and row i of bar b. */
		drill: {
			noun: string;
			cols: string[];
			count: (value: number, bar: number) => number;
			row: (bar: number, i: number) => string[];
		};
	}

	// Invented cases for the drill-down, made up the same way every time from
	// the bar and row numbers, so a bar always opens on the same five.
	const PROCEDURES = ['Thrombectomy', 'Embolization', 'Port placement', 'Biliary drain', 'Nephrostomy', 'Angioplasty', 'IVC filter', 'Guided biopsy'];
	const EXAMS = ['CT Head w/o contrast', 'CT Chest PE', 'CT Abd/Pelvis w/', 'MR Brain w/o', 'MR Lumbar Spine', 'CT Angio Neck', 'MR Knee', 'CT Sinus'];
	const SURGERIES = ['Lap cholecystectomy', 'Total knee replacement', 'Appendectomy', 'Hernia repair', 'Carpal tunnel release', 'Hip replacement', 'Cataract surgery', 'Spinal fusion'];
	const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
	const clock = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

	const KPIS: Kpi[] = [
		{
			tab: 'IR room usage',
			title: 'IR room utilization by month',
			population: 'IR procedures',
			measure: 'Room utilization',
			slice: 'Month',
			dates: 'Last 6 months',
			bars: [['Apr', 68], ['May', 72], ['Jun', 75], ['Jul', 71], ['Aug', 79], ['Sep', 83]],
			format: (n) => `${n}%`,
			drill: {
				noun: 'procedures',
				cols: ['Case', 'Date', 'Room', 'Procedure', 'Time in room'],
				count: (value) => Math.round(value * 1.7),
				row: (b, i) => [
					`IR-${b + 4}${String(100 + i * 37).slice(-3)}`,
					`${MONTHS[b]} ${3 + i * 5}`,
					`IR ${1 + ((i + b) % 3)}`,
					PROCEDURES[(i * 3 + b) % PROCEDURES.length],
					`${55 + ((i * 29 + b * 13) % 90)} min`
				]
			}
		},
		{
			tab: 'Read turnaround',
			title: 'Median read turnaround by priority',
			population: 'CT and MR reads',
			measure: 'Median minutes to read',
			slice: 'Priority',
			dates: 'Last 30 days',
			bars: [['STAT', 22], ['Urgent', 48], ['Inpatient', 131], ['Outpatient', 286]],
			format: (n) => `${n} min`,
			drill: {
				noun: 'reads',
				cols: ['Accession', 'Exam', 'Ordered', 'Read', 'Turnaround'],
				count: (_, b) => [64, 120, 310, 540][b],
				row: (b, i) => {
					const ordered = 8 * 60 + i * 47 + b * 9;
					const took = Math.round([22, 48, 131, 286][b] * (0.6 + i * 0.2));
					return [`A${74000 + b * 311 + i * 57}`, EXAMS[(i * 5 + b) % EXAMS.length], clock(ordered), clock(ordered + took), `${took} min`];
				}
			}
		},
		{
			tab: 'Unpaid surgery bills',
			title: 'Unpaid surgery bills by days outstanding',
			population: 'Surgical encounters',
			measure: 'Number of bills',
			slice: 'Days outstanding',
			dates: 'As of today',
			bars: [['0–30', 412], ['31–60', 238], ['61–90', 121], ['90+', 87]],
			format: (n) => n.toLocaleString('en-US'),
			drill: {
				noun: 'bills',
				cols: ['Account', 'Procedure', 'Service date', 'Days out', 'Balance'],
				count: (value) => value,
				row: (b, i) => [
					`S-${51200 + b * 97 + i * 41}`,
					SURGERIES[(i * 3 + b) % SURGERIES.length],
					`${['Sep', 'Aug', 'Jul', 'Jun'][b]} ${4 + i * 5}`,
					`${[12, 44, 73, 118][b] + i * 3}`,
					(1800 + ((i * 977 + b * 413) % 9000)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
				]
			}
		}
	];

	let pick = $state(0);
	/** The bar whose cases are open, by index, or null. */
	let open = $state<number | null>(null);
	const kpi = $derived(KPIS[pick]);

	/** Downloads the open bar's cases as a CSV, as the real report's export would. */
	function exportCases(bar: number) {
		const quote = (cell: string) => `"${cell.replaceAll('"', '""')}"`;
		const lines = [kpi.drill.cols, ...[0, 1, 2, 3, 4].map((i) => kpi.drill.row(bar, i))];
		const csv = lines.map((line) => line.map(quote).join(',')).join('\n');
		const link = document.createElement('a');
		link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
		link.download = `${kpi.tab} - ${kpi.bars[bar][0]}.csv`.toLowerCase().replaceAll(' ', '-');
		link.click();
		URL.revokeObjectURL(link.href);
	}
	const top = $derived(Math.max(...kpi.bars.map(([, v]) => v)));

	/** "How it was done", one string per paragraph. */
	const STORY = [
		'Doctors and department managers kept asking for the same kinds of numbers about their departments: how much the IR rooms were being used, how long radiology reads were taking to come back, how many surgery bills were still unpaid.',
		'Rather than answering each one with a one-off spreadsheet, I built the reports natively in the EHR’s self-service reporting tool, Epic SlicerDicer. Each report arrived already sliced the way the requester asked; they could open it any time, drill down into the cases behind any number, and export it whenever they needed to.'
	];
</script>

<!-- The five drawings, on the same 48 grid and duotone as the other sheets. -->
{#snippet stepIcon(i: number)}
	<svg viewBox="0 0 48 48" fill="none" stroke="#1C1A17" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if i === 0}
			<!-- A question, from someone in a white coat. -->
			<circle cx="15" cy="15" r="7" fill="#DCE6E2" />
			<path d="M3 43c0-7 5.4-11 12-11s12 4 12 11" fill="#F6F1E7" />
			<path d="M15 32v11" />
			<path d="M28 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9l-5 4v-4h-2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="#F6F1E7" />
			<path d="M33.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7" stroke="#6A3FA0" stroke-width="1.8" />
			<circle cx="36" cy="17" r="0.9" fill="#6A3FA0" stroke="none" />
		{:else if i === 1}
			<!-- The record it already lives in. -->
			<rect x="5" y="4" width="28" height="36" rx="3" fill="#F6F1E7" />
			<path d="M10 12h18M10 18h18M10 24h12" />
			<circle cx="31" cy="31" r="9" fill="#DCE6E2" fill-opacity="0.85" />
			<path d="M37.4 37.4L44 44" stroke-width="2.8" />
			<path d="M27 31h8" stroke="#17564F" stroke-width="2" />
		{:else if i === 2}
			<!-- Built inside the EHR's own window. -->
			<rect x="3" y="6" width="42" height="34" rx="3" fill="#F6F1E7" />
			<rect x="3" y="6" width="42" height="7" rx="3" fill="#DCE6E2" />
			<path d="M3 13h42" />
			<path d="M10 34V26M17 34V20M24 34V23M31 34V17" stroke="#17564F" stroke-width="3" />
			<path d="M8 34h30" />
		{:else if i === 3}
			<!-- One measure, cut into slices. -->
			<circle cx="22" cy="24" r="17" fill="#F6F1E7" />
			<path d="M22 24V7a17 17 0 0 1 16.2 11.8Z" fill="#6A3FA0" stroke="#6A3FA0" />
			<path d="M22 24l16.2-5.2A17 17 0 0 1 31 38.2Z" fill="#DCE6E2" />
			<path d="M22 24l9 14.2" />
			<path d="M41 6l4 4M45 6l-4 4" stroke="#6A3FA0" stroke-width="1.8" />
		{:else}
			<!-- Opened on demand, any time. -->
			<rect x="3" y="8" width="30" height="34" rx="3" fill="#F6F1E7" />
			<path d="M8 36V28M14 36V22M20 36V25M26 36V18" stroke="#17564F" stroke-width="3" />
			<circle cx="36" cy="14" r="9" fill="#6A3FA0" stroke="none" />
			<path d="M36 9.5V14l3 2" stroke="#F6F1E7" stroke-width="2" />
		{/if}
	</svg>
{/snippet}

<WorkSheet
	eyebrow="Healthcare · self-service reporting"
	title="KPIs a manager can open on their own"
	deck="Doctors and department managers needed regular numbers about their departments. Instead of one-off spreadsheets, each request became a report built natively in the EHR, already sliced the way they asked, ready to open, drill into and export."
	steps={STEPS}
	icon={stepIcon}
	accent={{ ink: '#6A3FA0', rule: '#DCCDEF' }}
	seenTitle="What a manager sees"
	story={STORY}
>
	{#snippet seen()}
		<!-- Not a screenshot of the EHR: the shape of a self-service report,
		     drawn here with invented numbers. -->
		<div class="screen">
			<div class="chrome">
				<span class="brand">Self-service report</span>
				<div class="tabs" role="tablist" aria-label="Sample KPIs">
					{#each KPIS as k, i (k.tab)}
						<button role="tab" aria-selected={pick === i} class:on={pick === i} onclick={() => { pick = i; open = null; }}>{k.tab}</button>
					{/each}
				</div>
			</div>

			<div class="report">
				<figure class="chart">
					<figcaption>
						<span class="charttitle">{kpi.title}</span>
						<span class="chartdates">{kpi.dates}</span>
					</figcaption>
					<div class="bars">
						{#each kpi.bars as [label, value], b (label)}
							<button
								type="button"
								class="col"
								class:chosen={open === b}
								aria-pressed={open === b}
								aria-label="{label}: {kpi.format(value)}. Show the cases behind it"
								onclick={() => (open = open === b ? null : b)}
							>
								<span class="value" class:peak={value === top}>{kpi.format(value)}</span>
								<span class="bar" class:peak={value === top} style:height="{(value / top) * 100}%"></span>
								<span class="label">{label}</span>
							</button>
						{/each}
					</div>

					{#if open !== null}
						{@const [label, value] = kpi.bars[open]}
						<div class="drill">
							<div class="drillhead">
								<span>{label} · {kpi.format(value)}</span>
								<span class="drillcount">5 of {kpi.drill.count(value, open).toLocaleString('en-US')} {kpi.drill.noun}</span>
								<button type="button" class="drillexport" onclick={() => exportCases(open!)}>Export</button>
								<button type="button" class="drillclose" aria-label="Close the cases" onclick={() => (open = null)}>×</button>
							</div>
							<table class="cases">
								<thead>
									<tr>{#each kpi.drill.cols as col (col)}<th scope="col">{col}</th>{/each}</tr>
								</thead>
								<tbody>
									{#each [0, 1, 2, 3, 4] as i (i)}
										<tr>{#each kpi.drill.row(open, i) as cell, c (c)}<td class:c-first={c === 0}>{cell}</td>{/each}</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="drillhint">Click any bar to see the cases behind it.</p>
					{/if}
				</figure>

				<div class="panels">
					<div class="panel" style:--stripe="#17564F">
						<p class="panelhead">Population</p>
						<p class="panelline">Base: {kpi.population}</p>
					</div>
					<div class="panel" style:--stripe="#6A3FA0">
						<p class="panelhead">Measure</p>
						<p class="panelline">{kpi.measure}</p>
					</div>
					<div class="panel" style:--stripe="#6E9E96">
						<p class="panelhead">Slice by</p>
						<p class="panelline">{kpi.slice}</p>
					</div>
					<div class="panel" style:--stripe="#B38B2E">
						<p class="panelhead">Dates</p>
						<p class="panelline">{kpi.dates}</p>
					</div>
				</div>
			</div>
		</div>

		<aside class="callout">
			<p class="calloutlabel">Click a KPI, then a bar</p>
			<p class="calloutline">Managers answer their own questions, inside the system they already use.</p>
			<p class="calloutsub">
				Each report was built once and reused, so the next time the question came up the answer
				was already a click away.
			</p>
		</aside>
	{/snippet}
</WorkSheet>

<style>
	/* The report builder in the sheet's stock: #C9BFAC and #D9D0BF rules,
	   #EFE9DC chrome, teal bars and plum (#6A3FA0) for the peak. */
	.chrome,
	.calloutlabel,
	.tabs button,
	.chartdates,
	.value,
	.label,
	.panelhead {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
	}

	.screen {
		border: 1px solid #C9BFAC;
		border-radius: 6px;
		overflow: hidden;
		background-color: #FFFFFF;
		box-shadow: 0 10px 28px rgba(28, 26, 23, 0.1);
	}

	.chrome {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
		padding: clamp(0.5rem, 0.6cqw, 0.75rem) clamp(0.6rem, 0.9cqw, 1.125rem);
		border-bottom: 1px solid #D9D0BF;
		background-color: #EFE9DC;
		font-size: clamp(0.625rem, 0.65cqw, 0.8125rem);
		letter-spacing: 0.06em;
		color: #4C463C;
	}

	.brand {
		font-weight: 700;
		color: #1C1A17;
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-left: auto;
	}

	.tabs button {
		padding: 0.25em 0.75em;
		border: 1px solid transparent;
		border-radius: 999px;
		background: none;
		font-size: inherit;
		letter-spacing: 0.04em;
		color: #6E6558;
		cursor: pointer;
	}

	.tabs button:hover {
		border-color: #C9BFAC;
	}

	.tabs button.on {
		border-color: #6A3FA0;
		background-color: #6A3FA0;
		color: #FFFFFF;
	}

	/* The chart beside its panels, as the tool lays it out; stacked narrow. */
	.report {
		display: grid;
		grid-template-columns: 1fr;
	}

	@container (min-width: 48rem) {
		.report {
			grid-template-columns: minmax(0, 1fr) minmax(0, 13rem);
		}

		.panels {
			border-top: 0;
			border-left: 1px solid #EDE6D9;
		}
	}

	.chart {
		margin: 0;
		padding: clamp(0.75rem, 1.2cqw, 1.25rem);
	}

	figcaption {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		margin-bottom: clamp(0.75rem, 1.2cqw, 1.25rem);
	}

	.charttitle {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: clamp(0.95rem, 1.1cqw, 1.2rem);
		font-weight: 700;
	}

	.chartdates {
		font-size: 0.75rem;
		color: #8A7F6E;
	}

	/* Bars grow from a shared baseline; the tallest is the peak. */
	.bars {
		display: flex;
		align-items: stretch;
		gap: clamp(0.4rem, 1cqw, 1rem);
		height: clamp(10rem, 18cqw, 15rem);
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #D9D0BF;
	}

	/* Each column is a button: the whole column, not just the bar, opens
	   the cases. */
	.col {
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	.col:hover .bar,
	.col.chosen .bar {
		filter: brightness(0.85);
	}

	.col.chosen .bar {
		outline: 2px solid #1C1A17;
		outline-offset: 2px;
	}

	.bar {
		width: 100%;
		max-width: 3.5rem;
		border-radius: 3px 3px 0 0;
		background-color: #6E9E96;
		transition: height 0.35s ease;
	}

	.bar.peak {
		background-color: #6A3FA0;
	}

	.value {
		margin-bottom: 0.3rem;
		font-size: clamp(0.625rem, 0.7cqw, 0.75rem);
		color: #4C463C;
	}

	.value.peak {
		font-weight: 700;
		color: #6A3FA0;
	}

	.label {
		position: absolute;
		bottom: -1.35rem;
		font-size: clamp(0.5625rem, 0.65cqw, 0.6875rem);
		white-space: nowrap;
		color: #6E6558;
	}

	.drillhint {
		margin: 0.9rem 0 0;
		font-size: clamp(0.6875rem, 0.75cqw, 0.8125rem);
		color: #8A7F6E;
	}

	/* The cases under the chart; narrow, they scroll sideways rather than squeeze. */
	.drill {
		margin-top: 0.9rem;
		overflow-x: auto;
		border: 1px solid #DCCDEF;
		border-radius: 4px;
		background-color: #FBF8FE;
	}

	.drillhead {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.45rem 0.65rem;
		border-bottom: 1px solid #DCCDEF;
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
		font-size: clamp(0.625rem, 0.7cqw, 0.75rem);
		font-weight: 700;
		color: #6A3FA0;
	}

	.drillcount {
		font-weight: 400;
		color: #8A7F6E;
	}

	.drillexport {
		margin-left: auto;
		padding: 0.15rem 0.6rem;
		border: 1px solid #6A3FA0;
		border-radius: 999px;
		background: none;
		font: inherit;
		font-weight: 400;
		color: #6A3FA0;
		cursor: pointer;
	}

	.drillexport:hover {
		background-color: #6A3FA0;
		color: #FFFFFF;
	}

	.drillclose {
		padding: 0 0.35rem;
		border: 0;
		background: none;
		font-size: 1rem;
		line-height: 1;
		color: #6E6558;
		cursor: pointer;
	}

	.cases {
		width: 100%;
		border-collapse: collapse;
		font-size: clamp(0.6875rem, 0.75cqw, 0.8125rem);
	}

	.cases th,
	.cases td {
		padding: 0.3rem 0.65rem;
		border-top: 1px solid #EDE6F5;
		text-align: left;
		white-space: nowrap;
	}

	.cases th {
		border-top: 0;
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.85em;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #6E6558;
	}

	.cases td {
		color: #4C463C;
	}

	.cases .c-first {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
		color: #1C1A17;
	}

	.panels {
		display: grid;
		align-content: start;
		gap: 0.5rem;
		padding: clamp(0.75rem, 1.2cqw, 1.25rem);
		border-top: 1px solid #EDE6D9;
		background-color: #FAF7F0;
	}

	/* Each panel wears a coloured stripe down its edge, as the tool's do. */
	.panel {
		padding: 0.45rem 0.65rem;
		border: 1px solid #EDE6D9;
		border-left: 4px solid var(--stripe);
		border-radius: 4px;
		background-color: #FFFFFF;
	}

	.panelhead {
		margin: 0;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--stripe);
	}

	.panelline {
		margin: 0.15rem 0 0;
		font-size: clamp(0.75rem, 0.8cqw, 0.875rem);
		color: #1C1A17;
	}

	.calloutlabel {
		margin: 0;
		font-size: clamp(0.5625rem, 0.6cqw, 0.75rem);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--hot);
	}

	.calloutline {
		margin: clamp(0.5rem, 0.6cqw, 0.75rem) 0 0;
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: clamp(1.0625rem, 1.35cqw, 1.6875rem);
		font-weight: 700;
		line-height: 1.22;
	}

	.calloutsub {
		margin: clamp(0.6rem, 0.8cqw, 1rem) 0 0;
		font-size: clamp(0.8125rem, 0.85cqw, 1.0625rem);
		line-height: 1.5;
		color: #6E6558;
	}

	@media (prefers-reduced-motion: reduce) {
		.bar {
			transition: none;
		}
	}
</style>
