<script lang="ts">
	/**
	 * The viewmodel: a black tactical glove, angled down the corridor, drawn
	 * where a weapon would sit.
	 *
	 * It is SVG over the canvas rather than a mesh in the scene. A viewmodel
	 * never interacts with the world, never casts a shadow and never moves
	 * relative to the camera, so putting it in the render buys nothing and
	 * costs a rig, a second camera pass and a set of near-plane problems.
	 *
	 * Drawn as a LEFT hand and mirrored, because a right hand entering from the
	 * bottom right is the shape every first-person game has trained people to
	 * read, and mirroring is one transform rather than a second set of curves.
	 *
	 * The wrist breaks forward inside the mirror: `rotate` tilts the hand down
	 * the corridor and the `scale(1 0.9)` under it foreshortens what that tilt
	 * would really do to the fingers. The cuff, the bare forearm and the jacket
	 * sit outside both, so the arm does not bend with the wrist.
	 *
	 * The fingers are four adjacent shapes rather than one silhouette: held
	 * together they read as a hand, and the edges where they meet are the
	 * seams, so the detail comes free from the construction.
	 *
	 * A black glove is black in every palette, so those tones are literal. The
	 * one token is the rim light, which is the theme's accent — the hand has to
	 * look lit by the same corridor as everything else.
	 */
	let { idle = true }: { idle?: boolean } = $props();
</script>

<div class="viewmodel" class:idle aria-hidden="true">
	<svg viewBox="180 385 390 450" preserveAspectRatio="xMaxYMax meet">
		<g transform="translate(750 0) scale(-1 1)">
			<!-- bare forearm, then the jacket cuff over the end of it -->
			<path d="M 268 694 C 300 722 388 726 418 704 L 434 786 C 398 812 288 808 254 780 Z" fill="var(--vm-skin)" />
			<path
				d="M 268 694 C 292 714 330 722 356 722 L 360 800 C 320 800 282 794 254 780 Z"
				fill="var(--vm-skin-shade)"
				opacity="0.55"
			/>
			<path d="M 254 780 C 288 808 398 812 434 786 L 456 835 L 226 835 Z" fill="var(--vm-jacket)" />
			<path
				d="M 256 786 C 292 812 396 816 432 792 L 436 806 C 398 830 288 826 252 800 Z"
				fill="var(--vm-jacket-lit)"
				opacity="0.7"
			/>

			<!-- the glove's cuff, its strap, and the tab on the strap -->
			<path d="M 266 652 C 298 680 388 684 418 660 L 428 710 C 394 736 292 732 256 704 Z" fill="var(--vm-cuff)" />
			<path
				d="M 270 658 C 300 684 386 688 414 666 L 417 680 C 388 700 302 696 272 672 Z"
				fill="var(--vm-cuff-lit)"
				opacity="0.75"
			/>
			<path d="M 262 686 C 296 714 390 718 422 694 L 425 712 C 392 736 292 732 259 704 Z" fill="var(--vm-strap)" />
			<rect x="380" y="690" width="26" height="15" rx="3" transform="rotate(-11 393 697)" fill="var(--vm-glove-lit)" />

			<g transform="rotate(16 345 655)">
				<g transform="translate(0 65.5) scale(1 0.9)">
					<!-- fingers, held together; the joins between them are the seams -->
					<path d="M 250 556 L 238 448 Q 236 428 256 427 Q 274 426 276 446 L 282 552 Z" fill="var(--vm-glove)" />
					<path d="M 282 552 L 280 408 Q 279 388 299 387 Q 318 386 319 406 L 322 550 Z" fill="var(--vm-glove-panel)" />
					<path d="M 322 550 L 324 394 Q 325 374 345 373 Q 364 372 365 392 L 366 550 Z" fill="var(--vm-glove)" />
					<path d="M 366 550 L 372 410 Q 374 390 394 392 Q 412 394 410 414 L 412 554 Z" fill="var(--vm-glove-deep)" />
					<g stroke="var(--vm-stitch)" stroke-width="1.4" fill="none" opacity="0.5">
						<path d="M 282 552 L 279 444" />
						<path d="M 322 550 L 321 406" />
						<path d="M 366 550 L 370 412" />
					</g>

					<!-- thumb, out to the side with the web open behind it -->
					<path d="M 424 612 L 486 556 Q 500 544 510 556 Q 519 568 506 579 L 448 640 Z" fill="var(--vm-glove)" />
					<ellipse cx="505" cy="566" rx="13" ry="9" transform="rotate(-42 505 566)" fill="var(--vm-glove-deep)" />

					<!-- back of the hand, and the quilted panels down it -->
					<path
						d="M 250 588 C 254 552 298 532 350 534 C 402 536 438 556 444 592 C 450 628 440 660 414 672 C 382 688 304 686 278 666 C 256 648 246 620 250 588 Z"
						fill="var(--vm-glove)"
					/>
					<path
						d="M 268 574 C 286 550 322 540 356 542 C 392 544 420 558 432 580 C 424 606 410 626 396 640 C 356 650 306 646 280 630 C 268 612 264 592 268 574 Z"
						fill="var(--vm-glove-panel)"
					/>
					<g stroke="var(--vm-glove-deep)" stroke-width="2.4" fill="none" opacity="0.9">
						<path d="M 292 556 C 300 590 304 622 300 648" />
						<path d="M 352 542 C 356 582 356 618 350 652" />
						<path d="M 410 556 C 418 588 418 618 408 644" />
					</g>

					<!-- the armoured knuckle patch, stitched down -->
					<path
						d="M 274 548 C 294 528 330 520 360 522 C 392 524 416 534 428 550 C 420 562 396 570 356 568 C 314 566 286 560 274 548 Z"
						fill="var(--vm-knuckle)"
					/>
					<path
						d="M 274 548 C 294 528 330 520 360 522 C 392 524 416 534 428 550 C 420 562 396 570 356 568 C 314 566 286 560 274 548 Z"
						fill="none"
						stroke="var(--vm-stitch)"
						stroke-width="1.3"
						stroke-dasharray="5 4"
						opacity="0.65"
					/>
					<ellipse cx="352" cy="544" rx="17" ry="9" fill="var(--vm-glove-lit)" opacity="0.5" />

					<!-- the corridor, catching the outer edge of every digit -->
					<g stroke="var(--vm-rim)" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.55">
						<path d="M 238 448 Q 236 428 256 427" />
						<path d="M 280 408 Q 279 388 299 387" />
						<path d="M 324 394 Q 325 374 345 373" />
						<path d="M 372 410 Q 374 390 394 392" />
						<path d="M 486 556 Q 500 544 510 556" />
					</g>
				</g>
			</g>
		</g>
	</svg>
</div>

<style>
	.viewmodel {
		--vm-glove: #1b1b1e;
		--vm-glove-panel: #26262a;
		--vm-glove-lit: #34343a;
		--vm-glove-deep: #121214;
		--vm-knuckle: #2b2b30;
		--vm-stitch: #4a4a52;
		--vm-cuff: #202024;
		--vm-cuff-lit: #33333a;
		--vm-strap: #141416;
		--vm-skin: #c48a5e;
		--vm-skin-shade: #9d6b45;
		--vm-jacket: #0d0d0f;
		--vm-jacket-lit: #1c1c20;
		--vm-rim: var(--color-accent);

		position: absolute;
		/* Pushed past the corner on both axes: a viewmodel is a hand at the edge
		   of vision, not an object in the middle of the shot. */
		right: -4%;
		bottom: -7%;
		width: 36%;
		max-width: 400px;
		pointer-events: none;
		filter: drop-shadow(-8px 8px 26px rgba(0, 0, 0, 0.72));
	}

	.viewmodel svg {
		display: block;
		width: 100%;
		height: auto;
	}

	/* A breath, so a static drawing does not look pasted onto the render. */
	.idle svg {
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
		.idle svg {
			animation: none;
		}
	}

	/* On a phone the window is small enough that the hand eats the corridor. */
	@media (max-width: 640px) {
		.viewmodel {
			width: 50%;
		}
	}
</style>
