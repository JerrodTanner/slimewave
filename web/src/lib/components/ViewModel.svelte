<script lang="ts">
	/**
	 * The viewmodel: a hand holding a yellow handset, drawn where a weapon
	 * would sit in a first-person game.
	 *
	 * It is a photograph now rather than the drawn glove, and it is used
	 * exactly as supplied — no crop, no resize, no recolour, not mirrored. The
	 * only thing done to the file was clearing the last of its old background:
	 * some 800 pixels still carried an alpha of 1 or 2, invisible on paper and
	 * a faint white rime over a dark corridor. Everything the eye can see is
	 * the original.
	 *
	 * It is an <img> over the canvas rather than a mesh in the scene, for the
	 * same reason the glove was SVG: a viewmodel never interacts with the
	 * world, never casts a shadow and never moves relative to the camera, so
	 * putting it in the render buys nothing and costs a rig, a second camera
	 * pass and a set of near-plane problems.
	 *
	 * The subject sits flush to the right and bottom of its own frame, so the
	 * corner it is anchored to needs no correction — `bottom` only has to go a
	 * little negative to run the wrist off the screen the way a held object
	 * does.
	 */
	let { idle = true }: { idle?: boolean } = $props();
</script>

<div class="viewmodel" class:idle aria-hidden="true">
	<img src="/viewmodel-hand.png" alt="" draggable="false" decoding="async" />
</div>

<style>
	.viewmodel {
		position: absolute;
		/* Sized off the height, because the hand is portrait and the window it
		   hangs in is not: against the width it would tower out of the frame on
		   a wide screen and vanish on a narrow one. */
		right: 1%;
		bottom: -3%;
		height: 76%;
		pointer-events: none;
		/* Follows the cutout's alpha, so the corridor gets a shadow shaped like
		   the hand rather than like a box. */
		filter: drop-shadow(-10px 10px 28px rgba(0, 0, 0, 0.6));
	}

	.viewmodel img {
		display: block;
		height: 100%;
		width: auto;
	}

	/* A breath, so a still image does not look pasted onto the render. */
	.idle img {
		animation: vm-bob 5.5s ease-in-out infinite;
	}

	@keyframes vm-bob {
		0%,
		100% {
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		50% {
			transform: translate3d(-4px, -7px, 0) rotate(-0.5deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.idle img {
			animation: none;
		}
	}

	/* On a phone the window is small enough that the hand eats the corridor. */
	@media (max-width: 640px) {
		.viewmodel {
			height: 62%;
		}
	}
</style>
