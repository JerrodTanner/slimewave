<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import HubGate from './HubGate.svelte';
	import SineMark from './SineMark.svelte';
	import { RESUME_PDF_URL } from '$lib/content/resume';
	import { crt } from '$lib/game/crt.svelte';
	import { hubGate } from '$lib/game/gate.svelte';
	import { PORTAL, PORTALS, portalForPath, type PortalKey } from '$lib/game/portals';
	import { stage } from '$lib/game/stage.svelte';
	import { gameViewport } from '$lib/game/viewport.svelte';
	import { formatTime, player } from '$lib/state/player.svelte';

	/**
	 * The furniture: a heading rule, one big window, and the doors as a rail
	 * beside it. It is mounted by the root layout, not by a route, so it
	 * survives navigation between the hub and the four doors.
	 *
	 * There are only ever two things in play and they trade places. On the hub
	 * the corridor has the big window and every door is a door. Choose one and
	 * the corridor moves into that door's tile while the section's page takes
	 * the window — see lib/game/crt.svelte.ts for the switch-off that hides
	 * the swap.
	 *
	 * The canvas is NOT a child of this component. It lives in the root layout
	 * and must never unmount; `slot` below is an empty placeholder telling the
	 * stage where to draw. Everything painted over the render — labels, HUD,
	 * viewmodel — is mounted by GameStage, because it is positioned against
	 * the canvas rather than against the page.
	 */
	let { children }: { children: Snippet } = $props();

	const path = $derived(page.url.pathname);
	/** The door we are behind, or `null` on the hub itself. */
	const active = $derived(portalForPath(path));

	/** The two placeholders the corridor can occupy. Only one exists at a time. */
	let windowScreen = $state<HTMLElement | null>(null);
	let tileScreen = $state<HTMLElement | null>(null);
	const slot = $derived(active ? tileScreen : windowScreen);

	// Synchronous, so the stage stays dark for the frame between mount and the
	// first measurement rather than painting one fullscreen canvas.
	gameViewport.intend();

	$effect(() => {
		if (!slot) return;
		return gameViewport.claim(slot);
	});

	// Swapping slots is not giving up the window; leaving the frame is. Kept
	// apart from the claim above so a power cycle cannot drop the intent
	// halfway through and let the canvas loose over the page.
	$effect(() => () => gameViewport.release());

	// Arriving anywhere in the frame arrives on standby, whether that is a
	// first visit, a walk back from a section, or a reload. The route is the
	// only dependency on purpose: `stand()` reads the gate's own state, and
	// tracking that read would slam the gate shut the instant anyone opened it.
	$effect(() => {
		const here = path;
		untrack(() => {
			if (here) hubGate.stand();
		});
	});

	const progress = $derived(player.duration > 0 ? player.position / player.duration : 0);

	/**
	 * The parts of a door that are not in PORTALS. The href and the label stay
	 * there, because the corridor reads them too; everything here is only ever
	 * seen on the rail.
	 *
	 * A tile says where it goes and what you will do there — no blurb under it.
	 * Four doors do not need explaining, and the rail reads as a row of tokens
	 * rather than a page of copy.
	 */
	const DOORS: Record<PortalKey, { tone?: 'loud' | 'alt'; action: string }> = {
		resume: { action: 'READ' },
		plan: { tone: 'loud', action: 'START A BRIEF' },
		media: { tone: 'alt', action: 'OPEN' },
		arcade: { action: 'PLAY' }
	};

	function select(event: MouseEvent | null, href: string) {
		event?.preventDefault();
		// A second click while the tube is dark would strand the layout
		// mid-swap, so the cycle in progress owns the frame until it finishes.
		if (crt.busy) return;
		void stage.transitionTo(href, (target) => goto(target));
	}
</script>

{#snippet doorIcon(key: PortalKey)}
	{#if key === 'resume'}
		<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
	{:else if key === 'plan'}
		<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18v13H3z" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>
	{:else if key === 'media'}
		<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
	{:else}
		<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12a6 6 0 0 1 6-6h8a6 6 0 0 1 0 12H8a6 6 0 0 1-6-6z" /><path d="M7 10v4" /><path d="M5 12h4" /><path d="M15.5 11.5h.01" /><path d="M18 10h.01" /></svg>
	{/if}
{/snippet}

<div
	class="mat pointer-events-auto fixed inset-0 z-20 overflow-y-auto lg:overflow-hidden"
	class:mat-bar={active !== null && player.current !== null}
>
	<div class="frame flex min-h-full flex-col gap-4 sm:gap-5">
		<!-- The heading rule. Deliberately empty but for the mark: the doors
		     are the navigation, and they are all on the rail. -->
		<header class="head">
			{#if active}
				<a href="/" class="crumb" onclick={(e) => select(e, '/')}>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
					BACK TO THE HUB
				</a>
			{/if}
			<span class="flex-1"></span>
			<!-- Keyed on the route so the mark restarts its turn on every
			     navigation. It runs off its own clock from mount, and a walk
			     through a door is the natural place to put it back to zero. -->
			{#key path}
				<SineMark width={108} />
			{/key}
		</header>

		<div class="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
			<!-- the big window: the corridor on the hub, the section's page behind a door -->
			<section class="win flex h-[52vh] min-h-[300px] flex-col lg:h-auto lg:min-h-0 lg:flex-1">
				<div class="winbar">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 18v3" />
					</svg>
					<span class="winbar-title">
						{#if active}
							{PORTAL[active].label}
						{:else}
							HUB // THE CORRIDOR
						{/if}
					</span>

					{#if active}
						<span class="chip chip-quiet">PAGE</span>
					{:else if stage.unsupported}
						<span class="chip chip-quiet">NO WEBGL</span>
					{:else if hubGate.open}
						<span class="chip">
							<svg width="26" height="11" viewBox="0 0 52 22" fill="none" aria-hidden="true" class="breathe">
								<path d="M0 11 q6.5 -9 13 0 t13 0 t13 0 t13 0" stroke="var(--color-accent)" stroke-width="2" />
							</svg>
							RUNNING
						</span>
					{:else}
						<span class="chip chip-quiet"><span class="chip-blip"></span>STANDBY</span>
					{/if}

					{#if active === 'resume'}
						<a class="winlink" href={RESUME_PDF_URL} download>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></svg>
							DOWNLOAD PDF
						</a>
					{/if}

					<span class="flex-1"></span>

					{#if active}
						<a href="/" class="winbtn winbtn-alt" aria-label="Put the corridor back on the big screen" onclick={(e) => select(e, '/')}>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3 14 10" /><path d="M3 21l7-7" /></svg>
						</a>
					{:else}
						<button type="button" class="winbtn" aria-label="Put the corridor on standby" onclick={() => hubGate.stand()}>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12" /></svg>
						</button>
						<button type="button" class="winbtn" aria-label="Take the controls" onclick={() => hubGate.enter()}>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="1" /></svg>
						</button>
						<a href={PORTAL.arcade.href} class="winbtn winbtn-alt" aria-label="Leave for the arcade" onclick={(e) => select(e, PORTAL.arcade.href)}>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>
						</a>
					{/if}
				</div>

				<!--
					One persistent box, so the power cycle plays on the same
					element the whole way through the swap rather than restarting
					on a node the route change has just replaced.
				-->
				<div
					class="pane"
					class:crt-off={crt.phase === 'off'}
					class:crt-on={crt.phase === 'on'}
				>
					<!--
						The screen. Deliberately empty: the canvas is positioned
						over it by the stage. What is inside shows only when there
						is no render to cover it — the gate, or the flat fallback.
					-->
					<div bind:this={windowScreen} class="glassbox" class:hidden={active !== null}>
						{#if stage.unsupported}
							<div class="flex h-full flex-col justify-center gap-2 p-5">
								<p class="label">No WebGL here, so the corridor is off. The doors still work:</p>
								{#each PORTALS as portal (portal.href)}
									<a href={portal.href} class="btn-ghost">{portal.label.toLowerCase()}</a>
								{/each}
							</div>
						{:else if !hubGate.open && active === null}
							<HubGate onenter={() => hubGate.enter()} />
						{/if}
					</div>

					<!--
						Kept mounted on the hub too, so the routed page still owns
						its own <svelte:head>. It is only ever shown once a door has
						taken the corridor off the big screen.
					-->
					<div class="glassbox doc" class:hidden={active === null}>
						{@render children()}
					</div>
				</div>
			</section>

			<!-- the doors -->
			<aside class="flex w-full shrink-0 flex-col gap-4 lg:w-[420px] lg:gap-5 xl:w-[520px]">
				{#each PORTALS as portal (portal.key)}
					{@const door = DOORS[portal.key]}
					<div
						class="slot"
						class:crt-off={crt.touches(portal.key) && crt.phase === 'off'}
						class:crt-on={crt.touches(portal.key) && crt.phase === 'on'}
					>
						{#if active === portal.key}
							<!-- This door is open, so its tile is where the corridor lives now. -->
							<div class="live">
								<div class="livebar">
									<span class="livebar-title">HUB // CORRIDOR</span>
									<span class="flex-1"></span>
									<span class="livebar-chip">{hubGate.open ? 'RUNNING' : 'STANDBY'}</span>
								</div>
								<div bind:this={tileScreen} class="livescreen">
									{#if !stage.unsupported && !hubGate.open}
										<HubGate compact onenter={() => hubGate.enter()} />
									{/if}
								</div>
							</div>
						{:else}
							<a
								href={portal.href}
								class="door"
								class:door-loud={door.tone === 'loud'}
								onclick={(e) => select(e, portal.href)}
							>
								<span
									class="cap"
									class:cap-dash={portal.key === 'resume'}
									class:cap-hazard={portal.key === 'plan'}
									class:cap-dash-alt={portal.key === 'media'}
									class:cap-check={portal.key === 'arcade'}
								></span>
								<span class="brackets"></span>
								<span
									class="door-icon"
									class:door-icon-loud={door.tone === 'loud'}
									class:door-icon-alt={door.tone === 'alt'}
								>
									{@render doorIcon(portal.key)}
								</span>
								<span class="door-body">
									<span class="door-name">{portal.label}</span>
									<!-- The one exception to a bare tile: what is playing is
									     live state, not a description of the door. -->
									{#if portal.key === 'media' && player.current}
										<span class="door-now">
											{player.current.title} — <span class="text-muted">{player.current.artist}</span>
										</span>
										<span class="flex items-center gap-2.5">
											<span class="label tabular-nums">{formatTime(player.position)}</span>
											<span class="track"><span class="track-fill" style:width="{progress * 100}%"></span></span>
											<span class="label tabular-nums">{formatTime(player.duration)}</span>
										</span>
									{/if}
								</span>
								<span class="door-action" class:door-action-loud={door.tone === 'loud'}>{door.action}</span>
							</a>
						{/if}
					</div>
				{/each}
			</aside>
		</div>
	</div>
</div>

<style>
	/* --- the paper ------------------------------------------------------
	   A dither mat behind a hairline frame. Both are theme tokens, so every
	   other theme gets the same furniture in its own palette; `--paper-mat`
	   is newsprint's, with a sane fallback for the ones that do not set it. */
	.mat {
		background-color: var(--paper-mat, var(--color-bg-deep));
		background-image: repeating-conic-gradient(
			var(--paper-mat-ink, var(--color-surface)) 0% 25%,
			var(--paper-mat, var(--color-bg-deep)) 0% 50%
		);
		background-size: 4px 4px;
		padding: 12px;
	}

	/* Behind a door the persistent player shows its bar, which is fixed to the
	   viewport rather than to the frame. Give it its own room. */
	.mat-bar {
		padding-bottom: 84px;
	}

	.frame {
		box-sizing: border-box;
		padding: 18px;
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-bg);
	}

	/* --- the heading rule ----------------------------------------------- */
	.head {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		height: 72px;
		padding: 0 18px;
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
	}

	.crumb {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.5rem 0.9rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		color: var(--color-ink);
	}

	.crumb:hover {
		background-color: color-mix(in srgb, var(--color-accent) 16%, transparent);
	}

	/* --- the window ------------------------------------------------------ */
	.win {
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
		overflow: hidden;
	}

	.winbar {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.8rem 0.8rem 0.65rem 1rem;
		border-bottom: 1px solid var(--color-line);
		/* The dither rule that runs under every titlebar. */
		background-image: repeating-linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-line) 55%, transparent) 0 1px,
			transparent 1px 11px
		);
		background-size: 100% 6px;
		background-repeat: repeat-x;
		background-position: top;
	}

	.winbar-title {
		margin-top: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.12em;
	}

	.pane {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		margin: 12px;
	}

	/* The bezel. Worn by whichever of the two is on screen, so the picture
	   sits in the same tube whether it is the corridor or a page. */
	.glassbox {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
		border-radius: var(--radius-panel);
		background-color: var(--color-bg-deep);
		box-shadow:
			inset 0 0 0 3px var(--color-bg),
			inset 0 0 0 4px color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.doc {
		overflow-y: auto;
		background-color: var(--color-bg);
	}

	.chip,
	.chip-quiet {
		margin-top: 0.25rem;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.2rem 0.55rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
		border-radius: var(--radius-panel);
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		color: var(--color-ink);
	}

	.chip-quiet {
		border-color: var(--color-line);
		background-color: transparent;
		color: var(--color-muted);
	}

	.chip-blip {
		width: 6px;
		height: 6px;
		background-color: var(--color-accent);
		animation: blink 1.1s steps(1, end) infinite;
	}

	.breathe {
		animation: breathe 2.6s ease-in-out infinite;
	}

	/* The one page-owned control the titlebar carries. */
	.winlink {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.25rem;
		padding: 0.25rem 0.6rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
		border-radius: var(--radius-panel);
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		color: var(--color-ink);
	}

	.winlink:hover {
		background-color: color-mix(in srgb, var(--color-accent) 26%, transparent);
	}

	.winbtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 26px;
		margin-top: 0.25rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		color: var(--color-ink);
	}

	.winbtn:hover {
		background-color: color-mix(in srgb, var(--color-accent) 16%, transparent);
	}

	.winbtn-alt {
		border-color: color-mix(in srgb, var(--color-accent-2) 65%, transparent);
		color: var(--color-accent-2);
	}

	/* --- the rail -------------------------------------------------------- */
	.slot {
		display: flex;
		flex: 1 1 0;
		min-height: 118px;
	}

	.door {
		position: relative;
		display: flex;
		align-items: center;
		gap: 1.1rem;
		flex: 1 1 auto;
		padding: 1rem 1.4rem 1rem 2.4rem;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
		color: var(--color-ink);
	}

	.door:hover,
	.door:focus-visible {
		background-color: var(--color-surface);
	}

	.door-loud {
		background-color: color-mix(in srgb, var(--color-accent) 7%, var(--color-surface-raised));
	}

	/* --- the open door, which is where the corridor lives now ------------ */
	.live {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
	}

	.livebar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-shrink: 0;
		padding: 0.45rem 0.6rem 0.4rem 0.8rem;
		border-bottom: 1px solid var(--color-line);
	}

	.livebar-title,
	.livebar-chip {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.14em;
	}

	.livebar-chip {
		color: var(--color-muted);
	}

	/* Empty on purpose, exactly like the big screen: the canvas is moved on
	   top of it rather than into it. */
	.livescreen {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		margin: 8px;
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
		border-radius: var(--radius-panel);
		background-color: var(--color-bg-deep);
	}

	/* Each door carries a different patterned cap, so they are told apart by
	   edge as well as by name. */
	.cap {
		position: absolute;
		left: 0;
		top: 0;
		width: 14px;
		height: 100%;
	}

	.cap-dash {
		background-image: repeating-linear-gradient(
			0deg,
			color-mix(in srgb, var(--color-accent) 55%, transparent) 0 4px,
			transparent 4px 8px
		);
	}

	.cap-dash-alt {
		background-image: repeating-linear-gradient(
			0deg,
			color-mix(in srgb, var(--color-accent-2) 55%, transparent) 0 4px,
			transparent 4px 8px
		);
	}

	.cap-hazard {
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--color-accent) 75%, transparent) 0 5px,
			transparent 5px 10px
		);
	}

	.cap-check {
		background-image: repeating-conic-gradient(
			color-mix(in srgb, var(--color-accent) 55%, transparent) 0% 25%,
			transparent 0% 50%
		);
		background-size: 6px 6px;
	}

	/* Corner ticks, drawn in one element by way of two gradients per side. */
	.brackets {
		position: absolute;
		inset: 8px 8px 8px 22px;
		pointer-events: none;
		background-image:
			linear-gradient(var(--color-line), var(--color-line)),
			linear-gradient(var(--color-line), var(--color-line)),
			linear-gradient(var(--color-line), var(--color-line)),
			linear-gradient(var(--color-line), var(--color-line));
		background-repeat: no-repeat;
		background-size:
			8px 1px,
			1px 8px,
			8px 1px,
			1px 8px;
		background-position:
			left top,
			left top,
			right bottom,
			right bottom;
		opacity: 0.6;
	}

	.door-icon {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
		border-radius: var(--radius-panel);
		background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
	}

	.door-icon-loud {
		border-color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.door-icon-alt {
		border-color: color-mix(in srgb, var(--color-accent-2) 45%, transparent);
		background-color: color-mix(in srgb, var(--color-accent-2) 12%, transparent);
		color: var(--color-accent-2);
	}

	.door-body {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.door-name {
		font-family: var(--font-display);
		font-size: 1.45rem;
		letter-spacing: var(--tracking-display);
		line-height: 1;
	}

	.door-now {
		font-size: 0.9375rem;
		line-height: 1.35;
		color: var(--color-ink);
	}

	.door-action {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.05rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
	}

	.door-action-loud {
		border-color: var(--color-accent);
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
		font-weight: 600;
	}

	.track {
		flex: 1 1 auto;
		height: 6px;
		overflow: hidden;
		border: 1px solid var(--color-line);
		background-color: var(--color-bg-deep);
	}

	.track-fill {
		display: block;
		height: 100%;
		background-color: var(--color-accent-2);
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

	@keyframes breathe {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
	}

	/* On a phone the doors are a list, not a rail: let them size to content
	   rather than splitting a column that is no longer there. */
	@media (max-width: 1023px) {
		.slot {
			flex: 0 0 auto;
		}

		.live {
			min-height: 220px;
		}
	}
</style>
