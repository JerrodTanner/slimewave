import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';

import type { ScenePalette } from '$lib/theme/theme.svelte';
import type { SceneContext, SceneHandle } from './types';
import { arcade } from './arcadeState.svelte';

/**
 * Slime Run: a 45-second collection game.
 *
 * It is a second scene on the *same* engine as the hub, not a second canvas.
 * Browsers cap live WebGL contexts (and drop the oldest when you pass the
 * cap), so every game here shares one context and the stage swaps which scene
 * renders. Only the hub is kept resident; this one is released on exit.
 */
const ARENA_RADIUS = 18;
const RUN_SECONDS = 45;
const ORB_COUNT = 7;
const MOVE_ACCEL = 42;
const MAX_SPEED = 13;
const FRICTION = 3.4;

export function createSlimeRunScene(ctx: SceneContext): SceneHandle {
	const { scene, canvas, palette } = ctx;

	scene.fogMode = Scene.FOGMODE_EXP2;
	scene.fogDensity = 0.018;

	const camera = new ArcRotateCamera(
		'run-camera',
		-Math.PI / 2,
		Math.PI / 3.1,
		26,
		Vector3.Zero(),
		scene
	);
	camera.lowerBetaLimit = 0.4;
	camera.upperBetaLimit = Math.PI / 2.35;
	camera.lowerRadiusLimit = 14;
	camera.upperRadiusLimit = 38;

	const light = new HemisphericLight('run-light', new Vector3(0.3, 1, 0.2), scene);
	light.intensity = 0.7;

	const glow = new GlowLayer('run-glow', scene, { blurKernelSize: 40 });
	glow.intensity = 0.9;

	const floorMaterial = new StandardMaterial('run-floor-mat', scene);
	floorMaterial.specularColor = Color3.Black();
	const floor = MeshBuilder.CreateDisc('run-floor', { radius: ARENA_RADIUS, tessellation: 64 }, scene);
	floor.rotation.x = Math.PI / 2;
	floor.material = floorMaterial;

	const rimMaterial = new StandardMaterial('run-rim-mat', scene);
	makeEmissiveOnly(rimMaterial);
	const rim = MeshBuilder.CreateTorus(
		'run-rim',
		{ diameter: ARENA_RADIUS * 2, thickness: 0.35, tessellation: 72 },
		scene
	);
	rim.material = rimMaterial;
	rim.position.y = 0.1;

	const playerMaterial = new StandardMaterial('run-player-mat', scene);
	makeEmissiveOnly(playerMaterial);
	const player = MeshBuilder.CreateSphere('run-player', { diameter: 1.6, segments: 16 }, scene);
	player.material = playerMaterial;
	player.position.y = 0.8;

	const orbMaterial = new StandardMaterial('run-orb-mat', scene);
	makeEmissiveOnly(orbMaterial);

	interface Orb {
		mesh: Mesh;
		phase: number;
		alive: boolean;
	}

	const orbs: Orb[] = Array.from({ length: ORB_COUNT }, (_, i) => {
		const mesh = MeshBuilder.CreateSphere(`run-orb-${i}`, { diameter: 0.9, segments: 12 }, scene);
		mesh.material = orbMaterial;
		return { mesh, phase: i * 0.9, alive: true };
	});

	function scatter(orb: Orb) {
		const angle = Math.random() * Math.PI * 2;
		const radius = 3 + Math.random() * (ARENA_RADIUS - 5);
		orb.mesh.position.set(Math.cos(angle) * radius, 0.9, Math.sin(angle) * radius);
		orb.mesh.isVisible = true;
		orb.alive = true;
	}
	orbs.forEach(scatter);

	// --- input ---
	const held = new Set<string>();
	let interactive = false;

	const onKeyDown = (e: KeyboardEvent) => {
		if (MOVEMENT_KEYS.has(e.key.toLowerCase())) {
			held.add(e.key.toLowerCase());
			e.preventDefault();
		}
		if (e.key === ' ' && !arcade.running) {
			arcade.begin(RUN_SECONDS);
			resetRun();
			e.preventDefault();
		}
	};
	const onKeyUp = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
	const onBlur = () => held.clear();

	function setInteractive(next: boolean) {
		if (next === interactive) return;
		interactive = next;
		if (next) {
			camera.attachControl(canvas, true);
			window.addEventListener('keydown', onKeyDown);
			window.addEventListener('keyup', onKeyUp);
			window.addEventListener('blur', onBlur);
		} else {
			camera.detachControl();
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', onBlur);
			held.clear();
		}
	}

	const velocity = new Vector3(0, 0, 0);
	let elapsed = 0;

	function resetRun() {
		player.position.set(0, 0.8, 0);
		velocity.setAll(0);
		orbs.forEach(scatter);
	}

	function applyPalette(p: ScenePalette) {
		const sky = hexColor(p.sky);
		scene.clearColor = new Color4(sky.r, sky.g, sky.b, 1);
		scene.fogColor = hexColor(p.fog);
		light.diffuse = hexColor(p.light);
		light.groundColor = hexColor(p.ground);

		floorMaterial.diffuseColor = hexColor(p.ground);
		floorMaterial.emissiveColor = hexColor(p.ground).scale(0.4);
		rimMaterial.emissiveColor = hexColor(p.grid);
		playerMaterial.emissiveColor = hexColor(p.portal);
		orbMaterial.emissiveColor = hexColor(p.portalAlt);
	}

	function update(deltaMs: number) {
		const dt = Math.min(deltaMs, 100) / 1000;
		elapsed += dt;

		// Orbs bob and spin whether or not a run is going, so the scene looks
		// alive on the "press space" screen.
		for (const orb of orbs) {
			if (!orb.alive) continue;
			orb.mesh.position.y = 0.9 + Math.sin(elapsed * 2.2 + orb.phase) * 0.22;
			orb.mesh.rotation.y += dt * 1.4;
		}
		player.rotation.x += velocity.z * dt * 0.6;
		player.rotation.z -= velocity.x * dt * 0.6;

		if (!interactive || !arcade.running) {
			camera.alpha += dt * 0.08;
			return;
		}

		// Movement is relative to the camera, so "up" always means away from you.
		const forward = camera.getForwardRay().direction;
		const flatForward = new Vector3(forward.x, 0, forward.z).normalize();
		const right = new Vector3(flatForward.z, 0, -flatForward.x);

		const input = new Vector3(0, 0, 0);
		if (held.has('w') || held.has('arrowup')) input.addInPlace(flatForward);
		if (held.has('s') || held.has('arrowdown')) input.subtractInPlace(flatForward);
		if (held.has('d') || held.has('arrowright')) input.subtractInPlace(right);
		if (held.has('a') || held.has('arrowleft')) input.addInPlace(right);

		if (input.lengthSquared() > 0) {
			input.normalize().scaleInPlace(MOVE_ACCEL * dt);
			velocity.addInPlace(input);
		}

		// Friction, then clamp, so letting go coasts to a stop.
		const damping = Math.max(0, 1 - FRICTION * dt);
		velocity.scaleInPlace(damping);
		const speed = Math.hypot(velocity.x, velocity.z);
		if (speed > MAX_SPEED) {
			velocity.scaleInPlace(MAX_SPEED / speed);
		}

		player.position.x += velocity.x * dt;
		player.position.z += velocity.z * dt;

		// Bounce off the rim rather than letting the slime leave the arena.
		const distance = Math.hypot(player.position.x, player.position.z);
		const limit = ARENA_RADIUS - 1;
		if (distance > limit) {
			const nx = player.position.x / distance;
			const nz = player.position.z / distance;
			player.position.x = nx * limit;
			player.position.z = nz * limit;
			const dot = velocity.x * nx + velocity.z * nz;
			velocity.x = (velocity.x - 2 * dot * nx) * 0.6;
			velocity.z = (velocity.z - 2 * dot * nz) * 0.6;
		}

		camera.target = Vector3.Lerp(camera.target, player.position, Math.min(1, dt * 4));

		for (const orb of orbs) {
			if (!orb.alive) continue;
			const dx = orb.mesh.position.x - player.position.x;
			const dz = orb.mesh.position.z - player.position.z;
			if (Math.hypot(dx, dz) < 1.4) {
				arcade.score += 1;
				scatter(orb);
			}
		}

		arcade.timeLeft = Math.max(0, arcade.timeLeft - dt);
		if (arcade.timeLeft <= 0) {
			arcade.end();
			resetRun();
		}
	}

	applyPalette(palette);
	arcade.configure('slime-run');

	return {
		id: 'slime-run',
		scene,
		setPalette: applyPalette,
		setInteractive,
		update,
		dispose() {
			setInteractive(false);
			arcade.reset();
			scene.dispose();
			glow.dispose();
		}
	};
}

const MOVEMENT_KEYS = new Set([
	'w',
	'a',
	's',
	'd',
	'arrowup',
	'arrowdown',
	'arrowleft',
	'arrowright'
]);

/** See the note in hubScene: disableLighting alone clips emissive to white. */
function makeEmissiveOnly(material: StandardMaterial) {
	material.disableLighting = true;
	material.diffuseColor = Color3.Black();
	material.specularColor = Color3.Black();
	material.ambientColor = Color3.Black();
}

/** Accepts the hex the theme variables use, with a safe fallback. */
function hexColor(value: string): Color3 {
	const v = value.trim();
	if (/^#[0-9a-f]{6}$/i.test(v)) return Color3.FromHexString(v);
	if (/^#[0-9a-f]{3}$/i.test(v)) {
		return Color3.FromHexString(`#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`);
	}
	return new Color3(0.6, 1, 0.24);
}

export const SLIME_RUN_DURATION = RUN_SECONDS;
