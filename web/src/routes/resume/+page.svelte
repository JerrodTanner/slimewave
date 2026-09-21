<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import { endpoints, type DocumentSummary } from '$lib/api/client';

	// The PDF is the canonical resume and is served straight off disk by Go.
	// If I have also written a `resume` document, it renders below as the
	// readable version — no PDF viewer required.
	const PDF_URL = '/media/docs/Jerrod%20Tanner%20Resume.pdf';

	let doc = $state<DocumentSummary | null>(null);
	let loaded = $state(false);

	// Asked for by kind rather than by slug: not having written the text
	// version yet is a normal state, and a list query answers that with an
	// empty array instead of a 404 in everyone's console.
	$effect(() => {
		endpoints
			.documents({ kind: 'resume', full: true })
			.then(({ documents }) => (doc = documents[0] ?? null))
			.catch(() => (doc = null))
			.finally(() => (loaded = true));
	});
</script>

<svelte:head>
	<title>Resume — slimewave</title>
</svelte:head>

<PageShell title="Resume" lede="The PDF is the one to send along. The text below is the same thing, readable.">
	{#snippet actions()}
		<a class="btn-accent" href={PDF_URL} download>download pdf</a>
		<a class="btn-ghost" href={PDF_URL} target="_blank" rel="noreferrer">open</a>
	{/snippet}

	<div class="panel overflow-hidden" style:height="min(80vh, 900px)">
		<object data={PDF_URL} type="application/pdf" class="h-full w-full" title="Resume PDF">
			<div class="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
				<p class="text-muted text-sm">
					This browser will not display the PDF inline.
				</p>
				<a class="btn-accent" href={PDF_URL} download>download it instead</a>
			</div>
		</object>
	</div>

	{#if loaded && doc}
		<article class="prose-slim mt-10">
			<h2>{doc.title}</h2>
			{#each doc.body.split(/\n{2,}/) as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</article>
	{/if}
</PageShell>
