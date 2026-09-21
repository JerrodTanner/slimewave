<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';

	/**
	 * The door the hub calls "plan a project".
	 *
	 * Four questions, and the answers become a brief. Nothing is posted: the
	 * button opens a mail draft with the brief already written, so this works
	 * with no endpoint, no third party and no stored personal data. If it ever
	 * wants a real inbox, the shape below is what an /api/briefs handler would
	 * take.
	 */
	const CONTACT = 'jerrod@jerrodtanner.com';

	const QUESTIONS = [
		{
			id: 'building',
			label: 'What are you building?',
			hint: 'A sentence is plenty. What it is, who it is for.',
			rows: 3
		},
		{
			id: 'done',
			label: 'What does done look like?',
			hint: 'The thing that has to be true for this to have worked.',
			rows: 3
		},
		{
			id: 'budget',
			label: 'What is the budget, roughly?',
			hint: 'A range is fine. It decides scope more than anything else.',
			rows: 2
		},
		{
			id: 'when',
			label: 'When do you need it?',
			hint: 'A date, a season, or "no deadline".',
			rows: 2
		}
	];

	let answers = $state<Record<string, string>>({ building: '', done: '', budget: '', when: '' });
	let from = $state('');

	const ready = $derived(QUESTIONS.every((q) => answers[q.id].trim().length > 0));

	const brief = $derived(
		QUESTIONS.map((q) => `${q.label}\n${answers[q.id].trim() || '—'}`).join('\n\n') +
			(from.trim() ? `\n\nReply to: ${from.trim()}` : '')
	);

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

<svelte:head>
	<title>Plan a project — slimewave</title>
</svelte:head>

<PageShell
	title="Plan a project"
	lede="Four questions. Answer them and you get a brief you can send; I come back with a scope, a rough number and a date."
>
	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
		<form class="flex flex-col gap-6" onsubmit={(e) => e.preventDefault()}>
			{#each QUESTIONS as q (q.id)}
				<div class="flex flex-col gap-2">
					<label class="text-lg" for={q.id}>{q.label}</label>
					<p class="text-muted text-sm">{q.hint}</p>
					<textarea id={q.id} class="field" rows={q.rows} bind:value={answers[q.id]}></textarea>
				</div>
			{/each}

			<div class="flex flex-col gap-2">
				<label class="text-lg" for="from">Where do I reply?</label>
				<p class="text-muted text-sm">Optional — your mail client will carry it anyway.</p>
				<input id="from" class="field" type="email" autocomplete="email" bind:value={from} />
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<a
					class="btn-accent"
					class:pointer-events-none={!ready}
					class:opacity-50={!ready}
					aria-disabled={!ready}
					href={mailto}
				>
					open the brief in mail
				</a>
				<button type="button" class="btn-ghost" onclick={copy}>
					{copied ? 'copied' : 'copy the brief'}
				</button>
				{#if !ready}
					<span class="label">Answer all four and the mail draft unlocks.</span>
				{/if}
			</div>
		</form>

		<aside class="panel flex flex-col gap-3 self-start p-5">
			<h2 class="text-base">The brief</h2>
			<p class="text-muted text-sm leading-relaxed">
				This is all that gets sent. Nothing is posted to the server and nothing is stored in
				the browser.
			</p>
			<pre class="brief">{brief}</pre>
		</aside>
	</div>
</PageShell>

<style>
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
</style>
