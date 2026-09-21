<script lang="ts">
	import { page } from '$app/state';
	import { session } from '$lib/state/session.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import ThemeSwitcher from './ThemeSwitcher.svelte';

	const links = [
		{ href: '/work', label: 'Work' },
		{ href: '/resume', label: 'Resume' },
		{ href: '/plan', label: 'Plan' },
		{ href: '/music', label: 'Music' },
		{ href: '/writing', label: 'Writing' },
		{ href: '/arcade', label: 'Arcade' }
	];

	const path = $derived(page.url.pathname);
	const isActive = (href: string) => path === href || path.startsWith(`${href}/`);
</script>

<header class="sticky top-0 z-20 px-4 pt-4 sm:px-6">
	<nav class="panel mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5">
		<a href="/" class="flex shrink-0 items-baseline gap-2 pr-1">
			<span class="text-accent font-mono text-sm font-bold tracking-tight">slimewave</span>
			<span class="text-muted hidden font-mono text-[11px] sm:inline">jerrod tanner</span>
		</a>

		<div class="hidden flex-1 items-center gap-0.5 md:flex">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="px-2.5 py-1.5 font-mono text-[13px] transition-colors"
					style:color={isActive(link.href) ? 'var(--color-accent)' : 'var(--color-muted)'}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="ml-auto flex items-center gap-2">
			<!-- The backdrop toggle is here rather than buried in settings:
			     a running 3D scene behind the page is something a visitor
			     should be able to turn off in one click. -->
			<button
				type="button"
				class="btn-ghost hidden sm:block"
				onclick={() => ui.toggleBackdrop()}
				title="Toggle the 3D backdrop behind the page"
			>
				{ui.backdrop === 'ambient' ? 'backdrop: on' : 'backdrop: off'}
			</button>

			<ThemeSwitcher />

			{#if session.isOwner}
				<a href="/admin" class="btn-ghost hidden sm:block">admin</a>
			{:else if !session.loading && !session.signedIn}
				<a href="/login" class="btn-ghost hidden sm:block">sign in</a>
			{/if}

			<button
				type="button"
				class="btn-ghost md:hidden"
				aria-expanded={ui.navOpen}
				onclick={() => (ui.navOpen = !ui.navOpen)}
			>
				menu
			</button>
		</div>
	</nav>

	{#if ui.navOpen}
		<div class="panel mx-auto mt-2 max-w-6xl p-2 md:hidden">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="block px-2.5 py-2 font-mono text-sm"
					style:color={isActive(link.href) ? 'var(--color-accent)' : 'var(--color-ink)'}
					onclick={() => (ui.navOpen = false)}
				>
					{link.label}
				</a>
			{/each}
			<div class="rule mt-2 flex items-center gap-2 pt-2">
				<button type="button" class="btn-ghost" onclick={() => ui.toggleBackdrop()}>
					{ui.backdrop === 'ambient' ? 'backdrop: on' : 'backdrop: off'}
				</button>
				{#if session.isOwner}
					<a href="/admin" class="btn-ghost" onclick={() => (ui.navOpen = false)}>admin</a>
				{:else if !session.signedIn}
					<a href="/login" class="btn-ghost" onclick={() => (ui.navOpen = false)}>sign in</a>
				{/if}
			</div>
		</div>
	{/if}
</header>
