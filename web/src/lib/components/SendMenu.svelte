<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CONTACT, type Drafts } from '$lib/contact';

	/**
	 * The contact button's menu: the same draft in the visitor's mail app,
	 * Gmail or Outlook on the web, or just the address to copy. A bare
	 * `mailto:` does nothing for anyone without a mail app, and a site cannot
	 * add webmail to the browser's own chooser, so this is that chooser.
	 *
	 * The button itself is the caller's, handed back through `trigger`, so
	 * each page keeps its own button style; the menu supplies the behaviour.
	 *
	 * The menu is a popover, so it opens in the browser's top layer: the
	 * buttons sit in scrolling tiles and clipped sections that would cut a
	 * menu off. Being out of the flow, it is placed by hand against the
	 * button, below it when there is room and above it when there is not,
	 * and it closes on any scroll rather than drift away from the button.
	 */
	interface TriggerProps {
		type: 'button';
		disabled: boolean;
		'aria-haspopup': 'menu';
		'aria-expanded': boolean;
		onclick: () => void;
	}

	let {
		drafts,
		disabled = false,
		align = 'right',
		trigger
	}: {
		drafts: Drafts;
		disabled?: boolean;
		align?: 'left' | 'right';
		trigger: Snippet<[TriggerProps]>;
	} = $props();

	let open = $state(false);
	let copied = $state(false);
	let root = $state<HTMLElement | null>(null);
	let menu = $state<HTMLElement | null>(null);

	/** Gap between the button and the menu, and the menu and the screen edge. */
	const GAP = 6;

	// Shown in the top layer and set against the button: below it, unless the
	// screen runs out first, then above. Closed by a click anywhere else, by
	// Escape, or by any scroll or resize that would leave it behind.
	$effect(() => {
		const el = menu;
		if (!open || !el || !root) return;
		el.showPopover();
		const button = root.getBoundingClientRect();
		const below = button.bottom + GAP + el.offsetHeight <= window.innerHeight - GAP;
		el.style.top = `${below ? button.bottom + GAP : Math.max(GAP, button.top - GAP - el.offsetHeight)}px`;
		el.style.left = `${align === 'left' ? button.left : Math.max(GAP, button.right - el.offsetWidth)}px`;

		const close = () => (open = false);
		const away = (e: PointerEvent) => {
			if (root && !root.contains(e.target as Node)) close();
		};
		const esc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};
		window.addEventListener('pointerdown', away);
		window.addEventListener('keydown', esc);
		window.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);
		return () => {
			if (el.matches(':popover-open')) el.hidePopover();
			window.removeEventListener('pointerdown', away);
			window.removeEventListener('keydown', esc);
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
		};
	});

	async function copy() {
		try {
			await navigator.clipboard.writeText(CONTACT);
			copied = true;
			setTimeout(() => {
				copied = false;
				open = false;
			}, 1200);
		} catch {
			// Clipboard blocked: the address is on the page, selectable.
			open = false;
		}
	}
</script>

<span class="send" bind:this={root}>
	{@render trigger({
		type: 'button',
		disabled,
		'aria-haspopup': 'menu',
		'aria-expanded': open,
		onclick: () => (open = !open)
	})}

	{#if open}
		<div class="menu" popover="manual" role="menu" bind:this={menu}>
			<p class="head">Send with…</p>
			<a role="menuitem" href={drafts.mailto} onclick={() => (open = false)}>Mail app</a>
			<a role="menuitem" href={drafts.gmail} target="_blank" rel="noopener" onclick={() => (open = false)}>Gmail</a>
			<a role="menuitem" href={drafts.outlook} target="_blank" rel="noopener" onclick={() => (open = false)}>Outlook</a>
			<button role="menuitem" type="button" onclick={copy}>{copied ? 'Address copied' : 'Copy address'}</button>
		</div>
	{/if}
</span>

<style>
	.send {
		position: relative;
		display: inline-flex;
	}

	/* A popover is centred in the screen by default; this one is placed by
	   the script instead, against its button. */
	.menu {
		position: fixed;
		inset: auto;
		margin: 0;
		display: grid;
		min-width: 11rem;
		padding: 0.35rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: var(--color-surface-raised);
		box-shadow: 0 12px 28px rgb(0 0 0 / 0.18);
		text-align: left;
	}

	.head {
		margin: 0;
		padding: 0.3rem 0.6rem 0.35rem;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.menu a,
	.menu button {
		display: block;
		padding: 0.45rem 0.6rem;
		border: 0;
		border-radius: calc(var(--radius-panel) - 2px);
		background: none;
		font: inherit;
		font-size: 0.9375rem;
		text-align: left;
		color: var(--color-ink);
		cursor: pointer;
	}

	.menu a:hover,
	.menu button:hover,
	.menu a:focus-visible,
	.menu button:focus-visible {
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
		outline: none;
	}
</style>
