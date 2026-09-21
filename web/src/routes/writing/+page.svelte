<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import { endpoints, type DocumentSummary } from '$lib/api/client';
	import { session } from '$lib/state/session.svelte';

	let documents = $state<DocumentSummary[]>([]);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		endpoints
			.documents()
			.then((res) => (documents = res.documents))
			.catch((err) => (error = err.message))
			.finally(() => (loading = false));
	});

	function formatDate(iso: string) {
		const d = new Date(iso);
		return Number.isNaN(d.valueOf())
			? ''
			: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>Writing — slimewave</title>
</svelte:head>

<PageShell title="Writing" lede="Notes on things I got working, and a few I did not.">
	{#snippet actions()}
		{#if session.isOwner}
			<a class="btn-ghost" href="/admin">manage</a>
		{/if}
	{/snippet}

	{#if loading}
		<p class="label">loading…</p>
	{:else if error}
		<p class="panel px-4 py-3 text-sm" style:color="var(--color-warn)">{error}</p>
	{:else if documents.length === 0}
		<p class="text-muted text-sm">
			Nothing published yet.{#if session.isOwner}
				<a class="underline underline-offset-4" href="/admin">Write something.</a>{/if}
		</p>
	{:else}
		<ul class="space-y-px">
			{#each documents as doc (doc.slug)}
				<li>
					<a href="/writing/{doc.slug}" class="panel block px-4 py-4 sm:px-5">
						<div class="flex flex-wrap items-baseline gap-x-3">
							<h2 class="text-xl">{doc.title}</h2>
							<span class="text-muted ml-auto font-mono text-[11px]">
								{formatDate(doc.updatedAt)}
							</span>
						</div>
						{#if doc.summary}
							<p class="text-muted mt-2 max-w-2xl text-sm leading-relaxed">{doc.summary}</p>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</PageShell>
