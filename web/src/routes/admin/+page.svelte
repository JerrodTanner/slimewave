<script lang="ts">
	import { page } from '$app/state';
	import PageShell from '$lib/components/PageShell.svelte';
	import { api, endpoints, type DocumentSummary } from '$lib/api/client';
	import { session } from '$lib/state/session.svelte';

	let documents = $state<DocumentSummary[]>([]);
	let editing = $state<DocumentSummary | null>(null);
	let status = $state<string | null>(null);
	let error = $state<string | null>(null);
	let busy = $state(false);

	const blank = (): DocumentSummary => ({
		id: 0,
		slug: '',
		title: '',
		summary: '',
		body: '',
		kind: 'note',
		published: false,
		createdAt: '',
		updatedAt: ''
	});

	async function refresh() {
		try {
			const res = await endpoints.documents({ drafts: true });
			documents = res.documents;
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'could not load documents';
		}
	}

	$effect(() => {
		if (session.isOwner) void refresh();
	});

	// /writing/<slug> links here with ?edit=<slug> so the edit button on a
	// post lands directly in the editor.
	$effect(() => {
		const slug = page.url.searchParams.get('edit');
		if (!slug || editing || documents.length === 0) return;
		const match = documents.find((d) => d.slug === slug);
		if (match) void open(match.slug);
	});

	async function open(slug: string) {
		busy = true;
		try {
			// The list view omits bodies, so the full document is fetched here.
			const { document } = await endpoints.document(slug);
			editing = { ...document };
			status = null;
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'could not open that document';
		} finally {
			busy = false;
		}
	}

	async function save() {
		if (!editing) return;
		busy = true;
		status = null;
		error = null;

		const payload = {
			slug: editing.slug,
			title: editing.title,
			summary: editing.summary,
			body: editing.body,
			kind: editing.kind,
			published: editing.published
		};

		try {
			const isNew = editing.id === 0;
			const res = isNew
				? await api.post<{ document: DocumentSummary }>('/api/documents', payload)
				: await api.put<{ document: DocumentSummary }>(
						`/api/documents/${originalSlug}`,
						payload
					);
			editing = { ...res.document };
			originalSlug = res.document.slug;
			status = isNew ? 'created' : 'saved';
			await refresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'could not save';
		} finally {
			busy = false;
		}
	}

	async function remove(slug: string) {
		// A one-click delete on a page of prose is a bad idea; confirm first.
		if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
		busy = true;
		try {
			await endpoints.deleteDocument(slug);
			if (editing?.slug === slug) editing = null;
			await refresh();
			status = 'deleted';
		} catch (err) {
			error = err instanceof Error ? err.message : 'could not delete';
		} finally {
			busy = false;
		}
	}

	// The slug the server currently knows this document by; a rename PUTs to
	// the old path with the new slug in the body.
	let originalSlug = $state('');

	function startNew() {
		editing = blank();
		originalSlug = '';
		status = null;
		error = null;
	}
</script>

<svelte:head>
	<title>Admin — ShineWave</title>
</svelte:head>

<PageShell title="Admin" lede="Documents live in SQLite. Drafts are invisible to everyone but you.">
	{#snippet actions()}
		{#if session.isOwner}
			<button class="btn-accent" type="button" onclick={startNew}>new document</button>
			<button class="btn-ghost" type="button" onclick={() => session.logout()}>sign out</button>
		{/if}
	{/snippet}

	{#if session.loading}
		<p class="label">checking your session…</p>
	{:else if !session.isOwner}
		<div class="panel max-w-md px-5 py-5">
			<p class="text-sm">This page is for the site owner.</p>
			<a class="btn-accent mt-4 inline-block" href="/login">sign in</a>
		</div>
	{:else}
		{#if error}
			<p class="panel mb-4 px-4 py-2 font-mono text-xs" style:color="var(--color-warn)" role="alert">
				{error}
			</p>
		{/if}
		{#if status}
			<p class="panel mb-4 px-4 py-2 font-mono text-xs" style:color="var(--color-accent)">
				{status}
			</p>
		{/if}

		<div class="grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr]">
			<ul class="space-y-px self-start">
				{#each documents as doc (doc.slug)}
					<li class="panel flex items-center gap-2 px-3 py-2">
						<button
							type="button"
							class="min-w-0 flex-1 text-left"
							onclick={() => {
								originalSlug = doc.slug;
								void open(doc.slug);
							}}
						>
							<span class="block truncate text-sm">{doc.title}</span>
							<span class="text-muted block truncate font-mono text-[11px]">
								{doc.slug} · {doc.published ? 'live' : 'draft'}
							</span>
						</button>
						<button
							type="button"
							class="btn-ghost shrink-0 px-2"
							onclick={() => remove(doc.slug)}
							aria-label="Delete {doc.title}"
						>
							✕
						</button>
					</li>
				{:else}
					<li class="text-muted px-1 text-sm">No documents yet.</li>
				{/each}
			</ul>

			{#if editing}
				<form
					class="panel space-y-4 px-5 py-5"
					onsubmit={(e) => {
						e.preventDefault();
						void save();
					}}
				>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label class="label mb-1.5 block" for="title">title</label>
							<input id="title" class="field" bind:value={editing.title} required />
						</div>
						<div>
							<label class="label mb-1.5 block" for="slug">
								slug <span class="opacity-60">(blank derives it from the title)</span>
							</label>
							<input id="slug" class="field" bind:value={editing.slug} />
						</div>
					</div>

					<div>
						<label class="label mb-1.5 block" for="summary">summary</label>
						<input id="summary" class="field" bind:value={editing.summary} />
					</div>

					<div>
						<label class="label mb-1.5 block" for="body">
							body <span class="opacity-60">(blank line between paragraphs)</span>
						</label>
						<textarea id="body" class="field min-h-80 leading-relaxed" bind:value={editing.body}
						></textarea>
					</div>

					<div class="flex flex-wrap items-center gap-4">
						<div class="flex items-center gap-2">
							<label class="label" for="kind">kind</label>
							<select id="kind" class="field w-auto" bind:value={editing.kind}>
								<option value="note">note</option>
								<option value="post">post</option>
								<option value="resume">resume</option>
							</select>
						</div>

						<label class="flex items-center gap-2 font-mono text-xs">
							<input type="checkbox" bind:checked={editing.published} />
							published
						</label>

						<div class="ml-auto flex gap-2">
							<button
								class="btn-ghost"
								type="button"
								onclick={() => {
									editing = null;
								}}
							>
								close
							</button>
							<button class="btn-accent" type="submit" disabled={busy}>
								{busy ? 'saving…' : 'save'}
							</button>
						</div>
					</div>
				</form>
			{:else}
				<div class="panel flex items-center justify-center px-5 py-16">
					<p class="text-muted text-sm">Pick a document, or start a new one.</p>
				</div>
			{/if}
		</div>
	{/if}
</PageShell>
