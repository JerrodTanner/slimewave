<script lang="ts">
	import { JOBS, type Job } from '$lib/content/jobs';
	import { CONTACT, drafts, formatUsPhone, isEmail, isUsPhone, send, type SendState } from '$lib/contact';
	import { describeCall, holiday, hoursIn, inHours, todayIn, zonedInstant, zoneName } from '$lib/callTimes';
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


	// The same inbox as the tile's contact box under the other styles
	// (lib/contact). One form covers both ways in: a message, a call, or
	// both. The visitor's email is required so there is someone to reply to;
	// the phone, day and time are optional and ride along in the same email.
	// The draft is only the fallback for when the send fails.
	let message = $state('');
	let replyTo = $state('');
	/** The honeypot, hidden from people; see handleContact on the server. */
	let website = $state('');
	let sendState = $state<SendState>('idle');
	let sendError = $state('');

	// Jerrod's hours in Eastern, checked against the visitor's own clock
	// (lib/callTimes). The day is a date on their calendar.
	const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const today = todayIn(zone);
	let callDay = $state('');
	const dayOff = $derived(callDay ? holiday(callDay) : null);
	const dayPast = $derived(!!callDay && callDay < today);

	/**
	 * The time is typed, as an hour and minutes, with AM or PM tapped beside
	 * them, all in one field. Minutes left blank mean on the hour. A time
	 * outside Jerrod's hours gets a warning naming those hours on the
	 * visitor's clock, and holds the send until it is fixed or cleared.
	 */
	let typedHour = $state('');
	let typedMinute = $state('');
	let period = $state<'' | 'AM' | 'PM'>('');
	let minuteInput: HTMLInputElement | undefined = $state();
	// AM or PM alone is not a time yet; the digits are what start one.
	const timeStarted = $derived(!!(typedHour || typedMinute));

	/** The typed time as a moment, or the reason it isn't one yet. */
	const callTime = $derived.by((): { at: Date } | { problem: string; quiet?: boolean } | null => {
		if (!timeStarted) return null;
		const hour = Number(typedHour);
		const minute = typedMinute === '' ? 0 : Number(typedMinute);
		if (!typedHour) return { problem: 'Enter an hour, or clear the minutes for any time.' };
		if (!/^\d{1,2}$/.test(typedHour) || hour < 1 || hour > 12) return { problem: 'Enter an hour from 1 to 12.' };
		if (!/^\d{0,2}$/.test(typedMinute) || minute > 59) return { problem: 'Enter minutes from 00 to 59.' };
		// Asked for only once the minutes are in, so it never nags mid-typing.
		if (!period) return { problem: 'Choose AM or PM.', quiet: typedMinute.length < 2 };
		const h24 = (hour % 12) + (period === 'PM' ? 12 : 0);
		const at = zonedInstant(callDay || today, `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, zone);
		if (!inHours(at)) return { problem: `Calls are ${hoursIn(zone, callDay)}. Pick a time in that range.` };
		if (callDay === today && at.getTime() <= Date.now()) return { problem: 'That time has already passed today. Pick a later time.' };
		return { at };
	});
	const callAt = $derived(callTime && 'at' in callTime ? callTime.at : null);
	const timeProblem = $derived(callTime && 'problem' in callTime ? callTime : null);

	// Digits only, two at most. A full hour (or one that can't take a second
	// digit, 2 to 9) moves straight on to the minutes.
	function typeHour(e: Event & { currentTarget: HTMLInputElement }) {
		typedHour = e.currentTarget.value.replace(/\D/g, '').slice(0, 2);
		e.currentTarget.value = typedHour;
		if (typedHour.length === 2 || Number(typedHour) > 1) minuteInput?.focus();
	}

	function typeMinute(e: Event & { currentTarget: HTMLInputElement }) {
		typedMinute = e.currentTarget.value.replace(/\D/g, '').slice(0, 2);
		e.currentTarget.value = typedMinute;
	}

	// A tap flips between AM and PM; on the keyboard, A or P sets it.
	function flipPeriod() {
		period = period === 'AM' ? 'PM' : 'AM';
	}

	function keyPeriod(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		if (key === 'a' || key === 'p') {
			e.preventDefault();
			period = key === 'a' ? 'AM' : 'PM';
		}
	}
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

	/** The day and time as Jerrod reads them: Eastern, with the visitor's clock beside it. */
	const callWhen = $derived(describeCall(callDay, callAt, zone));

	/** The whole email: the message, then whatever call details were given. */
	const body = $derived(
		[
			message.trim(),
			callPhone.trim() && `Phone: ${callPhone.trim()}`,
			callWhen && `Good time for a call: ${callWhen}`
		]
			.filter(Boolean)
			.join('\n\n')
	);
	// A message or a number to call is enough; a number has to be a real one.
	const canSend = $derived(
		(!!message.trim() || phoneOk) &&
			(callPhone === '' || phoneOk) &&
			!dayOff &&
			!dayPast &&
			!timeProblem &&
			isEmail(replyTo) &&
			sendState !== 'sending'
	);
	const draft = $derived(drafts('Inquiry from jerrodtanner.com', body));

	async function contact() {
		sendState = 'sending';
		const error = await send('message', replyTo, body, website);
		if (error) {
			sendState = 'failed';
			sendError = error;
		} else {
			sendState = 'sent';
			message = '';
		}
	}

	// The address is copied rather than opened as a mailto: link, which does
	// nothing for anyone without a mail app.
	let addressCopied = $state(false);
	async function copyAddress() {
		try {
			await navigator.clipboard.writeText(CONTACT);
			addressCopied = true;
			setTimeout(() => (addressCopied = false), 2000);
		} catch {
			// Clipboard blocked: the address is on the page, selectable.
		}
	}

	// Typing again after a send starts a new message, so the status line from
	// the last one clears.
	$effect(() => {
		if (sendState === 'sent' && message.trim()) sendState = 'idle';
	});

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
	<!-- The headline is a promise, not a job title, so this line says what
	     the site is: a service a new visitor can hire. -->
	<p class="eyebrow">Business automation, database &amp; reporting consulting</p>
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
		Tell me what you'd like automated.
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

		<label class="call-field">
			<span>Your email</span>
			<input type="email" id="bold-reply" autocomplete="email" placeholder="you@yourbusiness.com" bind:value={replyTo} />
		</label>
		<!-- The honeypot: out of sight and out of the tab order, so only a
		     bot filling every field it finds ever puts anything in it. -->
		<input class="trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" bind:value={website} />

		<div class="call">
			<p class="call-note" class:bad={phoneWrong}>
				{phoneWrong
					? 'That doesn’t look like a US number yet: 10 digits, like (555) 234-5678.'
					: 'Add your number for a free 30-minute call about your project.'}
			</p>
			<div class="fields">
				<label class="call-field">
					<span>Phone (optional)</span>
					<input
						type="tel"
						id="call-phone"
						autocomplete="tel"
						inputmode="tel"
						placeholder="(555) 234-5678"
						aria-invalid={phoneWrong}
						value={callPhone}
						oninput={typePhone}
					/>
				</label>
				<label class="call-field">
					<span>Day (optional)</span>
					<input type="date" id="call-day" min={today} aria-invalid={!!dayOff || dayPast} bind:value={callDay} />
				</label>
				<fieldset class="call-field call-time">
					<legend>Time, optional ({zoneName(zone)})</legend>
					<!-- One pill cut in three: hour, minutes, then AM or PM. -->
					<div class="clock" class:off={timeProblem && !timeProblem.quiet}>
						<input
							id="call-hour"
							class="seg"
							inputmode="numeric"
							autocomplete="off"
							placeholder="hr"
							aria-label="Hour"
							value={typedHour}
							oninput={typeHour}
						/>
						<input
							id="call-minute"
							class="seg"
							inputmode="numeric"
							autocomplete="off"
							placeholder="min"
							aria-label="Minutes"
							bind:this={minuteInput}
							value={typedMinute}
							oninput={typeMinute}
						/>
						<button
							type="button"
							id="call-period"
							class="seg period"
							class:unset={!period}
							aria-label={period ? `${period}, tap to switch` : 'Choose AM or PM'}
							onclick={flipPeriod}
							onkeydown={keyPeriod}>{period || 'AM/PM'}</button
						>
					</div>
				</fieldset>
			</div>
			{#if dayOff || dayPast}
				<p class="call-note bad">
					{dayOff ? `That day is ${dayOff}, so no calls. Pick another day.` : 'That day has passed. Pick today or later.'}
				</p>
			{:else if timeProblem && !timeProblem.quiet}
				<p class="call-note bad" role="status">{timeProblem.problem}</p>
			{/if}
		</div>

		<button class="btn-bold" type="button" disabled={!canSend} onclick={contact}>
			{sendState === 'sending' ? 'Sending…' : 'Contact me →'}
		</button>

		{#if sendState === 'sent' || sendState === 'failed'}
			<p class="call-note" class:bad={sendState === 'failed'} role="status">
				{#if sendState === 'sent'}
					Sent. I'll reply to {replyTo.trim()}.
				{:else}
					{sendError}
					<SendMenu drafts={draft} align="left" heading="Send it with…">
						{#snippet trigger(props)}
							<button class="link" {...props}>Send it from your own email instead</button>
						{/snippet}
					</SendMenu>
				{/if}
			</p>
		{/if}

		<p class="call-note">
			Need help getting started? Use the
			<a class="link" href="/plan" onclick={(e) => select(e, '/plan')}>plan a project</a> form.
			Or copy my email,
			<button class="link email" type="button" title="Copy address" onclick={copyAddress}>{CONTACT}</button>{addressCopied ? ' (copied)' : ''},
			and send from your own email.
		</p>
	</div>
</section>

<style>
	.eyebrow {
		font: 600 0.8rem var(--font-mono);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

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

	/* The call hint sits tight over the fields it explains. */
	.call {
		display: grid;
		gap: 8px;
	}

	.email {
		font: 600 0.85rem var(--font-mono);
		color: var(--color-muted);
	}

	.email:hover {
		color: var(--color-ink);
	}

	/* The panel's one button, the same height as the pills above it. */
	.btn-bold {
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

	/* Off-screen rather than display: none, which some bots know to skip. */
	.trap {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	/* The fallback after a failed send reads as part of the sentence. */
	.link {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: var(--color-ink);
		text-decoration: underline;
		cursor: pointer;
	}

	/* Nothing to send yet, or no address to reply to. */
	.btn-bold:disabled {
		opacity: 0.4;
		cursor: default;
	}

	/* The contact form: a frosted sheet of the page's own ground laid over
	   the tiles. */
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

	/* Phone, day and time, a third of the row each; stacked on a narrow
	   phone, where a third is too small for a date. */
	.fields {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: end;
		gap: 10px;
	}

	@media (max-width: 480px) {
		.fields {
			grid-template-columns: 1fr;
		}
	}

	.call-field {
		display: grid;
		gap: 4px;
		font: 600 0.75rem var(--font-mono);
		color: var(--color-muted);
	}

	/* The same pill as the buttons beside them, and the same white as the
	   message box above. */
	.call-field input {
		padding: 12px 16px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		font: inherit;
		font-size: 0.95rem;
		color: var(--color-ink);
		background-color: var(--color-surface);
	}

	.call-field input {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
	}

	/* The time is one pill cut in three, ( hr | min | AM/PM ), the same
	   size as the pills beside it. */
	.call-time {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.call-time legend {
		padding: 0;
		margin-bottom: 4px;
	}

	.clock {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr);
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background-color: var(--color-surface);
	}

	.clock:focus-within {
		border-color: var(--color-ink);
	}

	.clock.off {
		border-color: var(--color-warn, var(--color-ink));
	}

	.clock .seg {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		padding: 12px 6px;
		border: 0;
		border-radius: 0;
		font: inherit;
		font-size: 0.95rem;
		text-align: center;
		color: var(--color-ink);
		background: none;
	}

	/* The cuts between the three parts. */
	.clock .seg + .seg {
		border-left: 1px solid var(--color-line);
	}

	.clock .seg:focus-visible {
		outline: none;
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
	}

	.clock .period {
		font-weight: 700;
		cursor: pointer;
	}

	.clock .period.unset {
		font-weight: 600;
		color: var(--color-muted);
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
