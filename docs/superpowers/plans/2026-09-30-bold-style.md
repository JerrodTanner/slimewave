# Bold Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third style, Bold, and make it the default. Under Bold the front page is a scroll-down pitch: a headline hero, a camo band of ten automation rows, a CTA, and then the tile and doors, with no 3D.

**Architecture:** Bold is a style in the existing theme system: two themes in `themes.ts`/`app.css`, mapped to `data-style="bold"` before first paint. A new `BoldHero.svelte` renders above the menu in `HubFrame` when the style is Bold on `/`. `ui.mode` becomes an effective mode that is always `simple` under Bold. The hub window is not rendered under Bold, so the canvas has no rect (it is "stranded" at 0×0), and `GameStage` pauses the stage.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind v4 tokens in `app.css`, TypeScript. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-30-bold-style-design.md`

## Global Constraints

- The canvas never unmounts. Pausing and hiding it is fine; removing `<GameStage />` or its `<canvas>` is not.
- Style with theme tokens (`--color-*`, `--camo-*`, `--radius-panel`, `--font-mono`), never hard-coded colors.
- No webfonts. Bold type is `'Helvetica Neue', 'Arial Black', system-ui, sans-serif` at weight 900.
- Every claim on the front page must be on `web/src/lib/content/resume.md`. Change the resume first.
- Icons are `d` strings on a 24×24 grid.
- `slimewave:theme:v2` is **not** bumped.
- Comments explain *why*, in full sentences.
- `cd web && npm run check` must stay at 0 errors.
- Headline: "Less busywork. More business." Sub-line: "Digitize your operations, move more work, and leave the paperwork behind." Rows heading: "*Time savers* & workflow upgrades". CTA: "What's eating your week?" → Plan a Project.

## Review Focus

1. **A stored non-Bold theme**, for example `newsprint` in `slimewave:theme:v2`. Expected: the page paints Clean on first paint, with no Bold flash. `app.html` defaults to Bold now, so the script must set `clean` explicitly. This is covered in Task 2, step 5.
2. **A visitor with 3D on under Clean who switches to Bold and back.** Expected: 3D is still on, because the stored mode is never overwritten. Covered in Task 3, step 5.
3. **Leaving Bold for Clean.** Expected: the corridor comes back live in the window, since pausing must not dispose the stage. Covered in Task 3, step 5.
4. **Walking through a door from far down the page, and coming back.** Expected: the door page opens at the top, and the hub returns to the menu, not the hero. Covered in Task 5, step 3.
5. **A phone at 375px.** Expected: no horizontal scroll. The band's negative margin must not overflow, and rows collapse to icon + text. Covered in Task 4, step 6.

---

### Task 1: Resume bullets for the two new claims

**Files:**
- Modify: `web/src/lib/content/resume.md`

The SlicerDicer row and the tenant-history row are not on the resume yet.

- [ ] **Step 1: Add the SlicerDicer bullet under Broward Health**, after `- Led Radiant reporting for operations and general analytics` and its two sub-bullets:

```markdown
- Built SlicerDicer reports in Epic for department managers, doctors, and nurses
```

- [ ] **Step 2: Add the tenant bullet under Keiser University**, after `- Developed tooling to automate invoice generation to assist in collecting rent`:

```markdown
- Built property-management tracking of tenant and business-name history for leased office space, helping bring in an extra $1M per year
```

- [ ] **Step 3: Verify the resume page renders.** Run `cd web && npm run dev`, open `/resume`, and confirm both bullets appear.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/content/resume.md
git commit -m "Resume: SlicerDicer reporting and tenant-history tracking"
```

Note for Jerrod: `PDFs/Jerrod Tanner Resume.pdf` must be re-exported by hand.

---

### Task 2: The Bold style and its two themes

**Files:**
- Modify: `web/src/lib/theme/themes.ts`
- Modify: `web/src/app.css`
- Modify: `web/src/app.html`
- Modify: `web/src/lib/theme/theme.svelte.ts:5-12` (comment only)

**Interfaces:**
- Produces: `Style` includes `'bold'`; `ThemeId` includes `'street' | 'night'`; `DEFAULT_THEME === 'street'`; the CSS tokens `--camo-1`, `--camo-2`, `--camo-3`, `--camo-ink`, `--camo-plate` and `--camo-pop` on both Bold themes.

- [ ] **Step 1: Edit `themes.ts`.** Add the ids, the style and the two themes. Then replace the defaults:

```ts
export type ThemeId =
	| 'street'
	| 'night'
	| 'newsprint'
	| 'aero'
	| 'slimewave'
	| 'deepwater'
	| 'glass'
	| 'walnut';
```

```ts
export type Style = 'bold' | 'clean' | 'homey';
```

Update the style doc comment above it. It reads "The two looks the site can wear", so change that to three, and add one sentence: Bold is the scroll-down pitch, with no furniture and no 3D.

Insert these entries at the top of `THEMES`:

```ts
	{
		id: 'street',
		name: 'Street',
		blurb: 'Off-white, heavy black type, a band of forest camo. The house style.',
		style: 'bold',
		swatch: ['#f4f2ec', '#223f1f', '#d8a31c']
	},
	{
		id: 'night',
		name: 'Night',
		blurb: 'Black, white type, a band of midnight-purple camo.',
		style: 'bold',
		swatch: ['#0b0a0e', '#24183f', '#e0b84a']
	},
```

Newsprint's blurb says "The house style." Change it to "Paper white, hairline black, one print green."

```ts
export const DEFAULT_THEME: ThemeId = 'street';

export const STYLES: { id: Style; name: string }[] = [
	{ id: 'bold', name: 'Bold' },
	{ id: 'clean', name: 'Clean' },
	{ id: 'homey', name: 'Homey' }
];

/** Where a style lands the first time it is picked. */
export const STYLE_DEFAULT_THEME: Record<Style, ThemeId> = {
	bold: DEFAULT_THEME,
	clean: 'newsprint',
	homey: 'glass'
};
```

- [ ] **Step 2: Add the two theme blocks to `app.css`,** directly after the newsprint block:

```css
/* --- street: the Bold house style ----------------------------------------
   Apple's calm on the page, one loud streetwear band on the front page. The
   camo tones sit close together so it reads as camo at a glance and stays
   quiet up close; white on the lightest of them is 8:1. The scene values are
   newsprint's, because the corridor is paused under Bold and only needs
   something sane to hold. */
[data-theme='street'] {
	--color-bg: #f4f2ec;
	--color-bg-deep: #ffffff;
	--color-surface: #ffffff;
	--color-surface-raised: #ffffff;
	--color-line: #d6d2c7;
	--color-line-bright: #111110;
	--color-ink: #111110;
	--color-muted: #5b5850;
	--color-accent: #223f1f;
	--color-accent-ink: #ffffff;
	--color-accent-2: #d8a31c;
	--color-warn: #a35c00;

	--font-display: 'Helvetica Neue', 'Arial Black', system-ui, sans-serif;
	--font-body: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
	--radius-panel: 2px;
	--tracking-display: -0.05em;

	--paper-mat: #e9e6de;
	--paper-mat-ink: #e9e6de;

	--camo-1: #1b3319;
	--camo-2: #223f1f;
	--camo-3: #2b4d27;
	--camo-ink: #ffffff;
	--camo-plate: rgb(0 0 0 / 0.42);
	--camo-pop: #d8a31c;

	--scene-sky: #26272c;
	--scene-fog: #1c1d22;
	--scene-ground: #2f3036;
	--scene-grid: #74787e;
	--scene-portal: #223f1f;
	--scene-portal-alt: #d8a31c;
	--scene-light: #ffffff;
}

/* --- night: Street after dark ---------------------------------------------- */
[data-theme='night'] {
	--color-bg: #0b0a0e;
	--color-bg-deep: #050407;
	--color-surface: #141219;
	--color-surface-raised: #1b1822;
	--color-line: #26232e;
	--color-line-bright: #f4f2f8;
	--color-ink: #f4f2f8;
	--color-muted: #9a94aa;
	--color-accent: #8f63e0;
	--color-accent-ink: #ffffff;
	--color-accent-2: #e0b84a;
	--color-warn: #ffb347;

	--font-display: 'Helvetica Neue', 'Arial Black', system-ui, sans-serif;
	--font-body: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
	--radius-panel: 2px;
	--tracking-display: -0.05em;

	--paper-mat: #050407;
	--paper-mat-ink: #050407;

	--camo-1: #1c1233;
	--camo-2: #24183f;
	--camo-3: #2e1f50;
	--camo-ink: #ffffff;
	--camo-plate: rgb(0 0 0 / 0.42);
	--camo-pop: #e0b84a;

	--scene-sky: #0b0a0e;
	--scene-fog: #141219;
	--scene-ground: #1b1822;
	--scene-grid: #3a3448;
	--scene-portal: #8f63e0;
	--scene-portal-alt: #e0b84a;
	--scene-light: #f4f2f8;
}
```

In the `@layer base` block, add Street to the light color scheme:

```css
	[data-theme='newsprint'],
	[data-theme='street'],
	[data-style='homey'] {
		color-scheme: light;
	}
```

Bold has no card plate (the cog menu's plate row is Clean-only already). Add this to the `.site-card` rule's neighborhood in `app.css`:

```css
	/* Bold is a flat page: the plate is Clean's furniture. */
	[data-style='bold'] .site-card {
		background-image: none;
	}
```

- [ ] **Step 3: Update the pre-paint script in `app.html`.** Change the root tag and the script:

```html
<html lang="en" data-theme="street" data-style="bold">
```

```js
				var stored = localStorage.getItem('slimewave:theme:v2');
				if (stored) {
					document.documentElement.dataset.theme = stored;
					// The style follows from the theme (each theme's `style` in
					// lib/theme/themes.ts). The tag above defaults to Bold, so a
					// stored Clean theme has to say so or it would paint as Bold.
					var homey = stored === 'glass' || stored === 'walnut';
					var bold = stored === 'street' || stored === 'night';
					document.documentElement.dataset.style = homey ? 'homey' : bold ? 'bold' : 'clean';
				}
```

Replace the two old lines, `if (stored) ...dataset.theme = stored;` and the `glass`/`walnut` homey line, with the block above.

- [ ] **Step 4: Update the storage-key comment in `theme.svelte.ts`.** Append to the doc comment above `STORAGE_KEY`:

```ts
 *
 * Not bumped for Bold, on purpose. A theme is only stored when someone picks
 * one, so visitors who never chose already get the new default; a bump would
 * only override the people who deliberately chose something else.
```

- [ ] **Step 5: Verify.** Run `cd web && npm run check`. Expected: 0 errors. Then `npm run dev` and check:
  - With `slimewave:theme:v2` cleared in DevTools, reload. You get `data-theme="street" data-style="bold"`.
  - With `localStorage.setItem('slimewave:theme:v2','newsprint')`, hard reload. The first paint is Clean, with no Bold flash.
  - The cog menu's Style row shows bold / clean / homey, and the Theme row under Bold shows Street and Night.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/theme/themes.ts web/src/app.css web/src/app.html web/src/lib/theme/theme.svelte.ts
git commit -m "Add a Bold style with Street and Night, and make it the default"
```

---

### Task 3: No 3D under Bold

**Files:**
- Modify: `web/src/lib/state/ui.svelte.ts`
- Modify: `web/src/lib/components/SettingsMenu.svelte:81-96`
- Modify: `web/src/lib/components/GameStage.svelte:96-100`

**Interfaces:**
- Consumes: `theme.style` from `$lib/theme/theme.svelte` (now `'bold' | 'clean' | 'homey'`).
- Produces: `ui.mode` is a read-only getter, `'simple'` whenever `theme.style === 'bold'`. `ui.setMode()` still writes the stored choice.

- [ ] **Step 1: Make `ui.mode` the effective mode.** In `ui.svelte.ts`, import the theme and split the stored choice from the answer:

```ts
import { browser } from '$app/environment';
import { theme } from '$lib/theme/theme.svelte';
```

Replace `mode = $state<Mode>('simple');` with:

```ts
	/** What the visitor picked, kept even while Bold overrides it. */
	#chosen = $state<Mode>('simple');

	/**
	 * The mode in force. Bold has no 3D, so it is always simple there, but
	 * the stored choice is left alone: going back to Clean or Homey returns
	 * whatever the visitor had.
	 */
	get mode(): Mode {
		return theme.style === 'bold' ? 'simple' : this.#chosen;
	}
```

In `init()`, change `this.mode = storedMode;` to `this.#chosen = storedMode;`. In `setMode()`, change `this.mode = value;` to `this.#chosen = value;`.

- [ ] **Step 2: Hide the 3D Navigation row under Bold.** In `SettingsMenu.svelte`, wrap the row (the `<!-- Shown as 3D Navigation off/on ... -->` comment and its `<div class="row">`):

```svelte
			<!-- Shown as 3D Navigation off/on; stored as the simple/advanced mode.
			     Bold has no corridor, so the row has nothing to switch there. -->
			{#if active.style !== 'bold'}
				<div class="row">
					...unchanged...
				</div>
			{/if}
```

- [ ] **Step 3: Pause the stage under Bold.** In `GameStage.svelte`, import the theme and change the mode effect:

```ts
	import { theme } from '$lib/theme/theme.svelte';
```

```ts
	// Bold draws no corridor anywhere, so the render loop stops rather than
	// running under a canvas nobody can see. Paused, not disposed: the canvas
	// never unmounts, and leaving Bold picks the same scene back up.
	$effect(() => {
		if (!stage.ready) return;
		const next = immersive
			? 'immersive'
			: ui.backdrop === 'ambient' && theme.style !== 'bold'
				? 'ambient'
				: 'paused';
		untrack(() => stage.setMode(next));
	});
```

- [ ] **Step 4: Run check.** `cd web && npm run check`. Expected: 0 errors. Any `ui.mode = ...` assignment elsewhere is now a type error; there should be none (`grep -rn "ui.mode =" web/src` returns nothing).

- [ ] **Step 5: Verify in the browser.**
  - Under Clean, turn 3D on. Switch to Bold: the 3D row is gone.
  - Switch back to Clean: 3D is still on, and the corridor is live in the window.
  - Under Bold, `stage.mode` is `'paused'`. You can confirm by adding a temporary `console.log` in `stage.setMode`, which must be removed before committing. Or check that the GPU goes idle in the DevTools Performance panel.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/state/ui.svelte.ts web/src/lib/components/SettingsMenu.svelte web/src/lib/components/GameStage.svelte
git commit -m "Bold has no 3D: simple mode, no toggle, and a paused stage"
```

---

### Task 4: The Bold front page

**Files:**
- Create: `web/src/lib/components/BoldHero.svelte`
- Modify: `web/src/lib/components/HubFrame.svelte` (script, `.mat` class, markup around lines 271-390, styles)

**Interfaces:**
- Consumes: `theme.style`; HubFrame's existing `select(event: MouseEvent | null, href: string): void`.
- Produces: `<BoldHero {select} />`, and `const bold = $derived(theme.style === 'bold')` in HubFrame (used by Task 5).

- [ ] **Step 1: Create `BoldHero.svelte`:**

```svelte
<script lang="ts">
	/**
	 * The Bold front page, above the tile and the doors: one huge line, then
	 * the jobs a business would hand over, on a band of camo.
	 *
	 * The page is Apple-calm and the band is the one loud thing. The camo is
	 * drawn here by hand (original work, so nothing to credit) as a few large
	 * shapes in close tones, sliced to cover rather than tiled, so it never
	 * reads as wallpaper. Every proof line is on resume.md; change it there
	 * first, the same rule as the industries tile.
	 */
	let { select }: { select: (event: MouseEvent | null, href: string) => void } = $props();

	/** A plain stroke, or the icon's body (tinted) or its accent (solid pop). */
	type Stroke = string | { d: string; tone: 'body' | 'pop' };

	interface Job {
		name: string;
		proof: string;
		tag: 'Reporting' | 'Databases' | 'Workflows';
		icon: Stroke[];
	}

	const JOBS: Job[] = [
		{
			name: 'Weekly business reports',
			proof: 'Led radiology reporting for hospital operations, tailored to make each team faster.',
			tag: 'Reporting',
			icon: [
				{ d: 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
				'M14 2v6h6',
				'M8 18v-3',
				'M12 18v-6',
				'M16 18v-4'
			]
		},
		{
			name: 'Self-serve dashboards for every team',
			proof: 'Built Epic SlicerDicer reports for department managers, doctors and nurses.',
			tag: 'Reporting',
			icon: [
				{ d: 'M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', tone: 'body' },
				'M2 7.5h20',
				'M11 14a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
				{ d: 'M8 11a3 3 0 0 1 3 3H8Z', tone: 'pop' },
				'M14.5 18v-3',
				'M18 18v-6'
			]
		},
		{
			name: 'Log monitoring & error alerts',
			proof: 'Built an app to parse large log volumes, speeding up production debugging.',
			tag: 'Reporting',
			icon: [
				{ d: 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
				'M7 7h6',
				'M7 11h8',
				'M7 15h4',
				{ d: 'M20 17.5a3 3 0 1 1-6 0a3 3 0 1 1 6 0', tone: 'pop' },
				'm19.2 19.7 2.3 2.3'
			]
		},
		{
			name: 'Customer history, in one place',
			proof: 'Tracked tenant and business-name history across leased office space, helping it bring in an extra $1M a year.',
			tag: 'Databases',
			icon: [
				{ d: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', tone: 'body' },
				'M11 10a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
				'M5.5 16.5a3.5 3.5 0 0 1 7 0',
				'M15 9h4',
				'M15 12.5h4',
				'M15 16h2.5'
			]
		},
		{
			name: 'Business & customer notifications',
			proof: 'Flagged critical CT findings, like strokes, and alerted doctors right away.',
			tag: 'Workflows',
			icon: [
				{ d: 'M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8', tone: 'body' },
				'M10.3 21a1.94 1.94 0 0 0 3.4 0',
				'M2 7.5a10 10 0 0 1 2.2-4.5',
				'M22 7.5A10 10 0 0 0 19.8 3',
				{ d: 'M20.5 11a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0', tone: 'pop' }
			]
		},
		{
			name: 'Invoices & billing',
			proof: 'Automated invoice generation for rent collection.',
			tag: 'Workflows',
			icon: [
				{ d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z', tone: 'body' },
				'M15 8.5h-3.5a1.75 1.75 0 0 0 0 3.5h1a1.75 1.75 0 0 1 0 3.5H9',
				'M12 6.5v11'
			]
		},
		{
			name: 'Reconciliation & error checks',
			proof: 'Caught $12k a month in 401k matching errors; saved HR 20 hours a week on benefits.',
			tag: 'Reporting',
			icon: [
				{ d: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
				'm7.5 8 1.5 1.5L12 6.5',
				'M14 8h3',
				'm7.5 13 1.5 1.5 3-3',
				'M14 13h3',
				'm7.5 18 1.5 1.5 3-3',
				'M14 18h3'
			]
		},
		{
			name: 'Payment & expense labeling',
			proof: 'Auto-labeled payment types, saving accounts payable 10 hours a week.',
			tag: 'Workflows',
			icon: [
				{ d: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', tone: 'body' },
				'M2 7.5h20',
				'M5.5 11.5h4',
				{ d: 'M13 16h6l3 2.75-3 2.75h-6Z', tone: 'pop' }
			]
		},
		{
			name: 'Inventory tracking',
			proof: "Built a web tool for managing a university's textbook inventory.",
			tag: 'Databases',
			icon: [
				{ d: 'M8 2h8v8H8Z', tone: 'body' },
				'M3 13h8v8H3Z',
				'M13 13h8v8h-8Z',
				'M12 2v3',
				'M7 13v3',
				'M17 13v3'
			]
		},
		{
			name: 'Moving between systems',
			proof: "Automated the order crosswalk for a hospital's move from Cerner to Epic.",
			tag: 'Databases',
			icon: [
				{ d: 'M2 6c0-1.1 1.6-2 3.5-2S9 4.9 9 6v12c0 1.1-1.6 2-3.5 2S2 19.1 2 18Z', tone: 'body' },
				'M2 6c0 1.1 1.6 2 3.5 2S9 7.1 9 6',
				'M15 6c0-1.1 1.6-2 3.5-2S22 4.9 22 6v12c0 1.1-1.6 2-3.5 2S15 19.1 15 18Z',
				'M15 6c0 1.1 1.6 2 3.5 2S22 7.1 22 6',
				'M10.5 10h3',
				'm12.5 8.5 1.5 1.5-1.5 1.5',
				'M13.5 15h-3',
				'm11.5 13.5-1.5 1.5 1.5 1.5'
			]
		}
	];
</script>

<section class="hero">
	<h1 class="headline"><span>Less busywork.</span><span class="soft">More business.</span></h1>
	<p class="sub">Digitize your operations, move more work, and leave the paperwork behind.</p>
	<span class="hint" aria-hidden="true">↓ SEE WHAT IT SAVES</span>
</section>

<section class="band" aria-labelledby="bold-jobs">
	<svg class="camo" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
		<defs>
			<linearGradient id="bold-sheen" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="var(--camo-ink)" stop-opacity=".10" />
				<stop offset=".5" stop-color="var(--camo-ink)" stop-opacity="0" />
				<stop offset="1" stop-color="var(--camo-1)" stop-opacity=".6" />
			</linearGradient>
		</defs>
		<rect width="1400" height="900" fill="var(--camo-2)" />
		<path fill="var(--camo-1)" d="M-60 120C80 40 260 90 330 200S300 420 430 470 640 400 700 520 560 760 380 780 60 700-60 560Z" />
		<path fill="var(--camo-3)" d="M520 -40C680 -80 860 20 900 150S820 330 940 400 1180 360 1230 470 1100 640 960 610 760 520 700 400 460 260 450 140 460 -20 520 -40Z" />
		<path fill="var(--camo-1)" d="M1040 60C1180 0 1400 40 1460 160V520C1400 560 1300 520 1260 440S1120 360 1060 300 960 120 1040 60Z" />
		<path fill="var(--camo-3)" d="M120 820C200 700 380 690 480 760S640 860 760 820 980 700 1100 760 1300 900 1260 960H80C60 920 80 870 120 820Z" />
		<path fill="var(--camo-1)" d="M1180 640C1260 600 1400 620 1460 680V960H1240C1180 900 1100 820 1120 740S1140 660 1180 640Z" />
		<rect width="1400" height="900" fill="url(#bold-sheen)" />
	</svg>

	<div class="jobs">
		<h2 id="bold-jobs" class="jobs-head"><em>Time savers</em> &amp; workflow upgrades</h2>
		<ul>
			{#each JOBS as job (job.name)}
				<li class="job">
					<span class="badge">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							{#each job.icon as stroke, i (i)}
								{#if typeof stroke === 'string'}
									<path d={stroke} />
								{:else}
									<path d={stroke.d} class:body={stroke.tone === 'body'} class:pop={stroke.tone === 'pop'} />
								{/if}
							{/each}
						</svg>
					</span>
					<span class="name">{job.name}</span>
					<span class="proof">{job.proof}</span>
					<span class="tag">{job.tag}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="cta">
	<h2>What's eating your week?</h2>
	<a class="btn-bold" href="/plan" onclick={(e) => select(e, '/plan')}>Plan a Project →</a>
</section>

<style>
	.hero {
		/* The first screen, less the header above it. */
		min-height: calc(100dvh - 9rem);
		display: grid;
		place-content: center;
		gap: 1.75rem;
		padding: 3rem 0;
		text-align: center;
	}

	.headline {
		font: 900 clamp(3rem, 9vw, 9rem) / 0.92 var(--font-display);
		letter-spacing: var(--tracking-display);
	}

	.headline span {
		display: block;
	}

	.soft,
	.sub,
	.hint {
		color: var(--color-muted);
	}

	.sub {
		font-size: clamp(1rem, 1.6vw, 1.25rem);
	}

	.hint {
		margin-top: 1.5rem;
		font: 600 0.75rem var(--font-mono);
		letter-spacing: 0.12em;
	}

	/* Edge to edge of the frame: the frame's padding is 18px. */
	.band {
		position: relative;
		overflow: hidden;
		margin-inline: -18px;
		color: var(--camo-ink);
	}

	.camo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.jobs {
		position: relative;
		max-width: 1200px;
		margin: 0 auto;
		padding: clamp(64px, 10vw, 140px) 24px;
	}

	.jobs-head {
		margin-bottom: 1.75rem;
		font: 900 clamp(2rem, 5vw, 4rem) / 1 var(--font-display);
		letter-spacing: var(--tracking-display);
	}

	/* The one tilt left on the band: a label slapped on the heading. */
	.jobs-head em {
		display: inline-block;
		padding: 0 0.18em;
		font-style: normal;
		background-color: var(--camo-ink);
		color: var(--camo-1);
		transform: rotate(-2deg);
	}

	ul {
		display: grid;
		gap: 10px;
		padding: 0;
		list-style: none;
	}

	.job {
		display: grid;
		grid-template-columns: 64px minmax(0, 1.1fr) minmax(0, 1.5fr) 120px;
		align-items: center;
		gap: 20px;
		padding: 22px 24px;
		border-left: 6px solid var(--camo-ink);
		background-color: var(--camo-plate);
		transition:
			transform 0.18s ease,
			background-color 0.18s ease,
			color 0.18s ease;
	}

	.job:hover {
		transform: translateX(10px);
		background-color: var(--camo-ink);
		color: var(--camo-1);
	}

	.badge {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		border-radius: 14px;
		background-color: var(--camo-ink);
		color: var(--camo-1);
		transition:
			background-color 0.18s ease,
			color 0.18s ease;
	}

	.job:hover .badge {
		background-color: var(--camo-1);
		color: var(--camo-ink);
	}

	.badge svg {
		width: 38px;
		height: 38px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.9;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.badge .body {
		fill: color-mix(in srgb, currentColor 16%, transparent);
	}

	.badge .pop {
		fill: var(--camo-pop);
		stroke: var(--camo-pop);
	}

	.name {
		font: 900 clamp(1.3rem, 2.4vw, 2rem) / 1.05 var(--font-display);
		letter-spacing: -0.035em;
	}

	.proof {
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.tag {
		justify-self: end;
		padding: 6px 10px;
		font: 800 0.7rem var(--font-mono);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		background-color: var(--camo-ink);
		color: var(--camo-1);
	}

	.job:hover .tag {
		background-color: var(--camo-1);
		color: var(--camo-ink);
	}

	.cta {
		display: grid;
		justify-items: center;
		gap: 1.5rem;
		padding: clamp(80px, 12vw, 160px) 0;
		text-align: center;
	}

	.cta h2 {
		font: 900 clamp(2rem, 5vw, 4rem) / 1 var(--font-display);
		letter-spacing: var(--tracking-display);
	}

	.btn-bold {
		padding: 16px 30px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 1.05rem;
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
	}

	@media (max-width: 720px) {
		.job {
			grid-template-columns: 52px 1fr;
			gap: 8px 16px;
		}

		.badge {
			width: 52px;
			height: 52px;
			border-radius: 12px;
		}

		.badge svg {
			width: 30px;
			height: 30px;
		}

		.proof,
		.tag {
			grid-column: 2;
		}

		.tag {
			justify-self: start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.job,
		.job:hover {
			transform: none;
			transition: none;
		}
	}
</style>
```

- [ ] **Step 2: Wire it into HubFrame's script.** Add the imports and the flag:

```ts
	import BoldHero from './BoldHero.svelte';
	import { theme } from '$lib/theme/theme.svelte';
```

```ts
	/**
	 * Bold is a page you scroll, not a window you look through: the pitch
	 * above the menu, and no corridor at all. Without the window there is no
	 * placeholder to claim, so the canvas is left stranded at nothing and the
	 * stage pauses (see GameStage).
	 */
	const bold = $derived(theme.style === 'bold');
```

- [ ] **Step 3: Let the page scroll on desktop under Bold.** Change the `.mat` div:

```svelte
<div
	bind:this={mat}
	class="mat pointer-events-auto fixed inset-0 z-20 overflow-y-auto {bold ? '' : 'lg:overflow-hidden'}"
>
```

Add `let mat = $state<HTMLElement | null>(null);` to the script. Task 5 uses it.

- [ ] **Step 4: Render the hero and drop the hub window under Bold.** Insert the hero between `</header>` and the `.lay` div. Give `.lay` a Bold class and a binding. Wrap the window section:

```svelte
		{#if bold && active === null}
			<BoldHero {select} />
		{/if}

		<div
			bind:this={menu}
			class="lay flex min-h-0 flex-1 flex-col"
			class:lay-simple={!playable || active === null}
			class:lay-pitched={pitched}
			class:lay-bold={bold && active === null}
		>
			{#if !(bold && active === null)}
				<!-- the big window: the corridor on the hub, the section's page behind a door -->
				<section class="win flex flex-col" ...unchanged...>
					...unchanged...
				</section>
			{/if}
```

Add `let menu = $state<HTMLElement | null>(null);` to the script.

**Keep the routed page mounted.** The `.doc` box inside the window renders `children()`, and the hub route's `<svelte:head>` lives there. Hiding the whole window on the hub would drop the `<title>`. So under Bold on the hub, render `children()` in a hidden box instead. Add this directly after the `{/if}` that closes the window wrapper:

```svelte
			{#if bold && active === null}
				<!-- The hub route still owns its <svelte:head>; with no window
				     to hold it, it mounts here, out of sight. -->
				<div class="hidden">{@render children()}</div>
			{/if}
```

- [ ] **Step 5: Add the Bold layout rules** to HubFrame's `<style>`, after the `@media (min-width: 64rem)` block for `.lay-simple.lay-pitched`:

```css
	/* --- bold: the tile over the doors, no window ------------------------
	   With the window gone the grid above has nothing to span, so the menu
	   is one column: the tile at full width, the three doors across under
	   it. Later in the sheet than the pitched grid, so it wins at every
	   width. */
	.lay-simple.lay-pitched.lay-bold {
		display: flex;
		flex-direction: column;
	}

	.lay-bold .pitch {
		contain: none;
	}

	@media (min-width: 40rem) {
		.lay-simple.lay-pitched.lay-bold .rail {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.lay-simple.lay-pitched.lay-bold .slot + .slot {
			border-top: 0;
			border-left: 1px solid var(--color-line);
		}
	}
```

- [ ] **Step 6: Verify.** Run `cd web && npm run check`. Expected: 0 errors. Then in `npm run dev` under Street:
  - The hero fills the first screen, and the band and rows come after it.
  - Every icon sits centered in its badge.
  - Tags are straight, and a row's hover slides it and flips it white.
  - The CTA goes to `/plan` through the power cycle.
  - The tile is at full width, with three doors across under it.
  - The tab title is still "Jerrod Tanner — ShineWave".
  - At 375px in device mode: no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth` and the same for `.mat`), and rows are icon + text.
  - Under Night, the same checks pass in purple.
  - Under Clean, the hub looks exactly as before.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/components/BoldHero.svelte web/src/lib/components/HubFrame.svelte
git commit -m "Bold front page: headline hero, camo band of automation rows, CTA"
```

---

### Task 5: Scroll on navigation

**Files:**
- Modify: `web/src/lib/components/HubFrame.svelte` (script)

**Interfaces:**
- Consumes: `mat`, `menu` and `bold` from Task 4; the existing `active`.

- [ ] **Step 1: Add the effect** after the existing `hubGate.stand()` route effect:

```ts
	/**
	 * Where the page lands after a door. Walking through one always opens the
	 * section at the top, even from far down the Bold page. Coming back to
	 * the hub under Bold lands on the menu rather than the pitch, since the
	 * visitor has already read it; a fresh load still starts at the top.
	 */
	let lastActive: PortalKey | null = null;
	$effect(() => {
		const here = active;
		untrack(() => {
			const from = lastActive;
			lastActive = here;
			if (!mat) return;
			if (here !== null) mat.scrollTop = 0;
			else if (from !== null && bold && menu) menu.scrollIntoView({ block: 'start' });
		});
	});
```

- [ ] **Step 2: Run check.** `cd web && npm run check`. Expected: 0 errors.

- [ ] **Step 3: Verify.** Under Street:
  - Scroll to the bottom and click Resume. The resume opens at the top.
  - Click BACK TO MAIN MENU. You land on the tile and doors, with the hero above, out of view.
  - A hard reload of `/` starts at the hero.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/components/HubFrame.svelte
git commit -m "Bold: doors open at the top, and the way back lands on the menu"
```

---

### Task 6: Docs

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md.**
  - Under "What the site is for", after the main-menu list, add:

    > Under **Bold** (the default style), the main menu is different: a hero ("Less busywork. More business."), a camo band of automation rows (`JOBS` in `BoldHero.svelte`, each proof line also on the resume), a CTA to `/plan`, and then the tile and doors. There is no window. The four things above describe Clean and Homey.

  - In "Styles", change "the cog menu's **Style** row: **Clean** ... or **Homey** ..." to lead with **Bold** (Street, Night: the scroll-down pitch, no furniture, no 3D).
  - In "Modes", add: under Bold the mode is always simple, and the 3D Navigation row is hidden. The stored choice is kept for the other styles.
  - In the content table, add the row: `| Automation rows (Bold) | JOBS array in BoldHero.svelte |`.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "Document the Bold style"
```

---

### Final verification

- [ ] `cd web && npm run check`: 0 errors.
- [ ] `go test ./...`: passes (the backend is unchanged).
- [ ] `cd web && npm run build`: succeeds.
- [ ] Run the Review Focus checks 1–5 above in a real browser.
