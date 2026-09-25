<script lang="ts">
	import { theme } from '$lib/theme/theme.svelte';
	import { THEMES, themeById } from '$lib/theme/themes';
	import { cardPlate } from '$lib/state/cardPlate.svelte';
	import { ui } from '$lib/state/ui.svelte';

	/**
	 * The cog in the header card, and what it drops down.
	 *
	 * Two rows, and deliberately only two: how much machinery the site admits
	 * to, and which theme it wears. Both are settings in the real sense —
	 * chosen once and then left alone — which is what earns them a menu
	 * instead of a permanent chip in the header.
	 *
	 * The themes are shown as tokens rather than a named list because the
	 * swatch is the honest preview: three colours are what a theme actually
	 * is. The active one is named above the row, since a token alone cannot
	 * say which is which.
	 */
	const active = $derived(themeById(theme.current));

	function pickPlate(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void cardPlate.setFile(file);
		// Cleared so picking the same file twice still fires a change.
		input.value = '';
	}
</script>

<div class="wrap">
	<button
		type="button"
		class="cog"
		class:cog-open={ui.settingsOpen}
		aria-label="Site settings"
		aria-expanded={ui.settingsOpen}
		aria-haspopup="true"
		onclick={() => (ui.settingsOpen = !ui.settingsOpen)}
	>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="8.2" />
			<circle cx="12" cy="12" r="3" />
			<g stroke-width="2.1">
				<path d="M12 3.8V1.6" />
				<path d="M12 20.2v2.2" />
				<path d="M20.2 12h2.2" />
				<path d="M3.8 12H1.6" />
				<path d="M17.8 6.2l1.55-1.55" />
				<path d="M17.8 17.8l1.55 1.55" />
				<path d="M6.2 17.8l-1.55 1.55" />
				<path d="M6.2 6.2L4.65 4.65" />
			</g>
		</svg>
	</button>

	{#if ui.settingsOpen}
		<!-- Click-away layer. Deliberately not a <dialog>: this should never
		     trap focus or block the page behind it. -->
		<button
			type="button"
			class="away"
			aria-label="Close settings"
			onclick={() => (ui.settingsOpen = false)}
		></button>

		<div class="menu">
			<div class="notch"></div>

			<div class="row">
				<span class="label">Mode</span>
				<div class="seg">
					<button
						type="button"
						class:seg-on={ui.mode === 'simple'}
						onclick={() => ui.setMode('simple')}>simple</button
					>
					<button
						type="button"
						class:seg-on={ui.mode === 'advanced'}
						onclick={() => ui.setMode('advanced')}>advanced</button
					>
				</div>
			</div>

			<div class="row row-themes">
				<div class="themehead">
					<span class="label">Theme</span>
					<span class="themename">{active.name}</span>
				</div>
				<!-- The menu stays open on a pick: choosing a theme is a thing
				     you do by comparing, not by committing once. -->
				<div class="tokens">
					{#each THEMES as t (t.id)}
						<button
							type="button"
							class="token"
							class:token-on={t.id === theme.current}
							title={t.name}
							aria-label={t.name}
							aria-pressed={t.id === theme.current}
							onclick={() => theme.set(t.id)}
						>
							{#each t.swatch as color (color)}
								<span style:background-color={color}></span>
							{/each}
						</button>
					{/each}
				</div>
			</div>

			<!-- The bench, in both modes. A pick is read off disk and kept in
			     this browser; nothing is uploaded. -->
			<div class="row row-plate">
				<div class="themehead">
					<span class="label">Backdrop</span>
					<span class="themename">{cardPlate.opacity}%</span>
				</div>

				<input
					id="card-plate-opacity"
					type="range"
					min="0"
					max="50"
					step="1"
					value={cardPlate.opacity}
					oninput={(e) => cardPlate.setOpacity(e.currentTarget.valueAsNumber)}
					aria-label="How much of the backdrop shows"
				/>

				<div class="bench">
					<label class="pick">
						choose backdrop
						<input type="file" accept="image/*" onchange={pickPlate} />
					</label>
					{#if cardPlate.custom}
						<a class="pick" href={cardPlate.custom} download="card-plate.webp">save</a>
					{/if}
				</div>

				{#if cardPlate.notice}
					<p class="notice">{cardPlate.notice}</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	/* No border: the cog is part of the name beside it, not a control docked
	   next to it. The open state is a wash rather than an outline for the
	   same reason. */
	.cog {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 0;
		border-radius: var(--radius-panel);
		color: var(--color-accent);
		background-color: transparent;
		transition: background-color 120ms ease;
	}

	.cog:hover {
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
	}

	.cog-open {
		background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.away {
		position: fixed;
		inset: 0;
		z-index: 30;
		cursor: default;
	}

	.menu {
		position: absolute;
		top: calc(100% + 11px);
		left: -10px;
		z-index: 40;
		width: 304px;
		background-color: var(--color-surface-raised);
		border: 1px solid var(--color-line-bright);
		border-radius: var(--radius-panel);
	}

	/* Points at the cog, which is what the menu came out of. */
	.notch {
		position: absolute;
		top: -5px;
		left: 20px;
		width: 8px;
		height: 8px;
		transform: rotate(45deg);
		background-color: var(--color-surface-raised);
		border-left: 1px solid var(--color-line-bright);
		border-top: 1px solid var(--color-line-bright);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 10px 11px;
	}

	.row-themes {
		flex-direction: column;
		align-items: stretch;
		gap: 0.55rem;
		padding-bottom: 12px;
		border-top: 1px solid var(--color-line);
	}

	.seg {
		margin-left: auto;
		display: flex;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
	}

	.seg button {
		padding: 4px 11px;
		border: 0;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.02em;
		color: var(--color-muted);
		background-color: transparent;
	}

	.seg button:hover {
		color: var(--color-ink);
	}

	.seg .seg-on,
	.seg .seg-on:hover {
		color: var(--color-accent-ink);
		background-color: var(--color-accent);
	}

	.themehead {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.themename {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-accent);
	}

	.tokens {
		display: flex;
		gap: 7px;
	}

	/* The gap between the bars is the card showing through, which is what
	   gives each token its hairlines. */
	.token {
		width: 34px;
		height: 30px;
		padding: 0;
		display: flex;
		gap: 1px;
		overflow: hidden;
		background-color: var(--color-line);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
	}

	.token:hover {
		border-color: var(--color-line-bright);
	}

	.token span {
		flex: 1;
	}

	.token-on,
	.token-on:hover {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}

	/* --- the plate bench ------------------------------------------------- */
	.row-plate {
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		padding-bottom: 12px;
		border-top: 1px solid var(--color-line);
	}

	.row-plate input[type='range'] {
		width: 100%;
		height: 3px;
		appearance: none;
		border-radius: 999px;
		background-color: var(--color-line);
	}

	.row-plate input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 13px;
		height: 13px;
		border: 0;
		border-radius: 999px;
		background-color: var(--color-accent);
	}

	.row-plate input[type='range']::-moz-range-thumb {
		width: 13px;
		height: 13px;
		border: 0;
		border-radius: 999px;
		background-color: var(--color-accent);
	}

	.bench {
		display: flex;
		gap: 0.4rem;
	}

	/* One shape for both, though one is a label and the other a link. */
	.pick {
		flex: 1;
		padding: 4px 0;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-muted);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background-color: transparent;
		cursor: pointer;
	}

	.pick:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* The input stays in the label so a click anywhere on it opens the picker,
	   and stays focusable so the keyboard can still reach it. */
	.pick input[type='file'] {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.notice {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		line-height: 1.4;
		color: var(--color-warn);
	}
</style>
