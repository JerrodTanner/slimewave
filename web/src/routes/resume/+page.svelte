<script lang="ts">
	import Markdown from '$lib/components/Markdown.svelte';
	import { parse, sections, type Block, type Section } from '$lib/content/markdown';
	import { RESUME_MD } from '$lib/content/resume';

	/**
	 * The resume, laid out as the PDF lays it out.
	 *
	 * The Markdown in lib/content is still the source; this file is only the
	 * typesetting. The PDF's structure maps onto it cleanly, so the shape is
	 * read off the document rather than hard-coded:
	 *
	 *   `##` with `###` children -> a full-width band, each `###` a row of
	 *                               label-on-the-left, bullets-on-the-right
	 *   `##` without             -> a half-width cell, paired with its neighbour
	 *
	 * which gives the name beside the summary, the two skill lists beside each
	 * other, and everything from Work Experience down in the label/bullet
	 * columns — the same reading order as the printed page.
	 */
	const doc = parse(RESUME_MD);

	type Band = { kind: 'pair'; cells: Section[] } | { kind: 'wide'; section: Section };

	const isList = (block: Block) => block.type === 'list';
	const withHeading = (section: Section, blocks: Block[]) =>
		section.heading ? [section.heading as Block, ...blocks] : blocks;

	function bandsOf(all: Section[]): Band[] {
		const bands: Band[] = [];
		let pending: Section[] = [];

		const flush = () => {
			while (pending.length) {
				bands.push({ kind: 'pair', cells: pending.splice(0, 2) });
			}
		};

		for (const section of all) {
			if (section.blocks.some((b) => b.type === 'heading' && b.level === 3)) {
				flush();
				bands.push({ kind: 'wide', section });
			} else {
				pending.push(section);
				if (pending.length === 2) flush();
			}
		}

		flush();
		return bands;
	}

	const bands = bandsOf(sections(doc, 2));
</script>

<svelte:head>
	<title>Resume — slimewave</title>
</svelte:head>

<div class="paper">
	<div class="sheet">
		{#each bands as band, i}
			<div class="band" class:last={i === bands.length - 1}>
				{#if band.kind === 'pair'}
					<div class="pair">
						{#each band.cells as cell}
							<div class="cell" class:masthead={cell.heading === null}>
								<Markdown blocks={withHeading(cell, cell.blocks)} />
							</div>
						{/each}
					</div>
				{:else}
					{#if band.section.heading}
						<Markdown blocks={[band.section.heading]} />
					{/if}
					{#each sections(band.section.blocks, 3) as entry}
						<div class="row">
							<div class="rowlabel">
								<Markdown blocks={withHeading(entry, entry.blocks.filter((b) => !isList(b)))} />
							</div>
							<div class="rowbody">
								<Markdown blocks={entry.blocks.filter(isList)} />
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	/* --- the paper -------------------------------------------------------
	   Lifted from the PDF: #f5f5dc stock, #56382e headings, #343434 body,
	   #888 rules, Arial throughout. Deliberately outside the theme tokens —
	   the printed resume has one look and this is it, whichever theme the
	   rest of the site is wearing. */
	.paper {
		container-type: inline-size;
		min-height: 100%;
		background-color: #f5f5dc;
		color: #343434;
	}

	.sheet {
		/* The PDF is 10pt on a 612pt page; this holds that ratio as the frame's
		   window grows, so the page fills the space without blowing up. */
		font-size: clamp(12.5px, 1.65cqi, 17px);
		font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
		line-height: 1.34;
		padding: clamp(1.4rem, 4cqi, 3.1rem) clamp(1.2rem, 4.5cqi, 3.5rem) 4rem;
	}

	/* --- bands: what the rules divide ------------------------------------ */
	.band {
		padding: 1.5em 0;
		border-bottom: 1px solid #888888;
	}

	.band:first-child {
		padding-top: 0.6em;
	}

	.band.last {
		border-bottom: 0;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2.2em;
	}

	/* Name at the top of the block, contact details at the foot of it. */
	.masthead {
		display: flex;
		flex-direction: column;
		min-height: 6.5em;
	}

	.masthead :global(h1) {
		margin-bottom: auto;
	}

	/* --- rows: the label column and the bullet column --------------------- */
	.row {
		display: grid;
		grid-template-columns: 36% 1fr;
		gap: 1.4em;
		margin-top: 1.5em;
	}

	.row:first-of-type {
		margin-top: 0.7em;
	}

	.rowlabel :global(p) {
		margin: 0;
	}

	/* --- type ------------------------------------------------------------- */
	.sheet :global(h1),
	.sheet :global(h2),
	.sheet :global(h3) {
		font-family: inherit;
		letter-spacing: normal;
		line-height: 1.15;
	}

	.sheet :global(h1) {
		font-size: 2em;
		font-weight: 400;
		color: #56382e;
	}

	.sheet :global(h2) {
		font-size: 1.4em;
		font-weight: 400;
		color: #56382e;
		margin-bottom: 0.15em;
	}

	.sheet :global(h3) {
		font-size: 1.1em;
		font-weight: 700;
		color: #343434;
	}

	.sheet :global(p) {
		margin: 0 0 0.35em;
	}

	/* The summary is set a point smaller than the rest of the body, as on the
	   printed page. The contact lines in the masthead are not. */
	.cell :global(p) {
		font-size: 0.9em;
	}

	.masthead :global(p) {
		font-size: 1em;
	}

	.sheet :global(em) {
		font-style: italic;
	}

	.sheet :global(a) {
		color: inherit;
		text-decoration: underline;
	}

	/* --- lists: the PDF's four bullet glyphs ------------------------------ */
	.sheet :global(ul) {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.sheet :global(li) {
		position: relative;
		padding-left: 1.6em;
		margin-bottom: 0.2em;
	}

	.sheet :global(li)::before {
		position: absolute;
		left: 0.25em;
		color: #343434;
	}

	.sheet :global(li ul) {
		margin-top: 0.2em;
		padding-left: 1.5em;
	}

	/* Skills use the diamond and the arrow; everything in the label/bullet
	   rows uses the disc and the delta. Same as the print. */
	.cell :global(li)::before {
		content: '❖';
		font-size: 0.85em;
		top: 0.1em;
	}

	.cell :global(li li)::before {
		content: '➢';
	}

	.rowbody :global(li)::before {
		content: '●';
		font-size: 0.7em;
		top: 0.28em;
	}

	.rowbody :global(li li)::before {
		content: '∆';
		font-size: 0.9em;
		top: 0.02em;
	}

	/* On a narrow window the two columns stop being columns. */
	@container (max-width: 620px) {
		.pair,
		.row {
			grid-template-columns: 1fr;
			gap: 0.9em;
		}

		.masthead {
			min-height: 0;
		}
	}
</style>
