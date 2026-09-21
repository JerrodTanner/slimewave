<script lang="ts">
	/**
	 * The viewmodel: a right hand holding an open fan of banknotes, drawn
	 * where a weapon would sit.
	 *
	 * It is SVG over the canvas rather than a mesh in the scene. A viewmodel
	 * never interacts with the world, never casts a shadow and never moves
	 * relative to the camera, so putting it in the render buys nothing and
	 * costs a rig, a second camera pass and a set of near-plane problems.
	 *
	 * The skin tone is a CSS variable so it is changed in one place.
	 */
	let { idle = true }: { idle?: boolean } = $props();
</script>

<div class="viewmodel" class:idle aria-hidden="true">
	<svg viewBox="0 0 560 380" preserveAspectRatio="xMaxYMax meet">
		<defs>
			<linearGradient id="vm-bill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#74a97d" />
				<stop offset="1" stop-color="#436f4d" />
			</linearGradient>
			<linearGradient id="vm-sleeve" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#34373c" />
				<stop offset="0.5" stop-color="#232529" />
				<stop offset="1" stop-color="#121316" />
			</linearGradient>
			<linearGradient id="vm-cuff" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#a1a5a9" />
				<stop offset="1" stop-color="#6e7276" />
			</linearGradient>
		</defs>

		<g transform="translate(28 40)">
			<!-- forearm and cuff -->
			<polygon points="431,229 611,339 549,441 369,331" fill="url(#vm-sleeve)" />
			<polygon points="431,229 455,244 393,346 369,331" fill="url(#vm-cuff)" />
			<polygon points="455,244 463,249 401,351 393,346" fill="#4e5257" />
			<polyline points="431,229 611,339" fill="none" stroke="var(--color-warn)" stroke-opacity="0.22" stroke-width="3" />

			<!-- palm, under the stack -->
			<g>
				<rect x="316" y="214" width="140" height="96" rx="42" transform="rotate(-26 386 262)" fill="var(--vm-skin)" />
				<rect x="316" y="214" width="140" height="42" rx="21" transform="rotate(-26 386 262)" fill="#ffffff" fill-opacity="0.10" />
				<rect x="316" y="276" width="140" height="34" rx="17" transform="rotate(-26 386 262)" fill="#000000" fill-opacity="0.22" />
			</g>

			<!-- notes fanned behind the two face blocks -->
			<g transform="translate(118 88) skewY(8)"><rect width="172" height="104" rx="3" fill="#36593c" /></g>
			<g transform="translate(122 92) skewY(8)"><rect width="172" height="104" rx="3" fill="#41694a" /></g>
			<g transform="translate(306 116) skewY(-8)"><rect width="172" height="104" rx="3" fill="#36593c" /></g>
			<g transform="translate(304 118) skewY(-8)"><rect width="172" height="104" rx="3" fill="#41694a" /></g>

			<!-- the two faces, opened like pages -->
			<g transform="translate(126 96) skewY(8)">
				<rect width="172" height="104" rx="3" fill="url(#vm-bill)" />
				<rect x="7" y="7" width="158" height="90" rx="2" fill="none" stroke="#a8ceae" stroke-opacity="0.45" stroke-width="1.5" />
				<ellipse cx="42" cy="52" rx="20" ry="25" fill="#335d3d" />
				<ellipse cx="42" cy="52" rx="13" ry="17" fill="#4d7d57" />
				<ellipse cx="42" cy="52" rx="20" ry="25" fill="none" stroke="#a8ceae" stroke-opacity="0.5" stroke-width="1.4" />
				<g fill="#a8ceae" fill-opacity="0.38">
					<rect x="14" y="13" width="16" height="11" rx="3" />
					<rect x="142" y="13" width="16" height="11" rx="3" />
					<rect x="14" y="80" width="16" height="11" rx="3" />
					<rect x="142" y="80" width="16" height="11" rx="3" />
				</g>
				<g stroke="#a8ceae" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round">
					<line x1="74" y1="40" x2="152" y2="40" />
					<line x1="74" y1="52" x2="152" y2="52" />
					<line x1="74" y1="64" x2="138" y2="64" />
				</g>
			</g>
			<g transform="translate(302 120) skewY(-8)">
				<rect width="172" height="104" rx="3" fill="url(#vm-bill)" />
				<rect x="7" y="7" width="158" height="90" rx="2" fill="none" stroke="#a8ceae" stroke-opacity="0.45" stroke-width="1.5" />
				<ellipse cx="130" cy="52" rx="20" ry="25" fill="#335d3d" />
				<ellipse cx="130" cy="52" rx="13" ry="17" fill="#4d7d57" />
				<ellipse cx="130" cy="52" rx="20" ry="25" fill="none" stroke="#a8ceae" stroke-opacity="0.5" stroke-width="1.4" />
				<g fill="#a8ceae" fill-opacity="0.38">
					<rect x="14" y="13" width="16" height="11" rx="3" />
					<rect x="142" y="13" width="16" height="11" rx="3" />
					<rect x="14" y="80" width="16" height="11" rx="3" />
					<rect x="142" y="80" width="16" height="11" rx="3" />
				</g>
				<g stroke="#a8ceae" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round">
					<line x1="20" y1="40" x2="98" y2="40" />
					<line x1="20" y1="52" x2="98" y2="52" />
					<line x1="34" y1="64" x2="98" y2="64" />
				</g>
			</g>

			<!-- stack edges: this is what makes it a wad and not two notes -->
			<polygon points="126,96 126,200 116,206 116,102" fill="#cac2aa" />
			<polygon points="474,96 474,200 484,206 484,102" fill="#cac2aa" />
			<polygon points="126,200 298,224 298,229 126,205" fill="#e4dcc4" />
			<polygon points="126,205 298,229 298,234 126,210" fill="#cec6ae" />
			<polygon points="126,210 298,234 298,239 126,215" fill="#ded6be" />
			<polygon points="126,215 298,239 298,245 126,221" fill="#c3bba3" />
			<polygon points="302,224 474,200 474,205 302,229" fill="#e4dcc4" />
			<polygon points="302,229 474,205 474,210 302,234" fill="#cec6ae" />
			<polygon points="302,234 474,210 474,215 302,239" fill="#ded6be" />
			<polygon points="302,239 474,215 474,221 302,245" fill="#c3bba3" />

			<!-- band, where a book would have its spine -->
			<polygon points="286,116 314,116 314,248 286,248" fill="#ded4b8" />
			<rect x="286" y="150" width="28" height="16" fill="#a8423f" />
			<polygon points="286,116 314,116 314,248 286,248" fill="none" stroke="#b0a488" stroke-width="1.4" />

			<!-- and the ribbon it would have hanging off it -->
			<path d="M284 242 C 278 280, 289 308, 281 338 L 297 342 C 305 310, 297 280, 300 242 Z" fill="#9e3b38" />
			<path d="M284 242 C 278 280, 289 308, 281 338" fill="none" stroke="#c15b55" stroke-width="2" />

			<!-- fingers over the near edge, thumb on the face -->
			<g>
				<rect x="352" y="232" width="48" height="27" rx="13" transform="rotate(-8 376 245)" fill="var(--vm-skin)" />
				<rect x="352" y="249" width="48" height="10" rx="5" transform="rotate(-8 376 245)" fill="#000000" fill-opacity="0.2" />
				<rect x="398" y="224" width="48" height="27" rx="13" transform="rotate(-8 422 237)" fill="var(--vm-skin)" />
				<rect x="398" y="241" width="48" height="10" rx="5" transform="rotate(-8 422 237)" fill="#000000" fill-opacity="0.2" />
				<rect x="444" y="216" width="44" height="26" rx="13" transform="rotate(-8 466 229)" fill="var(--vm-skin)" />
				<rect x="444" y="232" width="44" height="10" rx="5" transform="rotate(-8 466 229)" fill="#000000" fill-opacity="0.2" />
			</g>
			<g transform="rotate(-16 446 192)">
				<rect x="404" y="176" width="84" height="32" rx="16" fill="var(--vm-skin)" />
				<rect x="404" y="176" width="84" height="12" rx="6" fill="#ffffff" fill-opacity="0.14" />
				<ellipse cx="470" cy="192" rx="13" ry="10" fill="#ffffff" fill-opacity="0.16" />
			</g>
			<path d="M366 236 C 392 250, 424 240, 452 222" fill="none" stroke="#000000" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round" />
		</g>
	</svg>
</div>

<style>
	.viewmodel {
		--vm-skin: #c48a5e;
		position: absolute;
		right: 0;
		bottom: 0;
		width: 62%;
		max-width: 620px;
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
			width: 78%;
		}
	}
</style>
