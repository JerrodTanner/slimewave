<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * The ShineWave mark: a point going round a circle, read off onto a sine.
	 *
	 * One clock, one frame. Every part of the drawing — the hand, the dotted
	 * read-off, both dots and the front of the curve — is computed from the
	 * same `phase` on the same animation frame, so they cannot drift apart.
	 *
	 * This used to be five SMIL animations plus a widening clip rectangle over
	 * a fixed polyline. That is five timelines the browser is free to schedule
	 * independently, and the clip rectangle is the one most likely to be behind:
	 * it drives a clip path rather than a geometry attribute, and Chrome does
	 * not always land it on the frame the others landed on. The curve visibly
	 * trailed the hand. Sampling the sine here instead means the curve simply
	 * ends at the hand's height, by construction, with no clip at all.
	 *
	 * Drawn rather than animated in CSS so it inherits `currentColor` and comes
	 * out in whatever the active theme calls the accent.
	 */
	interface Props {
		/** Rendered width in px; the mark keeps a 2:1 box. */
		width?: number;
		weight?: number;
	}

	let { width = 136, weight = 1 }: Props = $props();

	/** One turn of the circle, which is one period of the wave. */
	const PERIOD_MS = 4000;
	/** The circle: centre and radius, in viewBox units. */
	const CX = 54;
	const CY = 54;
	const R = 38;
	/** The graph: left edge, width of exactly one period, amplitude. */
	const GX = 112;
	const GW = 98;

	/** 0 → 1 over one turn. The single source of every moving number below. */
	let phase = $state(0);

	onMount(() => {
		// Held still rather than stopped: the mark is a diagram, and the frame
		// it freezes on should be one that shows what it is a diagram of.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			phase = 0.25;
			return;
		}

		let frame = 0;
		const start = performance.now();
		const step = (now: number) => {
			phase = ((now - start) % PERIOD_MS) / PERIOD_MS;
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	});

	/** The height everything shares: the hand's tip, both dots, the curve's end. */
	const y = $derived(CY + R * Math.cos(2 * Math.PI * phase));
	/** The hand's tip. Its y is `y`, which is what makes the read-off horizontal. */
	const handX = $derived(CX + R * Math.sin(2 * Math.PI * phase));

	/**
	 * The curve, drawn only as far as the hand has turned. Sampled finely and
	 * then closed with the exact front point, so the end of the line is the
	 * hand's height rather than the nearest sample to it.
	 */
	const wave = $derived.by(() => {
		const end = GW * phase;
		const points: string[] = [];
		for (let d = 0; d < end; d += 1.5) {
			points.push(`${(GX + d).toFixed(2)},${(CY + R * Math.cos((2 * Math.PI * d) / GW)).toFixed(2)}`);
		}
		points.push(`${(GX + end).toFixed(2)},${y.toFixed(2)}`);
		return points.join(' ');
	});
</script>

<svg
	{width}
	height={width / 2}
	viewBox="0 0 216 108"
	fill="none"
	role="img"
	aria-label="A point on a circle unrolling into a sine wave"
	style:display="block"
	style:color="var(--color-accent)"
>
	<g stroke="currentColor" stroke-width={1.6 * weight} opacity="0.55">
		<path d="M8 54 H100" />
		<path d="M54 12 V96" />
		<path d="M112 54 H210" />
		<path d="M112 12 V96" />
	</g>

	<circle cx={CX} cy={CY} r={R} stroke="currentColor" stroke-width={2.4 * weight} stroke-dasharray="5 6" />

	<polyline
		points={wave}
		stroke="currentColor"
		stroke-width={3 * weight}
		stroke-linecap="round"
		stroke-linejoin="round"
	/>

	<!-- hand tip → the circle's axis -->
	<line
		x1={handX}
		y1={y}
		x2={CX}
		y2={y}
		stroke="currentColor"
		stroke-width={1.6 * weight}
		stroke-dasharray="4 5"
		opacity="0.7"
	/>

	<!-- the circle's axis → the graph's axis -->
	<line
		x1={CX}
		y1={y}
		x2={GX}
		y2={y}
		stroke="currentColor"
		stroke-width={1.6 * weight}
		stroke-dasharray="4 5"
		opacity="0.7"
	/>

	<circle cx={CX} cy={y} r={3.4 * weight} fill="currentColor" />

	<!-- the hand, with no point of its own: the dotted line is its readout -->
	<path
		d="M{CX} {CY} L{handX} {y}"
		stroke="currentColor"
		stroke-width={2.6 * weight}
		stroke-linecap="round"
	/>

	<circle cx={GX} cy={y} r={4.5 * weight} fill="currentColor" />
</svg>
