<script lang="ts">
	import { page } from '$app/state';
	import PageShell from '$lib/components/PageShell.svelte';
	import { endpoints, type DocumentSummary } from '$lib/api/client';
	import { session } from '$lib/state/session.svelte';

	const slug = $derived(page.params.slug ?? '');

	let doc = $state<DocumentSummary | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		const requested = slug;
		loading = true;
		error = null;
		endpoints
			.document(requested)
			.then((res) => {
				if (requested === slug) doc = res.document;
			})
			.catch((err) => {
				if (requested === slug) error = err.message;
			})
			.finally(() => {
				if (requested === slug) loading = false;
			});
	});

	// Documents are plain text with blank-line paragraphs. Rendering them as
	// text rather than HTML keeps the body from ever becoming an injection
	// vector, at the cost of markup I do not need here.
	const paragraphs = $derived(
		(doc?.body ?? '')
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter(Boolean)
	);
</script>

<svelte:head>
	<title>{doc?.title ?? 'Writing'} — slimewave</title>
</svelte:head>

<PageShell title={doc?.title ?? (loading ? '…' : 'Not found')} lede={doc?.summary}>
	{#snippet actions()}
		<a class="btn-ghost" href="/writing">← writing</a>
		{#if session.isOwner && doc}
			<a class="btn-ghost" href="/admin?edit={doc.slug}">edit</a>
		{/if}
	{/snippet}

	{#if loading}
		<p class="label">loading…</p>
	{:else if error}
		<p class="panel px-4 py-3 text-sm" style:color="var(--color-warn)">{error}</p>
	{:else if doc}
		{#if !doc.published}
			<p class="panel mb-6 px-4 py-2 font-mono text-xs" style:color="var(--color-warn)">
				draft — only you can see this
			</p>
		{/if}
		<article class="prose-slim">
			{#each paragraphs as paragraph, i (i)}
				<p>{paragraph}</p>
			{/each}
		</article>
	{/if}
</PageShell>
