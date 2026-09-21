<script lang="ts">
	import { theme } from '$lib/theme/theme.svelte';
	import { THEMES, themeById } from '$lib/theme/themes';
	import { ui } from '$lib/state/ui.svelte';
	import { session } from '$lib/state/session.svelte';

	const active = $derived(themeById(theme.current));
</script>

<div class="relative">
	<button
		type="button"
		class="btn-ghost flex items-center gap-2"
		aria-expanded={ui.themePanelOpen}
		aria-haspopup="true"
		onclick={() => (ui.themePanelOpen = !ui.themePanelOpen)}
	>
		<span class="flex gap-px" aria-hidden="true">
			{#each active.swatch as color (color)}
				<span class="h-3.5 w-2" style:background-color={color}></span>
			{/each}
		</span>
		<span>{active.name}</span>
	</button>

	{#if ui.themePanelOpen}
		<!-- Click-away layer. Deliberately not a <dialog>: this should never
		     trap focus or block the page behind it. -->
		<button
			type="button"
			class="fixed inset-0 z-30 cursor-default"
			aria-label="Close theme picker"
			onclick={() => (ui.themePanelOpen = false)}
		></button>

		<div class="panel-raised absolute right-0 z-40 mt-2 w-80 p-1.5">
			<p class="label px-2.5 pt-1.5 pb-2">Theme</p>
			{#each THEMES as t (t.id)}
				<button
					type="button"
					class="flex w-full items-start gap-3 px-2.5 py-2 text-left transition-colors"
					class:bg-surface-raised={t.id === theme.current}
					style:background-color={t.id === theme.current
						? 'color-mix(in srgb, var(--color-accent) 12%, transparent)'
						: undefined}
					onclick={() => {
						theme.set(t.id);
						ui.themePanelOpen = false;
					}}
				>
					<span class="mt-1 flex shrink-0 gap-px" aria-hidden="true">
						{#each t.swatch as color (color)}
							<span class="h-6 w-2.5" style:background-color={color}></span>
						{/each}
					</span>
					<span class="min-w-0">
						<span class="block text-sm font-medium">{t.name}</span>
						<span class="text-muted block text-xs leading-snug">{t.blurb}</span>
					</span>
					{#if t.id === theme.current}
						<span class="text-accent ml-auto shrink-0 font-mono text-xs">on</span>
					{/if}
				</button>
			{/each}

			<p class="label rule mt-1.5 px-2.5 pt-2 pb-1.5 leading-snug">
				{#if session.signedIn}
					Saved to your account.
				{:else}
					Saved in this browser. Sign in to carry it across devices.
				{/if}
			</p>
		</div>
	{/if}
</div>
