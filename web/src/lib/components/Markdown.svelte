<script lang="ts">
	import type { Block, Inline, ListItem } from '$lib/content/markdown';

	/**
	 * Renders a parsed Markdown document as plain elements. It ships no styling
	 * of its own: whatever wraps it owns the look, exactly like the rest of the
	 * site's copy.
	 */
	let { blocks }: { blocks: Block[] } = $props();

	const external = (href: string) => /^https?:/.test(href);
</script>

<!-- Written tight on purpose: a newline between these branches would become a
     space in the middle of a sentence. -->
{#snippet text(tokens: Inline[])}{#each tokens as token}{#if token.kind === 'strong'}<strong>{token.text}</strong>{:else if token.kind === 'em'}<em>{token.text}</em>{:else if token.kind === 'code'}<code>{token.text}</code>{:else if token.kind === 'link'}<a href={token.href} target={external(token.href) ? '_blank' : null} rel={external(token.href) ? 'noreferrer' : null}>{token.text}</a>{:else}{token.text}{/if}{/each}{/snippet}

{#snippet bullets(items: ListItem[])}
	<ul>
		{#each items as item}
			<li>{@render text(item.content)}{#if item.children.length}{@render bullets(item.children)}{/if}</li>
		{/each}
	</ul>
{/snippet}

{#each blocks as block}
	{#if block.type === 'heading'}
		{#if block.level === 1}
			<h1>{@render text(block.content)}</h1>
		{:else if block.level === 2}
			<h2>{@render text(block.content)}</h2>
		{:else if block.level === 3}
			<h3>{@render text(block.content)}</h3>
		{:else}
			<h4>{@render text(block.content)}</h4>
		{/if}
	{:else if block.type === 'paragraph'}
		<p>{@render text(block.content)}</p>
	{:else if block.type === 'list'}
		{@render bullets(block.items)}
	{:else}
		<hr />
	{/if}
{/each}
