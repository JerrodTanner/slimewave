<script lang="ts">
	import { JOBS, type Job } from '$lib/content/jobs';
	import { CONTACT, drafts, formatUsPhone, invites, isUsPhone } from '$lib/contact';
	import SendMenu from './SendMenu.svelte';

	/**
	 * The Bold front page: one huge line, then the jobs a business would hand
	 * over (JOBS, in lib/content/jobs) on a band of camo, then the contact.
	 *
	 * The page is Apple-calm and the band is the one loud thing. The camo is
	 * drawn here by hand (original work, so nothing to credit) as a few large
	 * shapes in close tones, sliced to cover rather than tiled, so it never
	 * reads as wallpaper.
	 */
	let { select }: { select: (event: MouseEvent | null, href: string) => void } = $props();


	// The same inbox and the same draft as the tile's contact box under the
	// other styles (lib/contact): nothing is posted or stored.
	let message = $state('');
	const draft = $derived(drafts('Inquiry from jerrodtanner.com', message.trim()));

	/**
	 * The free call. The visitor picks a day and a time in their own zone;
	 * the request goes out as a calendar invite or an email (SendMenu), so it
	 * needs no booking service. Defaults to the next weekday at 10:00.
	 */
	const CALL_MINUTES = 30;
	const TIMES = Array.from({ length: 17 }, (_, i) => {
		const minutes = 9 * 60 + i * 30;
		return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
	});
	const pad = (n: number) => String(n).padStart(2, '0');
	function nextWeekday() {
		const d = new Date();
		do d.setDate(d.getDate() + 1);
		while (d.getDay() === 0 || d.getDay() === 6);
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}
	let callDay = $state(nextWeekday());
	let callTime = $state('10:00');
	/** The number to ring: required, and a valid US one, before a call can be asked for. */
	let callPhone = $state('');
	const phoneOk = $derived(isUsPhone(callPhone));
	/**
	 * The correction shows only once typing has paused for 1.2 seconds on a
	 * number that still isn't valid, so it never nags mid-number.
	 */
	let phoneSettled = $state(false);
	let phonePause: ReturnType<typeof setTimeout> | undefined;
	const phoneWrong = $derived(phoneSettled && callPhone !== '' && !phoneOk);

	// Formats as digits go in, but leaves deletions alone: reformatting on
	// Backspace would put back the bracket or dash just removed.
	function typePhone(e: Event & { currentTarget: HTMLInputElement }) {
		const input = e.currentTarget;
		const inserting = e instanceof InputEvent ? e.inputType.startsWith('insert') : true;
		callPhone = inserting ? formatUsPhone(input.value) : input.value;
		input.value = callPhone;
		phoneSettled = false;
		clearTimeout(phonePause);
		phonePause = setTimeout(() => (phoneSettled = true), 1200);
	}
	const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const callStart = $derived(new Date(`${callDay}T${callTime}`));
	const callReady = $derived(!Number.isNaN(callStart.getTime()));
	const callWhen = $derived(
		callReady
			? callStart.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
			: ''
	);
	const callNote = $derived(
		`I'd like a free 30-minute call on ${callWhen} (${zone}). You can reach me at ${callPhone.trim()}.${message.trim() ? `\n\n${message.trim()}` : ''}`
	);
	const callDraft = $derived(drafts('Free 30-minute call request', callNote));
	const callInvites = $derived(callReady ? invites(callStart, CALL_MINUTES, 'Free 30-minute call with Jerrod Tanner', callNote) : null);

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
	<p class="cta-sub">
		Tell me what you'd like automated, or plan a project step by step.
		<span class="cta-where">ShineWave is based in Fort Lauderdale, Florida.</span>
	</p>

	<div class="panel">
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
				<SendMenu drafts={draft} disabled={!message.trim()}>
					{#snippet trigger(props)}
						<button class="btn-bold" {...props}>Contact me →</button>
					{/snippet}
				</SendMenu>
			</span>
		</div>

		<div class="call">
			<p class="call-head"><strong>Prefer to talk it through?</strong> Book a free 30-minute call.</p>
			<div class="call-row">
				<label class="call-field call-phone">
					<span>Phone</span>
					<input
						type="tel"
						id="call-phone"
						autocomplete="tel"
						inputmode="tel"
						placeholder="(555) 234-5678"
						aria-invalid={phoneWrong}
						aria-describedby="call-phone-note"
						value={callPhone}
						oninput={typePhone}
					/>
				</label>
				<label class="call-field">
					<span>Day</span>
					<input type="date" id="call-day" bind:value={callDay} />
				</label>
				<label class="call-field">
					<span>Time ({zone.split('/').pop()?.replace('_', ' ')})</span>
					<select id="call-time" bind:value={callTime}>
						{#each TIMES as t (t)}<option value={t}>{t}</option>{/each}
					</select>
				</label>
				<SendMenu
					drafts={callDraft}
					disabled={!callReady || !phoneOk}
					heading="Request with…"
					extras={callInvites
						? [
								{ label: 'Google Calendar invite', href: callInvites.google },
								{ label: 'Outlook calendar invite', href: callInvites.outlook }
							]
						: []}
				>
					{#snippet trigger(props)}
						<button class="btn-quiet" {...props}>Request a call →</button>
					{/snippet}
				</SendMenu>
			</div>
			<p class="call-note" id="call-phone-note" class:bad={phoneWrong}>
				{phoneWrong
					? 'That doesn’t look like a US number yet: 10 digits, like (555) 234-5678.'
					: 'Enter a US phone number.'}
			</p>
		</div>
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

	.cta-where {
		display: block;
		margin-top: 0.25rem;
		font: 600 0.75rem var(--font-mono);
		letter-spacing: 0.08em;
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

	/* One size for every pill in the contact panel, link or button, filled
	   or outlined, so the three line up as a set. */
	.btn-bold,
	.btn-quiet {
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 11.5rem;
		height: 3rem;
		padding: 0 1.25rem;
		border: 1px solid transparent;
		border-radius: 999px;
		font: inherit;
		font-weight: 700;
		font-size: 1rem;
		line-height: 1;
		white-space: nowrap;
	}

	.btn-bold {
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
		cursor: pointer;
	}

	/* Nothing to send yet: the draft would open empty. */
	.btn-bold:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.btn-quiet {
		border-color: var(--color-line);
		color: var(--color-ink);
		background-color: var(--color-surface);
	}

	.btn-quiet:hover {
		border-color: var(--color-ink);
	}

	button.btn-quiet {
		cursor: pointer;
	}

	/* Both ways in share one panel: a frosted sheet of the page's own ground
	   laid over the tiles, the message on top and the call under a rule. */
	.panel {
		display: grid;
		gap: 1.25rem;
		padding: clamp(16px, 2.6vw, 24px);
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
	}

	.call {
		display: grid;
		gap: 0.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-line);
	}

	.call-head {
		margin: 0;
		color: var(--color-muted);
	}

	.call-head strong {
		color: var(--color-ink);
	}

	.call-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 10px;
	}

	.call-field {
		display: grid;
		gap: 4px;
		font: 600 0.75rem var(--font-mono);
		color: var(--color-muted);
	}

	/* The same pill as the buttons beside them, and the same white as the
	   message box above. */
	.call-field input,
	.call-field select {
		padding: 12px 16px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		font: inherit;
		font-size: 0.95rem;
		color: var(--color-ink);
		background-color: var(--color-surface);
	}

	.call-row :global(.send) {
		margin-left: auto;
	}

	.call-phone input {
		width: 11rem;
	}

	.call-field input[aria-invalid='true'] {
		border-color: var(--color-warn, var(--color-ink));
	}

	.call-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.call-note.bad {
		color: var(--color-warn, var(--color-ink));
	}

	@media (max-width: 720px) {
		/* Rows run tall here as the names wrap, so the badge sits beside the
		   name at the top rather than floating in the middle. */
		.job {
			grid-template-columns: 52px 1fr;
			align-items: start;
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
