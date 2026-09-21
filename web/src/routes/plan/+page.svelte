<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';

	/**
	 * The door the hub calls "plan a project".
	 *
	 * A questionnaire rather than a blank form: four sections of tokens, each
	 * opening a follow-up only once it has been answered in a way that leads
	 * somewhere, then a free-text box for everything tokens cannot hold. The
	 * answers become a work order.
	 *
	 * Nothing is posted: the button opens a mail draft with the brief already
	 * written, so this works with no endpoint, no third party and no stored
	 * personal data. If it ever wants a real inbox, `brief` below is the whole
	 * payload an /api/briefs handler would take — and it should, because a
	 * mailto body this long is truncated by some clients.
	 */
	const CONTACT = 'jerrod@jerrodtanner.com';

	interface Option {
		value: string;
		label: string;
		/** The way out of a group. Drawn dashed, so it is not one more thing to collect. */
		none?: boolean;
	}

	const DONT_KNOW = "Neither | Don't Know";

	const DOMAIN: Option[] = [
		{ value: 'need', label: 'I need a domain' },
		{ value: 'have', label: 'I have a domain' },
		{ value: 'neither', label: DONT_KNOW, none: true }
	];

	const WEB: Option[] = [
		{ value: 'new', label: 'Create a website' },
		{ value: 'redesign', label: 'Redesign a website' },
		{ value: 'neither', label: DONT_KNOW, none: true }
	];

	/** Reporting is the one many-of question, so it gets "None" rather than "Neither". */
	const CADENCES = ['Yearly', 'Quarterly', 'Monthly', 'Biweekly', 'Weekly', 'Daily', 'Hourly'];

	const ROLES = [
		'Owner',
		'Finance',
		'Operations',
		'Sales',
		'Board or investors',
		'Compliance'
	];

	const REP_DATA: Option[] = [
		{ value: 'have', label: 'I have the data' },
		{ value: 'collect', label: 'It needs collecting' },
		{ value: 'some', label: 'Some of each' },
		{ value: 'unknown', label: DONT_KNOW, none: true }
	];

	const DB: Option[] = [
		{ value: 'yes', label: 'Yes' },
		{ value: 'no', label: 'No' },
		{ value: 'both', label: 'Need both' },
		{ value: 'unknown', label: DONT_KNOW, none: true }
	];

	let domain = $state('');
	let domainName = $state('');

	let web = $state('');
	let adminName = $state('');
	let adminRole = $state('');
	let adminEmail = $state('');
	let adminPhone = $state('');

	let cadence = $state<string[]>([]);
	let repNone = $state(false);
	let business = $state('');
	let roles = $state<string[]>([]);
	let repData = $state('');

	let db = $state('');
	let notes = $state('');
	let from = $state('');

	/**
	 * The opt-out and a cadence cannot both be true, and whichever was just
	 * clicked wins. Handled here rather than with `bind:group` so the order the
	 * binding and the handler run in never matters.
	 */
	function toggleCadence(value: string, on: boolean) {
		cadence = on ? [...cadence, value] : cadence.filter((c) => c !== value);
		if (on) repNone = false;
	}

	function toggleNone(on: boolean) {
		repNone = on;
		if (on) cadence = [];
	}

	function toggleRole(value: string, on: boolean) {
		roles = on ? [...roles, value] : roles.filter((r) => r !== value);
	}

	// A section counts as answered once it has a token; the opt-outs count. The
	// follow-up fields are detail, not a gate — a half-filled one still makes a
	// brief worth reading.
	const answered = $derived(
		[!!domain, !!web, cadence.length > 0 || repNone, !!db].filter(Boolean).length
	);
	const ready = $derived(answered === 4);

	/** The follow-ups open on the answers that lead somewhere, never on the opt-out. */
	const showDomain = $derived(domain === 'need' || domain === 'have');
	const showWeb = $derived(web === 'new' || web === 'redesign');
	const showReporting = $derived(cadence.length > 0);

	const brief = $derived.by(() => {
		const lines = ['PROJECT BRIEF', ''];

		lines.push('DOMAIN');
		if (!domain) lines.push('—');
		else if (domain === 'neither') lines.push('Neither / does not know yet — no domain in scope.');
		else {
			const name = domainName.trim() || '(not given yet)';
			lines.push(domain === 'need' ? `Needs a domain — wants ${name}` : `Has a domain — ${name}`);
		}
		lines.push('');

		lines.push('WEB DESIGN');
		if (!web) lines.push('—');
		else if (web === 'neither')
			lines.push('Neither / does not know yet — no website work in scope.');
		else {
			lines.push(
				web === 'new' ? 'Wants a website created.' : 'Wants an existing website redesigned.'
			);
			const admin = [adminName.trim(), adminRole.trim()].filter(Boolean).join(', ');
			const reach = [adminEmail.trim(), adminPhone.trim()].filter(Boolean).join(' · ');
			lines.push(`Site administrator: ${admin || '(not given yet)'}`);
			if (reach) lines.push(`Reach them at: ${reach}`);
		}
		lines.push('');

		lines.push('REPORTING');
		if (repNone) lines.push('None / does not know yet — no reporting in scope.');
		else if (cadence.length === 0) lines.push('—');
		else {
			lines.push(`Cadence: ${cadence.join(', ').toLowerCase()}`);
			lines.push(`Business: ${business.trim() || '(not given yet)'}`);
			lines.push(`Reports go to: ${roles.length ? roles.join(', ') : '(not chosen yet)'}`);
			lines.push(
				`Data: ${
					repData === 'have'
						? 'already collected.'
						: repData === 'collect'
							? 'needs collecting.'
							: repData === 'some'
								? 'partly collected, the rest needs gathering.'
								: repData === 'unknown'
									? 'not known yet.'
									: '(not chosen yet)'
				}`
			);
		}
		lines.push('');

		lines.push('DATABASE');
		lines.push(
			db === 'yes'
				? 'Moving off Excel to a real database.'
				: db === 'no'
					? 'Staying on Excel.'
					: db === 'both'
						? 'Wants a database, with Excel kept alongside it.'
						: db === 'unknown'
							? 'Neither / does not know yet.'
							: '—'
		);

		if (notes.trim()) {
			lines.push('', 'IN THEIR OWN WORDS', notes.trim());
		}

		if (from.trim()) {
			lines.push('', `Reply to: ${from.trim()}`);
		}

		return lines.join('\n');
	});

	const mailto = $derived(
		`mailto:${CONTACT}?subject=${encodeURIComponent('Project brief')}&body=${encodeURIComponent(brief)}`
	);

	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(brief);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard blocked: the brief is on screen anyway, selectable.
			copied = false;
		}
	}
</script>

{#snippet radios(name: string, options: Option[], current: string, set: (value: string) => void)}
	<div class="tokens" role="radiogroup" aria-labelledby="{name}-ask">
		{#each options as option (option.value)}
			<label class="token" class:token-none={option.none}>
				<input
					type="radio"
					{name}
					value={option.value}
					checked={current === option.value}
					onchange={() => set(option.value)}
				/>
				<span class="pip"></span>{option.label}
			</label>
		{/each}
	</div>
{/snippet}

<svelte:head>
	<title>Plan a project — slimewave</title>
</svelte:head>

<PageShell
	title="Plan a project"
	lede="Fill out the questionnaire to build a work order for the type of work you want done."
>
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:items-start">
		<form class="flex min-w-0 flex-col gap-4" onsubmit={(e) => e.preventDefault()}>
			<div class="sec">
				<span class="cap"></span>
				<div class="sechead"><span class="secname">DOMAIN</span></div>
				<p class="ask" id="domain-ask">Where does this live on the web?</p>
				{@render radios('domain', DOMAIN, domain, (v) => (domain = v))}
				{#if showDomain}
					<div class="more">
						<div class="flex flex-col gap-1.5">
							<label class="label" for="domain-name">
								{domain === 'need' ? 'The domain you want' : 'The domain you have'}
							</label>
							<input
								class="field"
								type="text"
								id="domain-name"
								bind:value={domainName}
								placeholder={domain === 'need' ? 'thenameyouwant.com' : 'northlineheating.com'}
							/>
						</div>
					</div>
				{/if}
			</div>

			<div class="sec">
				<span class="cap"></span>
				<div class="sechead"><span class="secname">WEB DESIGN</span></div>
				<p class="ask" id="web-ask">Is there a site to build, or one to put right?</p>
				{@render radios('web', WEB, web, (v) => (web = v))}
				{#if showWeb}
					<div class="more">
						<p class="label">
							Who administers the site? This is the person I will need for DNS, hosting and
							whatever is on there now.
						</p>
						<div class="pair">
							<div class="flex flex-col gap-1.5">
								<label class="label" for="admin-name">Name</label>
								<input class="field" type="text" id="admin-name" bind:value={adminName} />
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="label" for="admin-role">Role</label>
								<input class="field" type="text" id="admin-role" bind:value={adminRole} />
							</div>
						</div>
						<div class="pair">
							<div class="flex flex-col gap-1.5">
								<label class="label" for="admin-email">Email</label>
								<input
									class="field"
									type="email"
									id="admin-email"
									autocomplete="off"
									bind:value={adminEmail}
								/>
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="label" for="admin-phone">Phone (optional)</label>
								<input class="field" type="tel" id="admin-phone" bind:value={adminPhone} />
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="sec">
				<span class="cap"></span>
				<div class="sechead"><span class="secname">REPORTING</span></div>
				<p class="ask" id="cadence-ask">What is the frequency of your reporting needs?</p>
				<div class="tokens tokens-many" role="group" aria-labelledby="cadence-ask">
					{#each CADENCES as option (option)}
						<label class="token">
							<input
								type="checkbox"
								checked={cadence.includes(option)}
								onchange={(e) => toggleCadence(option, e.currentTarget.checked)}
							/>
							<span class="pip"></span>{option}
						</label>
					{/each}
				</div>
				<!-- On its own line: picking it clears every cadence above and shuts
				     the follow-up, which is not what the row above it does. -->
				<div class="tokens mt-2">
					<label class="token token-none">
						<input
							type="checkbox"
							checked={repNone}
							onchange={(e) => toggleNone(e.currentTarget.checked)}
						/>
						<span class="pip"></span>None | Don't Know
					</label>
				</div>

				{#if showReporting}
					<div class="more">
						<div class="flex flex-col gap-1.5">
							<label class="label" for="business">What sort of business is this?</label>
							<input
								class="field"
								type="text"
								id="business"
								bind:value={business}
								placeholder="regional HVAC contractor, 40 staff"
							/>
						</div>

						<div class="flex flex-col gap-1.5">
							<span class="label" id="roles-ask">Who reads the reports?</span>
							<div class="tokens tokens-many" role="group" aria-labelledby="roles-ask">
								{#each ROLES as role (role)}
									<label class="token">
										<input
											type="checkbox"
											checked={roles.includes(role)}
											onchange={(e) => toggleRole(role, e.currentTarget.checked)}
										/>
										<span class="pip"></span>{role}
									</label>
								{/each}
							</div>
						</div>

						<div class="flex flex-col gap-1.5">
							<span class="label" id="repdata-ask">Where does the data stand?</span>
							{@render radios('repdata', REP_DATA, repData, (v) => (repData = v))}
						</div>
					</div>
				{/if}
			</div>

			<div class="sec">
				<span class="cap"></span>
				<div class="sechead"><span class="secname">DATABASE</span></div>
				<p class="ask" id="db-ask">Moving off Excel to a real database?</p>
				{@render radios('db', DB, db, (v) => (db = v))}
			</div>

			<div class="sec">
				<span class="cap"></span>
				<div class="sechead">
					<span class="secname">DESCRIBE WHAT YOU WANT BUILT.</span>
					<span class="state" class:state-set={notes.trim().length > 0}>
						{notes.trim() ? 'WRITTEN' : 'OPTIONAL'}
					</span>
				</div>
				<label class="sr-only" for="notes">Describe what you want built</label>
				<textarea class="field notes" id="notes" rows="4" bind:value={notes}></textarea>
			</div>

			<div class="sec">
				<span class="cap"></span>
				<div class="sechead"><span class="secname">REPLY TO</span></div>
				<div class="flex flex-col gap-1.5">
					<label class="label" for="from">
						Your email. Optional — your mail client will carry it anyway.
					</label>
					<input class="field" type="email" id="from" autocomplete="email" bind:value={from} />
				</div>
				<div class="mt-3.5 flex flex-wrap items-center gap-3">
					<a
						class="btn-accent"
						class:pointer-events-none={!ready}
						class:opacity-40={!ready}
						aria-disabled={!ready}
						href={mailto}
					>
						OPEN THE BRIEF IN MAIL
					</a>
					<button type="button" class="btn-ghost" onclick={copy}>
						{copied ? 'COPIED' : 'COPY THE BRIEF'}
					</button>
					<span class="label">
						{ready
							? 'All four answered — the draft is ready.'
							: 'Answer all four and the mail draft unlocks.'}
					</span>
				</div>
			</div>
		</form>

		<aside class="panel flex min-w-0 flex-col gap-2.5 self-start p-4 lg:sticky lg:top-3">
			<h2 class="secname">THE BRIEF</h2>
			<div class="flex items-center gap-2">
				<span class="label tabular-nums">{answered}/4</span>
				<span class="track"><span class="track-fill" style:width="{(answered / 4) * 100}%"></span></span>
			</div>
			<p class="text-muted text-sm leading-relaxed">
				This is all that gets sent, and it fills in as you answer. Nothing is posted to the server
				and nothing is stored in your browser.
			</p>
			<pre class="brief">{brief}</pre>
		</aside>
	</div>
</PageShell>

<style>
	/* --- a section ------------------------------------------------------
	   Ruled like the door tiles on the hub: a hairline box on raised stock
	   with a patterned cap down the left edge. */
	.sec {
		position: relative;
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 2px);
		background-color: var(--color-surface-raised);
		padding: 0.95rem 1rem 1.05rem 1.75rem;
		overflow: hidden;
	}

	/* The checker strip every section wears, in the accent the theme is in. */
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

	.sechead {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-bottom: 0.4rem;
	}

	.secname {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.12em;
	}

	/* The same 55% accent the caps are printed in, so the tag reads as part of
	   the furniture rather than as something left to answer. */
	.state {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		color: color-mix(in srgb, var(--color-accent) 55%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
		border-radius: var(--radius-panel);
		padding: 0.1rem 0.4rem;
	}

	.state-set {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.ask {
		font-size: 1.0625rem;
		margin-bottom: 0.75rem;
		text-wrap: balance;
	}

	/* --- the tokens ----------------------------------------------------- */
	.tokens {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.token {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: var(--color-bg-deep);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		padding: 0.5rem 0.8rem;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			color 120ms ease,
			background-color 120ms ease;
	}

	/* The control itself is hidden, not replaced: the label still drives it, so
	   the group keeps its keyboard behaviour and its screen-reader role. */
	.token input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		margin: 0;
		pointer-events: none;
	}

	/* The bullet: a square for one-of, a wider bar for many-of, so the two
	   kinds of token are never mistaken for each other. */
	.pip {
		width: 9px;
		height: 9px;
		flex: 0 0 auto;
		border: 1px solid var(--color-muted);
	}

	.tokens-many .pip {
		width: 15px;
	}

	.token:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.token:hover .pip {
		border-color: var(--color-accent);
	}

	.token:has(input:checked) {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-ink);
		font-weight: 600;
	}

	.token:has(input:checked) .pip {
		border-color: var(--color-accent-ink);
		background-color: var(--color-accent-ink);
	}

	.token:has(input:focus-visible) {
		outline: 2px solid var(--color-accent-2);
		outline-offset: 2px;
	}

	/* The way out of a group. Dashed while it is not the answer. */
	.token-none {
		border-style: dashed;
		color: var(--color-muted);
	}

	.token-none:has(input:checked) {
		border-style: solid;
	}

	/* --- the follow-up a token opens ------------------------------------ */
	.more {
		margin-top: 0.9rem;
		padding-top: 0.9rem;
		border-top: 1px dashed color-mix(in srgb, var(--color-line) 60%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	@media (max-width: 34rem) {
		.pair {
			grid-template-columns: 1fr;
		}
	}

	.notes {
		resize: vertical;
		min-height: 5.5rem;
		line-height: 1.55;
		margin-top: 0.4rem;
	}

	/* --- the brief ------------------------------------------------------- */
	.track {
		flex: 1 1 auto;
		height: 6px;
		overflow: hidden;
		border: 1px solid var(--color-line);
		background-color: var(--color-bg-deep);
	}

	.track-fill {
		display: block;
		height: 100%;
		background-color: var(--color-accent);
		transition: width 160ms ease;
	}

	.brief {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--color-muted);
		background-color: var(--color-bg-deep);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		padding: 0.75rem;
		max-height: 24rem;
		overflow: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.token,
		.track-fill {
			transition: none;
		}
	}
</style>
