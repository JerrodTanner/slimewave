<script lang="ts">
	/**
	 * One work sample, set as a printed sheet: how a critical CT finding gets
	 * from the scanner to the name a nurse is already looking at.
	 *
	 * This is a reproduction of the mockup that was drawn for it, so like the
	 * resume it sits *outside* the theme tokens on purpose — cream stock, one
	 * crimson, a sage-and-teal duotone for the drawings, serif headings over a
	 * sans body. It is a leave-behind shown inside the site, not part of the
	 * site's own furniture, and it must look the same whichever theme is on.
	 *
	 * Type is sized in `cqw` between clamps, so at the mockup's own 2000px the
	 * sheet sets at exactly its sizes and below that it re-typesets rather than
	 * shrinking to nothing. The five columns fall to two and then one the same
	 * way.
	 *
	 * The healthcare claim on the industries tile ("Parsed CT data streams to
	 * catch critically tagged findings…") is this same job written short. Keep
	 * the two in step, and change the resume ahead of both.
	 */
	const STEPS = [
		{
			name: 'CT scan is acquired',
			line: 'The scanner sends the finished study to PACS, and the exam drops onto the radiologist’s worklist.',
			note: 'DICOM study',
			hot: false
		},
		{
			name: 'Radiologist reads it',
			line: 'Images are reviewed, the impression is dictated, and the report is signed and released.',
			note: 'Impression: acute PE',
			hot: false
		},
		{
			name: 'The HL7 feed is parsed',
			line: 'The result leaves as an ORU^R01 message, and a listener reads every segment as it arrives.',
			note: 'MSH | OBR | OBX',
			hot: false
		},
		{
			name: 'A critical result is found',
			line: 'The impression and its abnormal flag match the critical-findings rules, so the result is raised, not filed.',
			note: 'Rule matched',
			hot: true
		},
		{
			name: 'It lands on the patient list',
			line: 'A critical mark appears on that patient’s row, in the unit list the nurse and provider already watch — shown below.',
			note: 'Critical on patient row',
			hot: true
		}
	];

	/**
	 * The unit list, standing in for a real one. Invented patients on a made-up
	 * unit: the point is the shape of the row, not anybody's chart.
	 */
	const ROWS = [
		{ room: 'BAS ICU · 4102', name: 'Maychgf, Basicu', age: '63 / M', problem: 'None', critical: false },
		{
			room: 'BAS ICU · 4104',
			name: 'Tube, Ett',
			age: '56 / M',
			problem: 'Mild intermittent asthma with acute exacerbation',
			critical: false
		},
		{
			room: 'BAS ICU · 4106',
			name: 'Mayitrthree, Nineteen',
			age: '27 / M',
			problem: 'Appendicitis, unspecified',
			critical: false
		},
		{
			room: 'BAS ICU · 4108',
			name: 'Testey, Billing',
			age: '56 / F',
			problem: 'Critical result · CT chest: acute pulmonary embolism',
			critical: true
		},
		{ room: 'BAS ICU · 4110', name: 'Ldatest, Matt', age: '30 / M', problem: 'None', critical: false },
		{ room: 'BAS ICU · 4112', name: 'Dnu, Ecgone', age: '25 / F', problem: 'None', critical: false }
	];

	/**
	 * The pointer has to land on the flagged row, and where that row sits
	 * depends on how the table set itself — how many rows there are, whether
	 * the problem column wrapped, which breakpoint is on. So it is measured
	 * rather than guessed at with an offset: `markY` is the row's centre in the
	 * note's own coordinates, and the arrow is parked there.
	 */
	let hotRow = $state<HTMLElement | null>(null);
	let callout = $state<HTMLElement | null>(null);
	let markY = $state(0);

	/** Hands the flagged row to the measurement above; the rest go unwatched. */
	function flagged(node: HTMLElement, is: boolean) {
		if (is) hotRow = node;
		return {
			destroy() {
				if (hotRow === node) hotRow = null;
			}
		};
	}

	$effect(() => {
		const row = hotRow;
		const note = callout;
		if (!row || !note) return;

		const measure = () => {
			const r = row.getBoundingClientRect();
			const n = note.getBoundingClientRect();
			markY = r.top + r.height / 2 - n.top;
		};

		measure();
		// Both boxes move when the panel is resized or the sheet re-typesets,
		// and neither fires anything else we could listen for.
		const observer = new ResizeObserver(measure);
		observer.observe(row);
		observer.observe(note);
		return () => observer.disconnect();
	});
</script>

<!--
	The five drawings, on the mockup's 48 grid rather than the site's 24 one:
	they are illustrations on a sheet, not icons in the chrome, and they carry
	fills as well as strokes.
-->
{#snippet stepIcon(i: number)}
	<svg class="art" viewBox="0 0 48 48" fill="none" stroke="#1C1A17" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if i === 0}
			<rect x="7" y="6" width="34" height="30" rx="6" fill="#DCE6E2" />
			<circle cx="24" cy="21" r="11" fill="#F6F1E7" />
			<circle cx="24" cy="21" r="5" fill="#17564F" stroke="none" />
			<rect x="3" y="33" width="42" height="6" rx="3" fill="#F6F1E7" />
			<path d="M12 39v4" />
			<path d="M36 39v4" />
		{:else if i === 1}
			<rect x="8" y="5" width="34" height="25" rx="3" fill="#F6F1E7" />
			<rect x="12" y="9" width="26" height="17" rx="2" fill="#1C1A17" stroke="none" />
			<ellipse cx="20" cy="17.5" rx="4" ry="6" fill="#6E9E96" stroke="none" />
			<ellipse cx="30" cy="17.5" rx="4" ry="6" fill="#6E9E96" stroke="none" />
			<rect x="12" y="9" width="26" height="17" rx="2" />
			<path d="M25 30v4" />
			<path d="M19 40h12l-2-6h-8z" fill="#DCE6E2" />
			<circle cx="11" cy="32" r="5" fill="#DCE6E2" />
			<path d="M3 43c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="#DCE6E2" />
		{:else if i === 2}
			<rect x="3" y="9" width="15" height="21" rx="2.5" fill="#F6F1E7" />
			<path d="M6.5 15h8" />
			<path d="M6.5 19.5h8" />
			<path d="M6.5 24h5" />
			<circle cx="21.5" cy="19.5" r="1.6" fill="#17564F" stroke="none" />
			<circle cx="26" cy="19.5" r="1.6" fill="#17564F" stroke="none" />
			<rect x="30" y="11" width="16" height="17" rx="3" fill="#DCE6E2" />
			<rect x="34" y="15" width="8" height="9" rx="1.5" fill="#F6F1E7" />
			<path d="M34 11V7" />
			<path d="M42 11V7" />
			<path d="M34 28v4" />
			<path d="M42 28v4" />
			<path d="M14 36l-4 4 4 4" />
			<path d="M28 36l4 4-4 4" />
			<path d="M22.5 35l-3 10" />
		{:else if i === 3}
			<rect x="5" y="5" width="25" height="33" rx="3" fill="#F6F1E7" />
			<path d="M10 12h15" />
			<path d="M10 17h15" />
			<path d="M10 22h9" />
			<circle cx="27" cy="27" r="10" fill="#DCE6E2" fill-opacity="0.85" />
			<path d="M34.2 34.2L42 42" stroke-width="2.8" />
			<circle cx="37" cy="11" r="8" fill="#9E2B20" stroke="none" />
			<path d="M37 7.5v4.6" stroke="#F6F1E7" stroke-width="2.4" />
			<circle cx="37" cy="15.2" r="1.3" fill="#F6F1E7" stroke="none" />
		{:else}
			<rect x="6" y="6" width="36" height="38" rx="4" fill="#F6F1E7" />
			<rect x="18" y="2" width="12" height="7" rx="2.5" fill="#DCE6E2" />
			<path d="M11 15.5h18" />
			<rect x="9" y="21" width="30" height="9" rx="2.5" fill="#F2D6D1" />
			<path d="M12 25.5h11" />
			<circle cx="33" cy="25.5" r="4.6" fill="#9E2B20" stroke="none" />
			<path d="M33 22.8v2.9" stroke="#F6F1E7" stroke-width="1.7" />
			<circle cx="33" cy="27.8" r="0.85" fill="#F6F1E7" stroke="none" />
			<path d="M11 35.5h18" />
		{/if}
	</svg>
{/snippet}

<div class="sheet">
	<p class="eyebrow">Radiology · critical results</p>
	<h3 class="masthead">Alerts for critically injured patients</h3>

	<div class="rule-heavy"></div>

	<p class="deck">
		Critical imaging findings take an automated path. The result feed is parsed on arrival,
		matched against critical-finding rules, and raised on the ER patient list.
	</p>

	<ol class="steps">
		{#each STEPS as step, i (step.name)}
			<li class="step">
				<p class="numeral" class:hot={step.hot}>{i + 1}</p>
				<div class="artbox">{@render stepIcon(i)}</div>
				<h4 class="stepname" class:hot={step.hot}>{step.name}</h4>
				<p class="stepline">{step.line}</p>
				<p class="stepnote" class:hot={step.hot}>{step.note}</p>
			</li>
		{/each}
	</ol>

	<div class="rule-hair"></div>

	<h4 class="subhead">What the unit actually sees</h4>

	<div class="seen">
		<!-- Not a screenshot of anybody's EHR: the columns a unit list really
		     has, drawn here, so nothing of a real chart is reproduced. -->
		<div class="screen">
			<div class="chrome">
				<span>ICU · Patient list</span>
				<span class="chrome-right">20 patients · refreshed just now</span>
			</div>
			<table class="list">
				<thead>
					<tr>
						<th scope="col" class="c-room">Unit · Room</th>
						<th scope="col" class="c-name">Patient name</th>
						<th scope="col" class="c-age">Age / Sex</th>
						<th scope="col">Problem</th>
						<th scope="col" class="c-mark">Flag</th>
					</tr>
				</thead>
				<tbody>
					{#each ROWS as row (row.room)}
						<tr class:hotrow={row.critical} use:flagged={row.critical}>
							<td class="c-room">{row.room}</td>
							<td class="c-name">{row.name}</td>
							<td class="c-age">{row.age}</td>
							<td class="c-prob">{row.problem}</td>
							<td class="c-mark">
								{#if row.critical}
									<span class="mark">
										<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
											<circle cx="12" cy="12" r="11" fill="#9E2B20" />
											<path d="M12 6.2v6.6" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" />
											<circle cx="12" cy="16.9" r="1.6" fill="#FFFFFF" />
										</svg>
										<span class="markword">Critical</span>
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<aside class="callout" bind:this={callout}>
			<!-- The pointer the mockup draws from the note to the flagged row,
			     parked at that row's measured centre. It only makes sense while
			     the note is beside the list, so it goes when the two stack. -->
			<svg class="pointer" style:top="{markY}px" viewBox="0 0 64 24" fill="none" aria-hidden="true">
				<path d="M60 12H12" stroke="#9E2B20" stroke-width="3" stroke-linecap="round" />
				<path d="M12 12l9-7M12 12l9 7" stroke="#9E2B20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			<p class="calloutlabel">The moment it lands</p>
			<p class="calloutline">
				It will be clear to all hospital staff that the patients will immediately need to be sent
				to the Interventional Radiology Room
			</p>
		</aside>
	</div>

	<div class="rule-hair"></div>

	<div class="story">
		<h4 class="storyhead">How it was done</h4>
		<div class="storycols">
			<p>
				Radiology managers across every site wanted critical findings to be visually obvious.
				Working with the hospital’s head Imaging Support Specialist and the application
				integration team, I traced exactly where our imaging software was writing critical
				findings into the HL7 messages that the radiologists’ reading machines send to the EHR.
			</p>
			<p>
				I then worked with our EHR vendor’s technical support to settle on a native solution that
				could display that specific field — so critical findings are finally clear to every staff
				member responsible for the care of an ER patient.
			</p>
		</div>
	</div>
</div>

<style>
	/* --- the stock --------------------------------------------------------
	   Lifted from the mockup: #F6F1E7 paper, #1C1A17 ink, #4C463C body,
	   #8A7F6E and #6E6558 for the small type, #D9D0BF rules, #9E2B20 for
	   anything critical, and #DCE6E2 / #17564F / #6E9E96 for the drawings.
	   Deliberately outside the theme tokens, exactly like the resume sheet:
	   this is a printed leave-behind that happens to be shown on a screen, and
	   it has to read the same under every theme.

	   The one concession is the typeface. The mockup sets its headings in
	   Fraunces; a site that ships as one binary does not pull a webfont, so
	   this uses the same local serif stack the wordmark does — the same trade
	   the aero theme makes for Nunito and Hind. */
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
	.stepnote,
	.chrome,
	.calloutlabel,
	.list thead th,
	.markword,
	.c-room {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
	}

	.masthead,
	.stepname,
	.subhead,
	.numeral,
	.calloutline,
	.storyhead {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-weight: 700;
	}

	/* --- masthead --------------------------------------------------------- */
	.eyebrow {
		margin: 0;
		font-size: clamp(0.625rem, 0.65cqw, 0.8125rem);
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: #8A7F6E;
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
	   Hairline rules between the columns, as on the sheet: a border on every
	   column but the first gives the same four lines at any column count. */
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

	.step {
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
		color: #9E2B20;
	}

	.artbox {
		margin-top: clamp(0.6rem, 0.9cqw, 1.15rem);
		height: clamp(3.5rem, 5.2cqw, 6.5rem);
		display: flex;
		align-items: center;
	}

	.art {
		width: clamp(3.5rem, 5.2cqw, 6.5rem);
		height: clamp(3.5rem, 5.2cqw, 6.5rem);
	}

	.stepname {
		margin: clamp(0.7rem, 1cqw, 1.25rem) 0 0;
		font-size: clamp(1.0625rem, 1.35cqw, 1.6875rem);
		line-height: 1.15;
	}

	.stepline {
		margin: clamp(0.4rem, 0.5cqw, 0.625rem) 0 0;
		font-size: clamp(0.8125rem, 0.825cqw, 1.03rem);
		line-height: 1.55;
		color: #4C463C;
	}

	.stepnote {
		margin: clamp(0.6rem, 0.8cqw, 1rem) 0 0;
		padding-top: clamp(0.4rem, 0.5cqw, 0.625rem);
		border-top: 1px solid #D9D0BF;
		font-size: clamp(0.5625rem, 0.6cqw, 0.75rem);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #6E6558;
	}

	.stepnote.hot {
		border-top-color: #E2C4BF;
		color: #9E2B20;
	}

	/* --- what the unit sees ------------------------------------------------ */
	.subhead {
		margin: 0 0 clamp(0.9rem, 1.4cqw, 1.75rem);
		font-size: clamp(1.25rem, 1.8cqw, 2.25rem);
		line-height: 1.1;
	}

	.seen {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(1.1rem, 2.4cqw, 3rem);
		align-items: start;
	}

	@container (min-width: 56rem) {
		.seen {
			grid-template-columns: minmax(0, 1320fr) minmax(0, 460fr);
			/* Wide enough for the pointer to sit in, rather than across the note. */
			gap: clamp(2rem, 4cqw, 5rem);
		}
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
		gap: 0.75rem;
		padding: clamp(0.5rem, 0.6cqw, 0.75rem) clamp(0.6rem, 0.9cqw, 1.125rem);
		border-bottom: 1px solid #D9D0BF;
		background-color: #EFE9DC;
		font-size: clamp(0.625rem, 0.65cqw, 0.8125rem);
		letter-spacing: 0.06em;
		color: #4C463C;
	}

	.chrome-right {
		margin-left: auto;
		color: #8A7F6E;
		text-align: right;
	}

	.list {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		text-align: left;
		font-size: clamp(0.75rem, 0.75cqw, 0.9375rem);
	}

	.list th,
	.list td {
		padding: clamp(0.4rem, 0.55cqw, 0.7rem) clamp(0.6rem, 0.9cqw, 1.125rem);
		border-top: 1px solid #EDE6D9;
		vertical-align: middle;
	}

	.list thead th {
		border-top: 0;
		border-bottom: 1px solid #D9D0BF;
		background-color: #FAF7F0;
		font-size: clamp(0.5rem, 0.575cqw, 0.71875rem);
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #6E6558;
	}

	.list td {
		color: #4C463C;
	}

	.c-room {
		width: 10rem;
		font-size: clamp(0.6875rem, 0.65cqw, 0.8125rem);
	}

	.c-name {
		width: 12rem;
	}

	.c-age {
		width: 6rem;
	}

	.c-mark {
		width: 8rem;
	}

	/* Narrow, the room and the age are the first things a reader can do
	   without; the problem is what carries the finding. */
	.c-room,
	.c-age {
		display: none;
	}

	@container (min-width: 40rem) {
		.c-room,
		.c-age {
			display: table-cell;
		}
	}

	.c-name {
		display: none;
	}

	@container (min-width: 30rem) {
		.c-name {
			display: table-cell;
		}
	}

	.hotrow {
		background-color: #FBEFEC;
	}

	.hotrow td {
		border-top-color: #E2C4BF;
		font-weight: 600;
		color: #1C1A17;
	}

	.hotrow .c-prob {
		color: #9E2B20;
	}

	.mark {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		color: #9E2B20;
	}

	.mark svg {
		width: 1.35em;
		height: 1.35em;
		flex-shrink: 0;
	}

	.markword {
		font-size: clamp(0.5rem, 0.575cqw, 0.71875rem);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* --- the note beside the list ------------------------------------------ */
	.callout {
		position: relative;
	}

	.pointer {
		display: none;
	}

	@container (min-width: 56rem) {
		.pointer {
			display: block;
			position: absolute;
			/* Out in the gap, reaching back over the list so the head touches
			   the mark it is pointing at. `top` is set inline from the
			   measurement; the shift up is half its own height. */
			right: 100%;
			margin-right: 0.35rem;
			width: clamp(2.75rem, 4.4cqw, 5.5rem);
			height: auto;
			transform: translateY(-50%);
		}
	}

	.calloutlabel {
		margin: 0;
		font-size: clamp(0.5625rem, 0.6cqw, 0.75rem);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #9E2B20;
	}

	.calloutline {
		margin: clamp(0.5rem, 0.6cqw, 0.75rem) 0 0;
		font-size: clamp(1.0625rem, 1.35cqw, 1.6875rem);
		line-height: 1.22;
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
