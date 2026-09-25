<script lang="ts">
	import SineMark from './SineMark.svelte';

	/**
	 * The cover over the corridor, and the only way in.
	 *
	 * Opaque on purpose: the canvas behind it is paused, so there is nothing
	 * worth showing through, and a first view that is a mark rather than a
	 * camera reads as an invitation instead of an ambush. The corridor is
	 * drawn here a second time as a flat schematic — cheap, and it says what
	 * is behind the door.
	 *
	 * It is a real <button>, so the gate opens on Enter and Space as well as
	 * on a click, and screen readers get told what it does.
	 *
	 * `compact` is the same cover on a rail tile once a door has taken the big
	 * screen. It is the one that has to stay legible at about a fifth of the
	 * size, so the lockup loses the drawn mark and the furniture drops away —
	 * what is left is the one thing the cover is for, which is the button.
	 *
	 * `sealed` is the cover with nothing behind it to open: simple mode keeps
	 * the corridor a backdrop, so the same picture stays over it but the way
	 * in is gone. It is a plain box then rather than a button, which is what
	 * takes the lockup out of the tab order along with the call to action.
	 */
	let {
		onenter,
		compact = false,
		sealed = false
	}: { onenter?: () => void; compact?: boolean; sealed?: boolean } = $props();

	// A crosshair that follows the mouse: one line edge to edge each way,
	// crossing at the cursor. Mouse and pen only — a
	// finger has no hover to follow.
	let aim = $state<{ x: number; y: number } | null>(null);

	function track(e: PointerEvent) {
		if (e.pointerType === 'touch') return;
		const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
		aim = { x: e.clientX - box.left, y: e.clientY - box.top };
	}
</script>

{#snippet cover()}
	<span class="hazard hazard-top"></span>
	<span class="hazard hazard-bottom"></span>
	<span class="bracket bracket-tl"></span>
	<span class="bracket bracket-tr"></span>
	<span class="bracket bracket-bl"></span>
	<span class="bracket bracket-br"></span>

	<svg class="schematic" viewBox="0 0 732 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
		<g stroke="var(--color-accent)" stroke-width="1" fill="none">
			<path d="M0 0 L290 222 L442 222 L732 0" />
			<path d="M0 600 L290 358 L442 358 L732 600" />
			<path d="M290 222 L290 358 M442 222 L442 358" />
			<rect x="290" y="222" width="152" height="136" />
			<path d="M101 200 L180 226 L180 450 L101 514 Z" />
			<path d="M631 200 L552 226 L552 450 L631 514 Z" />
			<path d="M232 246 L276 258 L276 386 L232 404 Z" />
			<rect x="332" y="266" width="68" height="92" />
			<path d="M0 516 L732 516 M92 452 L640 452 M164 410 L568 410" />
		</g>
	</svg>

	{#if aim}
		<span class="cross cross-v" style:transform="translateX({aim.x}px)"></span>
		<span class="cross cross-h" style:transform="translateY({aim.y}px)"></span>
	{/if}

	<span class="lockup">
		<span class="wordmark">ShineWave</span>
		{#if !compact}
			<SineMark width={330} weight={1.45} />
		{/if}

		<!-- Hung below the lockup rather than stacked with it, so the mark sits
		     in the same place whether or not there is a way in. -->
		{#if !sealed}
			<span class="cta-stack">
				<span class="cta">
					<span class="blip"></span>
					CLICK TO ACTIVATE
				</span>
			</span>
		{/if}
	</span>
{/snippet}

{#if sealed}
	<div class="gate sealed" class:compact role="presentation" onpointermove={track} onpointerleave={() => (aim = null)}>{@render cover()}</div>
{:else}
	<button type="button" class="gate" class:compact onclick={onenter} onpointermove={track} onpointerleave={() => (aim = null)}>{@render cover()}</button>
{/if}

<style>
	.gate {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.6rem;
		padding: 0;
		border: 0;
		cursor: pointer;
		color: var(--color-ink);
		/* Opaque: the paused scene behind this is not meant to be seen yet. */
		background-color: var(--color-bg-deep);
		background-image: repeating-linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-line) 22%, transparent) 0 1px,
			transparent 1px 3px
		);
	}

	.cross {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		background-color: var(--color-accent);
		will-change: transform;
	}

	.cross-v {
		width: 1px;
		height: 100%;
	}

	.cross-h {
		width: 100%;
		height: 1px;
	}

	.schematic {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0.16;
	}

	.hazard {
		position: absolute;
		left: 0;
		width: 100%;
		height: 14px;
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--color-accent) 55%, transparent) 0 5px,
			transparent 5px 10px
		);
	}

	.hazard-top {
		top: 0;
	}

	.hazard-bottom {
		bottom: 0;
	}

	.bracket {
		position: absolute;
		width: 26px;
		height: 26px;
		border: 0 solid var(--color-line);
	}

	.bracket-tl {
		top: 22px;
		left: 16px;
		border-top-width: 2px;
		border-left-width: 2px;
	}

	.bracket-tr {
		top: 22px;
		right: 16px;
		border-top-width: 2px;
		border-right-width: 2px;
	}

	.bracket-bl {
		bottom: 22px;
		left: 16px;
		border-bottom-width: 2px;
		border-left-width: 2px;
	}

	.bracket-br {
		bottom: 22px;
		right: 16px;
		border-bottom-width: 2px;
		border-right-width: 2px;
	}

	.lockup {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	/* The wordmark is set, not drawn, so it stays sharp at any size and takes
	   the accent from whichever theme is on. */
	.wordmark {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: clamp(2.6rem, 6vw, 4.6rem);
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.015em;
		color: var(--color-accent);
	}

	.cta-stack {
		position: absolute;
		top: calc(100% + 1.6rem);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1.9rem;
		border: 2px solid var(--color-accent);
		border-radius: calc(var(--radius-panel) + 1px);
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
		font-family: var(--font-mono);
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		white-space: nowrap;
		color: var(--color-ink);
	}

	.gate:hover .cta,
	.gate:focus-visible .cta {
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
	}

	.blip {
		width: 9px;
		height: 9px;
		background-color: currentColor;
		animation: blink 1.1s steps(1, end) infinite;
	}

	/* Nothing to press, so nothing that says it can be pressed. */
	.sealed {
		cursor: default;
	}

	/* --- the tile cover -------------------------------------------------- */
	.compact {
		gap: 0.7rem;
	}

	.compact .cta-stack {
		top: calc(100% + 0.7rem);
	}

	.compact .wordmark {
		font-size: 1.3rem;
	}

	.compact .cta {
		padding: 0.5rem 0.95rem;
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		gap: 0.5rem;
		border-width: 1px;
	}

	.compact .blip {
		width: 7px;
		height: 7px;
	}

	.compact .hazard,
	.compact .bracket {
		display: none;
	}

	@keyframes blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0.2;
		}
	}

	@media (max-width: 640px) {
		.hazard,
		.bracket {
			display: none;
		}
	}
</style>
