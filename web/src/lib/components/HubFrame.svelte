<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BoldHero from './BoldHero.svelte';
	import HubGate from './HubGate.svelte';
	import IndustriesTile from './IndustriesTile.svelte';
	import SettingsMenu from './SettingsMenu.svelte';
	import SineMark from './SineMark.svelte';
	import MiniPlayer from './MiniPlayer.svelte';
	import SiteMission from './SiteMission.svelte';
	import WorkPanel from './WorkPanel.svelte';
	import { RESUME_PDF_URL } from '$lib/content/resume';
	import { crt } from '$lib/game/crt.svelte';
	import { DOOR_ICON } from '$lib/game/doorIcons';
	import { hubGate } from '$lib/game/gate.svelte';
	import { PORTAL, PORTALS, portalForPath, type PortalKey } from '$lib/game/portals';
	import { stage } from '$lib/game/stage.svelte';
	import { gameViewport } from '$lib/game/viewport.svelte';
	import { formatTime, player } from '$lib/state/player.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { theme } from '$lib/theme/theme.svelte';

	/**
	 * The furniture: a heading rule, one big window, and the doors as a rail
	 * beside it. It is mounted by the root layout, not by a route, so it
	 * survives navigation between the hub and its doors.
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

	/** Simple mode keeps the corridor a backdrop: no cover, and no way in. */
	const playable = $derived(ui.mode === 'advanced');
	/** Simple mode behind a door: the doors move into the heading rule and the page takes their room. */
	const docked = $derived(active !== null && !playable);
	/** The titlebar earns its row only when it has something to put in it. */
	const barred = $derived(active !== null || stage.unsupported || hubGate.open);
	/** On the hub the pitch tile takes the column above the Media door. The hub wears the simple layout in both modes. */
	const pitched = $derived(active === null);
	/**
	 * Bold is a page you scroll, not a window you look through: the pitch
	 * above the menu, and no corridor at all. Without the window there is no
	 * placeholder to claim, so the canvas is left stranded at nothing and the
	 * stage pauses (see GameStage).
	 */
	const bold = $derived(theme.style === 'bold');
	/** The Bold hub: the pitch alone, its doors as links in the header. */
	const boldHub = $derived(bold && active === null);

	/** The page's own scroller. */
	let mat = $state<HTMLElement | null>(null);

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

	// Walking through a door, or back out of one, always opens at the top,
	// even from far down the Bold page.
	$effect(() => {
		void active;
		untrack(() => {
			if (mat) mat.scrollTop = 0;
		});
	});

	const progress = $derived(player.duration > 0 ? player.position / player.duration : 0);

	/**
	 * The parts of a door that are not in PORTALS. The href and the label stay
	 * there, because the corridor reads them too; everything here is only ever
	 * seen on the rail.
	 *
	 * `name` is the label in sentence case, for Bold's header links; the
	 * capitals in PORTALS are what the corridor paints.
	 *
	 * A tile says where it goes and what you will do there — no blurb under it.
	 * Three doors do not need explaining, and the rail reads as a row of tokens
	 * rather than a page of copy.
	 */
	const DOORS: Record<PortalKey, { tone?: 'loud' | 'alt'; action: string; name: string }> = {
		resume: { action: 'READ', name: 'Resume' },
		plan: { tone: 'loud', action: 'PLAN', name: 'Plan a Project' },
		media: { tone: 'alt', action: 'OPEN', name: 'Media' },
		about: { action: 'MEET', name: 'About me' }
	};

	/** Bold's header links: the business pages, with About me in Media's place. */
	const BOLD_DOORS = PORTALS.filter((p) => p.key !== 'media');

	/**
	 * Scrolling a sample up over the corridor is leaving the corridor, so the
	 * gate goes back to standby rather than being left running under a sheet.
	 * The threshold is there so a stray wheel click does not shut it.
	 */
	function onWindowScroll(event: Event) {
		const el = event.currentTarget as HTMLElement;
		if (el.scrollTop > 24 && hubGate.open) hubGate.stand();
	}

	/**
	 * The window's scrollbar, drawn into its frame instead of the browser's
	 * gutter, so the corridor keeps its full width. `slideFrac` is how much of
	 * the scroll is on screen (the thumb's length), `slidePos` how far down it
	 * is, both 0–1; the stylesheet turns them into a size and an offset.
	 */
	let scroller = $state<HTMLElement | null>(null);
	let slideTrack = $state<HTMLElement | null>(null);
	let slideFrac = $state(1);
	let slidePos = $state(0);
	/** Lit while the window is moving, then left to fade. */
	let slideLive = $state(false);
	let slideIdle: ReturnType<typeof setTimeout> | undefined;

	function wakeSlide() {
		measureSlide();
		slideLive = true;
		clearTimeout(slideIdle);
		slideIdle = setTimeout(() => (slideLive = false), 700);
	}

	function measureSlide() {
		const el = scroller;
		if (!el) return;
		const max = el.scrollHeight - el.clientHeight;
		slideFrac = el.scrollHeight > 0 ? el.clientHeight / el.scrollHeight : 1;
		slidePos = max > 0 ? el.scrollTop / max : 0;
	}

	// Re-measured on every scroll, and whenever the scroller or anything in it
	// resizes: the samples under the corridor change height as they lay out.
	$effect(() => {
		const el = scroller;
		if (!el) return;
		measureSlide();
		el.addEventListener('scroll', wakeSlide, { passive: true });
		const ro = new ResizeObserver(measureSlide);
		ro.observe(el);
		for (const child of el.children) ro.observe(child);
		return () => {
			el.removeEventListener('scroll', wakeSlide);
			ro.disconnect();
			clearTimeout(slideIdle);
		};
	});

	/** Dragging the thumb scrolls the window by the same proportion. */
	function dragSlide(event: PointerEvent) {
		const el = scroller;
		const track = slideTrack;
		if (!el || !track) return;
		event.preventDefault();
		const thumb = event.currentTarget as HTMLElement;
		thumb.setPointerCapture(event.pointerId);
		const startY = event.clientY;
		const startTop = el.scrollTop;
		const span = track.clientHeight * (1 - slideFrac);
		const max = el.scrollHeight - el.clientHeight;
		const move = (e: PointerEvent) => {
			if (span > 0) el.scrollTop = startTop + ((e.clientY - startY) / span) * max;
		};
		const end = () => {
			thumb.removeEventListener('pointermove', move);
			thumb.removeEventListener('pointerup', end);
			thumb.removeEventListener('pointercancel', end);
		};
		thumb.addEventListener('pointermove', move);
		thumb.addEventListener('pointerup', end);
		thumb.addEventListener('pointercancel', end);
	}

	function select(event: MouseEvent | null, href: string) {
		event?.preventDefault();
		// A second click while the tube is dark would strand the layout
		// mid-swap, so the cycle in progress owns the frame until it finishes.
		if (crt.busy) return;
		void stage.transitionTo(href, (target) => goto(target));
	}
</script>

<!--
	One icon per door, sized by the caller. A door wears it on the rail at 21,
	the window's titlebar wears the same one at 16 once that door is the page
	you are reading, and the corridor paints it onto the doorway itself — so a
	section is the same sign wherever you meet it. The paths live in
	lib/game/doorIcons, because the scene has to draw them too.
-->
{#snippet doorIcon(key: PortalKey, size: number)}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#each DOOR_ICON[key] as d (d)}
			<path {d} />
		{/each}
	</svg>
{/snippet}

<div
	bind:this={mat}
	class="mat pointer-events-auto fixed inset-0 z-20 overflow-y-auto {bold ? '' : 'lg:overflow-hidden'}"
>
	<div class="frame site-card flex min-h-full flex-col gap-4 sm:gap-5">
		<!-- The heading rule. It carries the one sentence that says what the
		     site is for, and the two things that sentence names are wired to
		     the doors that do them — so the copy is navigation too. -->
		<header class="head">
			<!--
				One slot, one width, two occupants: the name on the hub and the
				way back behind a door. They are the same size on purpose — the
				sentence beside them must not shift a pixel when you walk
				through a door.
			-->
			<div class="headslot">
				{#if active}
					<a href="/" class="crumb" onclick={(e) => select(e, '/')}>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
						BACK TO MAIN MENU
					</a>
				{:else}
					<span class="brand">
						<span class="wordmark">ShineWave</span>
						<!-- Under Bold the mark is the name's signature, in grey under
						     it, rather than a separate thing at the far end. -->
						{#if bold}
							<span class="brandmark">
								{#key path}
									<SineMark width={64} />
								{/key}
							</span>
						{/if}
					</span>
				{/if}
			</div>

			<!-- Bold's header is only the name, the doors and the cog: the hero
			     under it already makes the pitch, so the sentence would say it
			     twice. The cog sits after the doors there (below). -->
			{#if !bold}
				<SettingsMenu />

				<span class="divider" aria-hidden="true"></span>

				<SiteMission {select} />
			{/if}

			<!-- Docked, the rail's doors live here instead, the open one marked.
			     Bold has no rail at all, so its doors are always here, as links. -->
			<nav class="headdoors" aria-label="Pages">
				{#if docked || boldHub}
					{#each bold ? BOLD_DOORS : PORTALS as portal (portal.key)}
						<a
							href={portal.href}
							class="headdoor"
							class:headdoor-here={active === portal.key}
							aria-current={active === portal.key ? 'page' : undefined}
							onclick={(e) => (active === portal.key ? e.preventDefault() : select(e, portal.href))}
						>
							{#if bold}
								{DOORS[portal.key].name}
							{:else}
								<span class="winbar-icon">{@render doorIcon(portal.key, 18)}</span>
								{portal.label}
							{/if}
						</a>
					{/each}
				{/if}
			</nav>

			<!-- Bold keeps the cog with the doors on the left; the cog holds the
			     style and both Bold themes, so the header needs no theme pills. -->
			{#if bold}
				<SettingsMenu />
			{/if}

			<!-- Keyed on the route so the mark restarts its turn on every
			     navigation. It runs off its own clock from mount, and a walk
			     through a door is the natural place to put it back to zero. -->
			<!-- In simple mode, behind a door, a loaded track takes the mark's
			     place — not on the main menu, where the Media door's play button
			     carries it, and not on the Media page, which has its own
			     transport. Advanced mode keeps the mark everywhere. -->
			{#if player.current && !playable && active !== null && active !== 'media'}
				<MiniPlayer size={62} />
			{:else if !bold}
				<span class="headmark">
					{#key path}
						<SineMark width={108} />
					{/key}
				</span>
			{/if}
		</header>

		{#if boldHub}
			<BoldHero {select} />
		{/if}

		<div
			class="lay flex min-h-0 flex-1 flex-col"
			class:lay-simple={!playable || active === null}
			class:lay-pitched={pitched}
		>
			{#if boldHub}
				<!-- The hub route still owns its <svelte:head>; with no window
				     to hold it, it mounts here, out of sight. -->
				<div class="hidden">{@render children()}</div>
			{:else}
			<!-- the big window: the corridor on the hub, the section's page behind a door -->
			<section class="win flex flex-col" class:win-hub={active === null} class:win-docked={docked}>
				<!-- The bar is the page's, and only shows when it has something to
				     say. On the hub the window is the corridor itself: no icon
				     stands for a space, and a title over it would only name what
				     is already in view. -->
				{#if barred}
				<div class="winbar">
					{#if active}
						{#if playable}
							<span class="winbar-icon">{@render doorIcon(active, 16)}</span>
							<span class="winbar-title">{PORTAL[active].label}</span>
						{/if}
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
					{/if}

					{#if active === 'resume'}
						<a class="winlink" href={RESUME_PDF_URL} download>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></svg>
							DOWNLOAD PDF
						</a>
					{/if}

					<span class="flex-1"></span>

					<!-- No way-back button here: the header's back link and door
					     buttons already cover it, and on the hub the cover is how
					     the corridor is taken up and Escape how it is put down. -->
					{#if active === 'resume'}
						<span class="winnote">Another personal project: I host it, keep its offsite backup and maintain the in-game mod behind its leaderboards and rankings for a game I play.</span>
						<a class="winlink" href="https://logking.duckdns.org/" target="_blank" rel="noopener noreferrer">
							LOGKING
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
						</a>
					{/if}
				</div>
				{/if}

				<!--
					One persistent box, so the power cycle plays on the same
					element the whole way through the swap rather than restarting
					on a node the route change has just replaced.
				-->
				<div
					class="pane"
					class:pane-flush={active !== null}
					class:crt-off={crt.phase === 'off'}
					class:crt-on={crt.phase === 'on'}
				>
					<!--
						The screen. Deliberately empty: the canvas is positioned
						over it by the stage. What is inside shows only when there
						is no render to cover it — the gate, or the flat fallback.
					-->
					<!--
						The window is one continuous scroll: the corridor first,
						then every work sample under it. The corridor's screen is
						sticky, so the rect handed to the stage never moves however
						far the samples are scrolled — the sheets ride up over a
						screen that stays put, and the canvas is never dragged out
						of the window it was given.
					-->
					<div bind:this={scroller} class="scroller" class:hidden={active !== null} onscroll={onWindowScroll}>
						<div bind:this={windowScreen} class="glassbox screenslot">
							{#if stage.unsupported}
								<div class="flex h-full flex-col justify-center gap-2 p-5">
									<p class="label">No WebGL here, so the corridor is off. The doors still work:</p>
									{#each PORTALS as portal (portal.href)}
										<a href={portal.href} class="btn-ghost">{portal.label.toLowerCase()}</a>
									{/each}
								</div>
							{:else if !hubGate.open && active === null}
								<HubGate sealed={!playable} onenter={() => hubGate.enter()} />
							{/if}
						</div>

						<WorkPanel />
					</div>

					<!-- The scroll thumb, set into the frame beside the screen. Only
					     there is anything to scroll, and only on the hub. -->
					{#if active === null && slideFrac < 0.999}
						<div bind:this={slideTrack} class="slide-track" aria-hidden="true">
							<!-- Pointer only: the scroller itself still takes the wheel,
							     touch and keys, so the thumb adds nothing to announce. -->
							<span
								class="slide-thumb"
								class:slide-live={slideLive}
								role="presentation"
								style:--slide-frac={slideFrac}
								style:--slide-pos={slidePos}
								onpointerdown={dragSlide}
							></span>
						</div>
					{/if}

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
			{/if}

			{#if pitched && !boldHub}
				<div class="pitch"><IndustriesTile /></div>
			{/if}

			<!-- the doors, three across under the window -->
			{#if !docked && !boldHub}
			<aside class="rail">
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
									<span class="livebar-title">NAVIGATE IN 3D</span>
									<span class="flex-1"></span>
									{#if hubGate.open}
										<span class="livebar-chip">RUNNING</span>
									{/if}
								</div>
								<div bind:this={tileScreen} class="livescreen">
									{#if !stage.unsupported && !hubGate.open}
										<HubGate compact sealed={!playable} onenter={() => hubGate.enter()} />
									{/if}
								</div>
							</div>
						{:else}
							<!-- A door is a box with its link stretched over it, so the Media
							     door can raise a play/pause button above the link once a track
							     is loaded — a button cannot sit inside a link. -->
							{@const transport = portal.key === 'media' && player.current !== null}
							<div class="door" class:door-loud={door.tone === 'loud'} data-door={portal.key}>
								<a class="door-cover" href={portal.href} aria-label={portal.label} onclick={(e) => select(e, portal.href)}></a>
								<span
									class="cap"
									class:cap-dash={portal.key === 'resume'}
									class:cap-hazard={portal.key === 'plan'}
									class:cap-dash-alt={portal.key === 'media'}
								></span>
								<span class="brackets"></span>
								{#if transport}
									<button
										type="button"
										class="door-icon door-icon-alt door-play"
										aria-label={player.playing ? 'Pause' : 'Play'}
										onclick={() => player.toggle()}
									>
										{#if player.playing}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" /></svg>
										{:else}
											<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" /></svg>
										{/if}
									</button>
								{:else}
									<span
										class="door-icon"
										class:door-icon-loud={door.tone === 'loud'}
										class:door-icon-alt={door.tone === 'alt'}
									>
										{@render doorIcon(portal.key, 21)}
									</span>
								{/if}
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
							</div>
						{/if}
					</div>
				{/each}
			</aside>
			{/if}
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
		flex-wrap: wrap;
		gap: 0.6rem 1.4rem;
		flex-shrink: 0;
		min-height: 72px;
		padding: 0.9rem 18px;
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
	}

	.headslot {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		width: 202px;
	}

	/* The name as the cover sets it, at a size the heading rule can hold. */
	.wordmark {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.015em;
		color: var(--color-accent);
	}

	.crumb {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
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

	/* Separates the name and its cog from the sentence. */
	.divider {
		flex-shrink: 0;
		width: 1px;
		height: 26px;
		background-color: var(--color-line);
	}

	/* --- bold: the header as the mockup draws it -------------------------
	   Not a card but a bar: one hairline under it, the page's own ground
	   behind it, and the name set in the same heavy type as the headline. */
	:global([data-style='bold']) .head {
		min-height: 64px;
		padding: 0.6rem 0;
		border: 0;
		border-bottom: 1px solid var(--color-line);
		border-radius: 0;
		background: none;
	}

	/* --- bold: the ground -------------------------------------------------
	   Big, uneven tiles, each a soft gradient, with the page's own colour as
	   the grout between them. Every tile is one gradient layer, sized and
	   placed in viewport units and fixed to the viewport, so the wall stays
	   put while the page scrolls over it. A theme can colour each tile
	   (--tile-1 … --tile-8, and their -end), as Street's olive ramp does;
	   otherwise the tiles are a grey mixed from its ink and ground. */
	:global([data-style='bold']) .frame {
		--tile-a: color-mix(in srgb, var(--color-ink) 4%, var(--color-bg));
		--tile-b: color-mix(in srgb, var(--color-ink) 11%, var(--color-bg));
		background-color: var(--color-bg);
		background-image:
			linear-gradient(150deg, var(--tile-1, var(--tile-a)), var(--tile-1-end, var(--tile-b))),
			linear-gradient(200deg, var(--tile-2, var(--tile-b)), var(--tile-2-end, var(--tile-a))),
			linear-gradient(120deg, var(--tile-3, var(--tile-a)), var(--tile-3-end, var(--tile-b))),
			linear-gradient(170deg, var(--tile-4, var(--tile-b)), var(--tile-4-end, var(--tile-a))),
			linear-gradient(135deg, var(--tile-5, var(--tile-b)), var(--tile-5-end, var(--tile-a))),
			linear-gradient(160deg, var(--tile-6, var(--tile-a)), var(--tile-6-end, var(--tile-b))),
			linear-gradient(110deg, var(--tile-7, var(--tile-b)), var(--tile-7-end, var(--tile-a))),
			linear-gradient(190deg, var(--tile-8, var(--tile-a)), var(--tile-8-end, var(--tile-b)));
		background-size:
			57vw 45vh,
			42vw 26vh,
			18vw 18.5vh,
			23.5vw 18.5vh,
			32vw 54vh,
			39vw 30vh,
			39vw 23.5vh,
			28vw 54vh;
		background-position:
			0 0,
			58vw 0,
			58vw 26.5vh,
			76.5vw 26.5vh,
			0 46vh,
			33vw 46vh,
			33vw 76.5vh,
			72.5vw 46vh;
		background-repeat: no-repeat;
		background-attachment: fixed;
	}

	/* The slot's fixed width is there to hold the sentence still across a
	   door; Bold has no sentence, so the name takes only what it needs. */
	:global([data-style='bold']) .headslot {
		width: auto;
		min-width: 0;
	}

	:global([data-style='bold']) .wordmark {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 900;
		letter-spacing: -0.04em;
		color: var(--color-ink);
	}

	/* --- the window ------------------------------------------------------ */
	.win {
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
		overflow: hidden;
	}

	/* --- advanced: the corridor beside its doors ------------------------
	   The arrangement the frame was built around — a tall window with the
	   three doors stacked down its right-hand side. */
	.lay {
		gap: 1rem;
	}

	.lay .win {
		height: 52vh;
		min-height: 300px;
	}

	.lay .rail {
		display: flex;
		width: 100%;
		flex-direction: column;
		flex-shrink: 0;
		gap: 1rem;
	}

	.lay .slot {
		flex: 1 1 0;
	}

	@media (min-width: 64rem) {
		.lay {
			flex-direction: row;
			gap: 1.25rem;
		}

		.lay .win {
			height: auto;
			min-height: 0;
			flex: 1 1 auto;
		}

		.lay .rail {
			width: 420px;
			gap: 1.25rem;
		}
	}

	@media (min-width: 80rem) {
		.lay .rail {
			width: 520px;
		}
	}

	/* --- simple: the corridor over its doors ----------------------------
	   Not a game, so the window stops competing with the doors for the
	   width and simply sits above them. It is measured in tiles rather than
	   in viewport height, so the block reads as one object however tall the
	   screen is; the doors then take whatever is left. */
	.lay-simple {
		--tile-h: 132px;
		--rail-gap: 1.25rem;

		flex-direction: column;
		gap: var(--rail-gap);
	}

	.lay-simple .win-hub {
		flex: none;
		height: calc((var(--tile-h) * 2 + var(--rail-gap)) * 2);
		min-height: 0;
	}

	/* Docked, nothing sits under the window, so it takes the whole height. */
	.lay-simple .win-docked {
		flex: 1 1 auto;
		height: auto;
		min-height: 60vh;
	}

	.lay-simple .rail {
		display: grid;
		width: 100%;
		grid-template-columns: 1fr;
		gap: var(--rail-gap);
		flex: 1 1 auto;
	}

	/* Three across, one down on a phone, where a third of the width is not
	   enough to hold a door's name and its action. */
	@media (min-width: 40rem) {
		.lay-simple .rail {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	/* --- the doors as one tile ------------------------------------------
	   On the hub the three doors are slices of a single tile rather than
	   three tiles with air between them. Each slice keeps its cap, its name
	   and its action; what it gives up is its own box, so the tile reads as
	   one object and the window can have the height the gaps used to take.

	   Behind a door in advanced mode the rail is still a column of separate
	   tiles beside the window, which is why this is scoped to the hub. */
	.lay-simple.lay-pitched .rail {
		gap: 0;
		grid-auto-rows: minmax(60px, 1fr);
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
		overflow: hidden;
	}

	.lay-simple.lay-pitched .slot {
		min-height: 0;
	}

	/* One hairline between slices, turned to match however they are laid out:
	   down the tile when they are stacked, across it when they are in a row. */
	.lay-simple.lay-pitched .slot + .slot {
		border-top: 1px solid var(--color-line);
	}

	@media (min-width: 40rem) and (max-width: 63.999rem) {
		.lay-simple.lay-pitched .slot + .slot {
			border-top: 0;
			border-left: 1px solid var(--color-line);
		}
	}

	/* The tile owns the edge now. The background is left alone so the Plan
	   slice keeps its warmer stock. */
	.lay-simple.lay-pitched .door {
		border: 0;
		border-radius: 0;
	}

	/* Pitched: the tile takes a column on the hub. */
	.pitch {
		display: flex;
	}

	/* Simple: the window gives up the third column to the tile. The doors
	   span all three with the same gap, so the tile lines up with Media.
	   Below 64rem a third of the width is too narrow for the tile's copy, so
	   it stacks under the window at full width instead. */
	/* Two columns of window beside one column carrying the pitch over the
	   doors. The window spans both rows, so it runs from the heading rule to
	   the bottom of the card instead of stopping at a tile-measured height —
	   which is the whole reason the three doors became one tile.

	   Both rows are given an explicit share — two thirds to the pitch, one to
	   the doors, which need only enough height to hold three names — and the
	   tile in the third column is `contain: size`, so neither of the two
	   things stacked there can size a row from its own copy. */
	@media (min-width: 64rem) {
		.lay-simple.lay-pitched {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			grid-template-rows: minmax(0, 2fr) minmax(0, 1fr);
		}

		.lay-simple.lay-pitched .win {
			grid-column: 1 / 3;
			grid-row: 1 / 3;
		}

		.lay-simple.lay-pitched .win-hub {
			height: auto;
			min-height: 0;
		}

		.lay-simple.lay-pitched .pitch {
			grid-column: 3;
			grid-row: 1;
			contain: size;
		}

		/* Beside the window the doors stand one above another, a column of
		   three, rather than three narrow doors across the third column. */
		.lay-simple.lay-pitched .rail {
			grid-column: 3;
			grid-row: 2;
			grid-template-columns: 1fr;
		}
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

	.winbar-icon {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--color-accent);
	}

	/* Pushed to the right, so the doors sit beside the mark. */
	.headdoors {
		display: flex;
		flex: 1 0 auto;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.headdoor {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--color-ink);
	}

	.headdoor:hover {
		background-color: color-mix(in srgb, var(--color-accent) 16%, transparent);
	}

	.headdoor-here {
		border-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
		background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
		cursor: default;
	}

	/* Bold's doors are plain links in the bar, the open one underlined. */
	:global([data-style='bold']) .headdoor {
		padding: 0.25rem 0;
		border: 0;
		border-radius: 0;
		background: none;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
		color: var(--color-muted);
	}

	:global([data-style='bold']) .headdoor:hover,
	:global([data-style='bold']) .headdoor-here {
		color: var(--color-ink);
		background: none;
	}

	:global([data-style='bold']) .headdoor-here {
		text-decoration: underline;
		text-underline-offset: 0.35em;
	}

	:global([data-style='bold']) .headdoors {
		flex: 0 0 auto;
		justify-content: flex-start;
		gap: 1.4rem;
		margin-left: 0.6rem;
	}

	/* On a phone the bar wraps under the name; tighter gaps keep the three
	   links and the cog on one line there instead of stranding the cog. */
	@media (max-width: 30rem) {
		:global([data-style='bold']) .headdoors {
			gap: 1rem;
			margin-left: 0;
		}

		:global([data-style='bold']) .head {
			column-gap: 1rem;
		}
	}

	/* The mark always takes the far end of the bar. */
	.headmark {
		display: inline-flex;
		margin-left: auto;
	}

	/* Bold sets its bar out from the middle: the name with the mark under
	   it, the doors, the cog. */
	:global([data-style='bold']) .head {
		justify-content: center;
	}

	.brand {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.brandmark {
		display: inline-flex;
		--mark-color: var(--color-muted);
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

	/* The window's continuous scroll. It fills the pane exactly, so the screen
	   inside it can be a full window tall and still have somewhere to go. */
	.scroller {
		position: absolute;
		inset: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		/* No gutter: the bar is drawn into the frame instead (.slide-*), so
		   the corridor keeps the window's full width. */
		scrollbar-width: none;
	}

	.scroller::-webkit-scrollbar {
		display: none;
	}

	/* --- the scroll thumb in the frame ----------------------------------
	   The track is laid over the strip beside the screen: the pane's margin
	   here, the window's frame in Homey (--slide-w is that strip's width).
	   The element is the whole strip, so it is easy to grab; what shows is a
	   slim bar drawn by ::after. */
	.slide-track {
		--slide-w: 12px;

		position: absolute;
		top: 0;
		bottom: 0;
		right: calc(var(--slide-w) * -1);
		z-index: 2;
		width: var(--slide-w);
		pointer-events: none;
	}

	.slide-thumb {
		position: absolute;
		left: 0;
		right: 0;
		top: calc((100% - var(--slide-frac) * 100%) * var(--slide-pos));
		height: calc(var(--slide-frac) * 100%);
		min-height: 24px;
		pointer-events: auto;
		touch-action: none;
		cursor: grab;
		opacity: 0.45;
		transition: opacity 150ms ease;
	}

	.slide-thumb:active {
		cursor: grabbing;
	}

	.slide-thumb::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 4px;
		margin-left: -2px;
		border-radius: 999px;
		background-color: var(--color-accent);
	}

	/* Lit only while the window is scrolling or the thumb is held, so it
	   stays part of the frame the rest of the time. */
	.slide-live,
	.slide-thumb:active {
		opacity: 1;
		transition-duration: 80ms;
	}

	/* The corridor's screen: a full window tall and pinned there, so scrolling
	   moves the samples across it rather than taking the render with them. */
	.glassbox.screenslot {
		position: sticky;
		inset: auto;
		top: 0;
		height: 100%;
	}

	/* Behind a door the page is its own furniture, so it runs to the card's
	   edges; only the corridor on the hub wears the bezel. */
	.pane-flush {
		margin: 0;
	}

	.pane-flush .doc {
		border: 0;
		border-radius: 0;
		box-shadow: none;
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

	/* One line beside a titlebar link; it gives way before the link does. */
	.winnote {
		flex: 0 1 auto;
		min-width: 0;
		margin-top: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.04em;
		color: var(--color-muted);
	}

	/* --- the rail -------------------------------------------------------- */
	/* A container, so a door sizes its type to its own width rather than the
	   viewport's: three across on a narrow window is narrower than one down
	   on a phone. */
	.slot {
		display: flex;
		min-height: 118px;
		container-type: inline-size;
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

	/* The door under the pointer takes the accent's wash; the loud door is
	   told apart by its action button instead, so only one door is ever lit. */
	.door:hover,
	.door:has(.door-cover:focus-visible) {
		background-color: color-mix(in srgb, var(--color-accent) 7%, var(--color-surface-raised));
	}

	/* The link stretched over every door (see the markup). */
	.door-cover {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.door-play {
		position: relative;
		z-index: 2;
		padding: 0;
		cursor: pointer;
	}

	.door-play:hover {
		filter: brightness(0.95);
		background-color: color-mix(in srgb, var(--color-accent-2) 24%, transparent);
	}

	.door-play:focus-visible,
	.door-cover:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
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

	.door:hover .door-icon,
	.door:has(.door-cover:focus-visible) .door-icon {
		background-color: color-mix(in srgb, var(--color-accent) 22%, transparent);
	}

	/* Each sign moves in its own way once, on the way in: the resume tilts
	   like a page, the plan's clipboard hops, the music note swings. They use
	   the separate translate and rotate properties, which compose with any
	   transform the sign already wears (Homey turns it on its point). */
	.door-icon svg {
		transform-origin: 50% 50%;
	}

	.door[data-door='resume']:hover .door-icon svg {
		animation: door-tilt 600ms ease-out;
	}

	.door[data-door='plan']:hover .door-icon svg {
		animation: door-hop 650ms ease-out;
	}

	.door[data-door='media']:hover .door-icon svg {
		animation: door-swing 750ms ease-out;
	}

	@keyframes door-tilt {
		0% {
			rotate: 0deg;
			translate: 0 0;
		}
		35% {
			rotate: -12deg;
			translate: 0 -2px;
		}
		65% {
			rotate: 7deg;
			translate: 0 -1px;
		}
		100% {
			rotate: 0deg;
			translate: 0 0;
		}
	}

	@keyframes door-hop {
		0%,
		55%,
		100% {
			translate: 0 0;
		}
		28% {
			translate: 0 -5px;
		}
		78% {
			translate: 0 -2px;
		}
	}

	@keyframes door-swing {
		0%,
		100% {
			rotate: 0deg;
		}
		25% {
			rotate: 14deg;
		}
		50% {
			rotate: -10deg;
		}
		75% {
			rotate: 5deg;
		}
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
		/* Sized to fit, not scaled: the longest name ("PLAN A PROJECT") sets
		   about 9.6× its font size wide, and what the door has left for it is
		   its width less the padding, icon and action — 215px at full size. */
		font-size: clamp(0.75rem, calc((100cqi - 215px) / 9.6), 1.45rem);
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

	/* A narrow door gives up padding and icon size before the name wraps. */
	@container (max-width: 26rem) {
		.door {
			gap: 0.7rem;
			padding: 0.8rem 0.9rem 0.8rem 1.9rem;
		}

		.door-icon {
			width: 36px;
			height: 36px;
		}

		/* Capped where the full-size rule left off, so shrinking never grows it. */
		.door-name {
			font-size: clamp(0.75rem, calc((100cqi - 160px) / 9.6), 1.3rem);
		}

		.door-action {
			padding: 0.45rem 0.7rem;
			font-size: 0.625rem;
			letter-spacing: 0.08em;
		}
	}

	/* Narrower still, the icon goes: the name is the thing to keep on one line. */
	@container (max-width: 18rem) {
		.door {
			padding: 0.7rem 0.7rem 0.7rem 1.6rem;
		}

		.door-name {
			font-size: clamp(0.625rem, calc((100cqi - 100px) / 9.6), 0.83rem);
		}

		.door-icon:not(.door-play) {
			display: none;
		}
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

	/* --- the Homey style -------------------------------------------------
	   The same layout built from things instead of hairlines: the wall runs
	   edge to edge with no card on it, the heading rule is a cream strip
	   between two majolica tiles, the window gets a real frame, and the doors
	   are leaded glass (Tile & Glass) or cut into stone (Walnut). Frames are
	   border-images, so they size to whatever box the layout hands them; the
	   pictures are in static/homey and named by the theme tokens in app.css. */
	:global([data-style='homey']) .mat {
		padding: 0;
		background: var(--homey-wall);
		background-color: var(--homey-wall-color);
	}

	:global([data-style='homey']) .frame {
		border: 0;
		border-radius: 0;
		background: none;
	}

	:global([data-style='homey']) .head {
		border: 0;
		border-radius: 0;
		padding: 0.6rem 96px;
		background:
			var(--homey-majolica-a) left center / 72px 72px no-repeat,
			var(--homey-majolica-b) right center / 72px 72px no-repeat,
			linear-gradient(#2a3a6e, #2a3a6e) center 7px / calc(100% - 164px) 2px no-repeat,
			linear-gradient(#2a3a6e, #2a3a6e) center calc(100% - 7px) / calc(100% - 164px) 2px no-repeat,
			linear-gradient(170deg, #f8f2e2, #ebe3ce);
		box-shadow:
			0 6px 14px rgb(0 0 0 / 0.35),
			inset 0 1px 0 rgb(255 255 255 / 0.6),
			inset 0 -2px 3px rgb(80 60 30 / 0.15);
	}

	/* The end tiles are a fixed square, so a heading rule that has wrapped
	   onto two lines drops them rather than stretching them. */
	@media (max-width: 40rem) {
		:global([data-style='homey']) .head {
			padding: 0.8rem 18px;
			background: linear-gradient(170deg, #f8f2e2, #ebe3ce);
		}
	}

	:global([data-style='homey']) .wordmark {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 700;
		color: var(--color-ink);
	}

	:global([data-style='homey']) .divider {
		width: 2px;
		background-color: #2a3a6e;
		opacity: 0.7;
	}

	:global([data-style='homey']) .win {
		/* Visible, so the scroll thumb can sit in the frame; nothing else in
		   the window reaches past its own box. */
		overflow: visible;
		border-radius: 0;
		border-style: solid;
		border-color: transparent;
		background-color: var(--color-bg);
		box-shadow: 0 12px 26px rgb(0 0 0 / 0.45);
	}

	/* An oak casement: 28px of moulding in the picture, 14px on screen. */
	:global([data-theme='glass']) .win {
		border-width: 14px;
		border-image: url('/homey/frame-oak.jpg') 28 / 14px stretch;
	}

	/* A low stone surround set into the wall, the sill a little deeper than
	   the band. The slices are the picture's band plus its reveal. */
	:global([data-theme='walnut']) .win {
		border-width: 33px 33px 27px;
		border-image: url('/homey/frame-stone.jpg') 66 66 54 66 / 33px 33px 27px 33px stretch;
	}

	:global([data-style='homey']) .pane {
		margin: 0;
	}

	/* In Homey the thumb is a brass bar riding a groove cut in the frame. */
	:global([data-theme='glass']) .slide-track {
		--slide-w: 14px;
	}

	:global([data-theme='walnut']) .slide-track {
		--slide-w: 33px;
	}

	:global([data-style='homey']) .slide-track::before {
		content: '';
		position: absolute;
		top: 6px;
		bottom: 6px;
		left: 50%;
		width: 2px;
		margin-left: -1px;
		border-radius: 999px;
		background-color: rgb(20 12 6 / 0.45);
		box-shadow: 1px 0 0 rgb(255 245 225 / 0.25);
	}

	:global([data-style='homey']) .slide-thumb::after {
		width: 6px;
		margin-left: -3px;
		background: linear-gradient(90deg, #7a5520, #e8c877 45%, #9a7430);
		box-shadow:
			0 1px 3px rgb(0 0 0 / 0.5),
			inset 0 1px 0 rgb(255 245 210 / 0.6);
	}

	:global([data-theme='walnut']) .slide-thumb::after {
		width: 8px;
		margin-left: -4px;
	}

	:global([data-style='homey']) .glassbox {
		border: 0;
		border-radius: 0;
		box-shadow: none;
	}

	/* The doors, as one framed tile on the hub. */
	:global([data-style='homey']) .lay-simple.lay-pitched .rail {
		border-style: solid;
		border-color: transparent;
		border-width: 8px;
		border-radius: 0;
		box-shadow: 0 10px 24px rgb(0 0 0 / 0.45);
	}

	:global([data-theme='glass']) .lay-simple.lay-pitched .rail {
		border-image: url('/homey/frame-oak.jpg') 28 / 8px stretch;
		background-color: #1a120c;
	}

	:global([data-theme='walnut']) .lay-simple.lay-pitched .rail {
		border-image: url('/homey/frame-gilt.jpg') 16 / 8px stretch;
		background: url('/homey/stone.jpg') center / cover;
	}

	/* Between doors: a heavy came in glass, a carved groove in stone. */
	:global([data-theme='glass']) .lay-simple.lay-pitched .slot + .slot {
		border-top: 5px solid #1a120c;
	}

	:global([data-theme='walnut']) .lay-simple.lay-pitched .slot + .slot {
		border-top: 5px solid rgb(25 18 10 / 0.75);
		box-shadow: inset 0 2px 0 rgb(255 248 230 / 0.35);
	}

	/* Under the window (40rem to 64rem) the rail is three across, so there the
	   divider stands between doors; stacked, it runs across. */
	@media (min-width: 40rem) and (max-width: 63.999rem) {
		:global([data-theme='glass']) .lay-simple.lay-pitched .slot + .slot {
			border-top: 0;
			border-left: 5px solid #1a120c;
		}

		:global([data-theme='walnut']) .lay-simple.lay-pitched .slot + .slot {
			border-top: 0;
			border-left: 5px solid rgb(25 18 10 / 0.75);
			box-shadow: inset 2px 0 0 rgb(255 248 230 / 0.35);
		}
	}

	:global([data-style='homey']) .door {
		padding-left: 1.2rem;
		border-radius: 0;
		background: none;
	}

	/* In 3D mode behind a door the doors are separate tiles down the side, one
	   of them the corridor's own screen. Each gets the hub tile's frame and
	   ground, so they read as the same doors cut apart. */
	:global([data-style='homey']) .lay:not(.lay-pitched) .door,
	:global([data-style='homey']) .live {
		border-style: solid;
		border-color: transparent;
		border-width: 8px;
		border-radius: 0;
		box-shadow: 0 10px 24px rgb(0 0 0 / 0.45);
	}

	:global([data-theme='glass']) .lay:not(.lay-pitched) .door,
	:global([data-theme='glass']) .live {
		border-image: url('/homey/frame-oak.jpg') 28 / 8px stretch;
	}

	:global([data-theme='glass']) .live {
		background-color: #1a120c;
	}

	:global([data-theme='walnut']) .lay:not(.lay-pitched) .door,
	:global([data-theme='walnut']) .live {
		border-image: url('/homey/frame-gilt.jpg') 16 / 8px stretch;
		background: url('/homey/stone.jpg') center / cover;
	}

	/* The ground is a picture here, so a wash of colour would sit under it
	   unseen; the tile brightens instead. */
	:global([data-style='homey']) .lay:not(.lay-pitched) .door:hover,
	:global([data-style='homey']) .lay:not(.lay-pitched) .door:has(.door-cover:focus-visible) {
		filter: brightness(1.07);
	}

	/* The live tile's title is a cream strip, like the heading rule. */
	:global([data-style='homey']) .livebar {
		border-bottom: 0;
		background: linear-gradient(170deg, #f8f2e2, #ebe3ce);
		color: var(--color-ink);
	}

	:global([data-style='homey']) .livebar-title,
	:global([data-style='homey']) .livebar-chip {
		font-family: var(--font-display);
		font-variant: small-caps;
		letter-spacing: 0.14em;
	}

	:global([data-style='homey']) .livescreen {
		margin: 6px;
		border: 0;
		border-radius: 0;
	}

	:global([data-style='homey']) .door:hover,
	:global([data-style='homey']) .door:has(.door-cover:focus-visible) {
		background-color: rgb(255 244 220 / 0.18);
	}

	:global([data-style='homey']) .cap,
	:global([data-style='homey']) .brackets {
		display: none;
	}

	/* Each door's own run of glass: green, warm, blue. */
	:global([data-theme='glass']) .door[data-door='resume'] {
		background: url('/homey/glass-resume.jpg') left center / auto 100% repeat-x;
	}

	:global([data-theme='glass']) .door[data-door='plan'] {
		background: url('/homey/glass-plan.jpg') left center / auto 100% repeat-x;
	}

	:global([data-theme='glass']) .door[data-door='media'] {
		background: url('/homey/glass-media.jpg') left center / auto 100% repeat-x;
	}

	/* The sign, set on its point: an opal jewel in glass, a marble inlay in stone. */
	:global([data-style='homey']) .door-icon {
		width: 40px;
		height: 40px;
		margin: 0 6px;
		transform: rotate(45deg);
		border-radius: 0;
		color: var(--color-ink);
	}

	:global([data-style='homey']) .door-icon svg {
		transform: rotate(-45deg);
	}

	:global([data-theme='glass']) .door-icon {
		border: 3px solid #1a120c;
		background: url('/homey/glass-opal.jpg') center / cover;
	}

	:global([data-theme='walnut']) .door-icon {
		border: 1px solid rgb(40 30 20 / 0.6);
		background: url('/homey/marble.jpg') center / cover;
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.4);
	}

	:global([data-style='homey']) .door-name {
		font-family: var(--font-display);
		font-variant: small-caps;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--color-ink);
	}

	:global([data-style='homey']) .door-action,
	:global([data-style='homey']) .door-action-loud {
		font-family: var(--font-display);
		font-variant: small-caps;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: var(--color-ink);
	}

	:global([data-style='homey']) .door-action-loud {
		color: var(--color-accent);
	}

	/* In glass the name and the action are opal panes leaded into the run. */
	:global([data-theme='glass']) .door-body,
	:global([data-theme='glass']) .door-action {
		border: 3px solid #1a120c;
		border-radius: 0;
		background: url('/homey/glass-opal.jpg') center / 100% 100%;
	}

	:global([data-theme='glass']) .door-body {
		justify-content: center;
		padding: 0.4rem 0.9rem;
	}

	/* In stone they are cut straight into the wall. */
	:global([data-theme='walnut']) .door-name,
	:global([data-theme='walnut']) .door-action {
		color: #1a1209;
		text-shadow: 0 1px 0 rgb(255 248 232 / 0.6);
	}

	:global([data-theme='walnut']) .door-action {
		border: 0;
		background: none;
	}

	:global([data-theme='walnut']) .door-action-loud {
		color: var(--color-accent);
	}
</style>
