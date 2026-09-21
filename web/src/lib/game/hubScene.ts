import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';

// Side-effect imports the ES6 package needs for the features used below.
import '@babylonjs/core/Collisions/collisionCoordinator';
import '@babylonjs/core/Culling/ray';

import type { ScenePalette } from '$lib/theme/theme.svelte';
import type { SceneContext, SceneHandle } from './types';
import { hubMarkers, type PortalMarker } from './hubMarkers.svelte';
import { CORRIDOR, PORTALS, type PortalKey, type PortalSpec } from './portals';
import { EXIT_HREF, EXIT_LABEL, room } from './room.svelte';

export { PORTALS };
export type { PortalSpec };

const {
	halfWidth: HALF_W,
	height: HEIGHT,
	doorWidth: DOOR_W,
	doorHeight: DOOR_H,
	wallThickness: WALL_T,
	startZ: START_Z,
	endZ: END_Z,
	spawnZ: SPAWN_Z,
	eyeHeight: EYE_HEIGHT
} = CORRIDOR;

/**
 * A corridor rather than an arena, so navigation is something you walk
 * through rather than something you survey. Narrower FOV than an open space
 * wants: the walls are close, and a wide angle fish-eyes them badly.
 */
const CAMERA_FOV = 0.95;
/** How close to the wall plane counts as having stepped into a doorway. */
const DOOR_TRIGGER_INSET = 0.7;
/** Ceiling lamps, as distances down the corridor. */
const LAMP_DEPTHS = [-2, 5, 12, 19, 25];

interface Door {
	spec: PortalSpec;
	surface: Mesh;
	surfaceMaterial: StandardMaterial;
	light: PointLight;
	/** Centre of the opening, on the wall plane. */
	position: Vector3;
	/** Label anchor, above the opening. */
	anchor: Vector3;
	alt: boolean;
}

export function createHubScene(ctx: SceneContext): SceneHandle {
	const { scene, canvas, palette, navigate } = ctx;
	const engine = scene.getEngine();

	scene.collisionsEnabled = true;
	scene.gravity = new Vector3(0, -0.6, 0);
	scene.fogMode = Scene.FOGMODE_EXP2;
	scene.fogDensity = 0.03;

	const camera = new FreeCamera('hub-camera', new Vector3(0, EYE_HEIGHT, SPAWN_Z), scene);
	camera.setTarget(new Vector3(0, EYE_HEIGHT, SPAWN_Z + 10));
	camera.fov = CAMERA_FOV;
	camera.minZ = 0.1;
	camera.speed = 0.5;
	camera.angularSensibility = 2600;
	camera.inertia = 0.82;
	camera.checkCollisions = true;
	camera.applyGravity = true;
	camera.ellipsoid = new Vector3(0.5, EYE_HEIGHT / 2, 0.5);
	// WASD in addition to the arrow keys Babylon binds by default.
	camera.keysUp = [87, 38];
	camera.keysDown = [83, 40];
	camera.keysLeft = [65, 37];
	camera.keysRight = [68, 39];

	const ambient = new HemisphericLight('hub-ambient', new Vector3(0, 1, 0), scene);
	ambient.intensity = 0.5;

	const glow = new GlowLayer('hub-glow', scene, { blurKernelSize: 40 });
	glow.intensity = 0.62;

	// --- materials ---
	// The walls carry no texture. Panel seams and trim are real (thin) geometry
	// instead, because a box's UVs run 0–1 per face: one shared wall texture
	// would stretch differently on every segment length.
	const concrete = new StandardMaterial('hub-concrete', scene);
	concrete.specularColor = Color3.Black();
	concrete.maxSimultaneousLights = 8;

	const concreteDark = new StandardMaterial('hub-concrete-dark', scene);
	concreteDark.specularColor = Color3.Black();
	concreteDark.maxSimultaneousLights = 8;

	const seamMaterial = new StandardMaterial('hub-seam', scene);
	seamMaterial.specularColor = Color3.Black();
	seamMaterial.maxSimultaneousLights = 8;

	const floorMaterial = new StandardMaterial('hub-floor', scene);
	floorMaterial.specularColor = Color3.Black();
	floorMaterial.maxSimultaneousLights = 8;

	const lampMaterial = new StandardMaterial('hub-lamp', scene);
	makeEmissiveOnly(lampMaterial);

	const frameMaterial = new StandardMaterial('hub-frame', scene);
	frameMaterial.specularColor = Color3.Black();
	frameMaterial.maxSimultaneousLights = 8;

	const floorTexture = new DynamicTexture('hub-floor-tex', { width: 512, height: 512 }, scene, true);
	floorTexture.wrapU = Texture.WRAP_ADDRESSMODE;
	floorTexture.wrapV = Texture.WRAP_ADDRESSMODE;
	const length = END_Z - START_Z;
	floorTexture.uScale = (HALF_W * 2) / 2.4;
	floorTexture.vScale = length / 2.4;
	floorMaterial.diffuseTexture = floorTexture;

	// --- shell ---
	const midZ = (START_Z + END_Z) / 2;

	const floor = MeshBuilder.CreateGround(
		'hub-floor',
		{ width: HALF_W * 2, height: length },
		scene
	);
	floor.position.z = midZ;
	floor.material = floorMaterial;
	floor.checkCollisions = true;

	const ceiling = MeshBuilder.CreateBox(
		'hub-ceiling',
		{ width: HALF_W * 2, height: WALL_T, depth: length },
		scene
	);
	ceiling.position.set(0, HEIGHT + WALL_T / 2, midZ);
	ceiling.material = concreteDark;
	ceiling.checkCollisions = true;

	const backWall = MeshBuilder.CreateBox(
		'hub-back',
		{ width: HALF_W * 2, height: HEIGHT, depth: WALL_T },
		scene
	);
	backWall.position.set(0, HEIGHT / 2, START_Z - WALL_T / 2);
	backWall.material = concrete;
	backWall.checkCollisions = true;

	/** A flat slab of wall, at x = ±(halfWidth), spanning a z and y range. */
	function sideWall(name: string, sign: -1 | 1, z0: number, z1: number, y0: number, y1: number) {
		const mesh = MeshBuilder.CreateBox(
			name,
			{ width: WALL_T, height: y1 - y0, depth: z1 - z0 },
			scene
		);
		mesh.position.set(sign * (HALF_W + WALL_T / 2), (y0 + y1) / 2, (z0 + z1) / 2);
		mesh.material = concrete;
		mesh.checkCollisions = true;
		return mesh;
	}

	const sideDoors = PORTALS.filter((p) => p.side !== 'end');

	for (const sign of [-1, 1] as const) {
		const wantedSide = sign === -1 ? 'left' : 'right';
		const openings = sideDoors
			.filter((p) => p.side === wantedSide)
			.map((p) => [p.depth - DOOR_W / 2, p.depth + DOOR_W / 2] as const)
			.sort((a, b) => a[0] - b[0]);

		// Solid stretches between the openings. Annotated, because CORRIDOR is
		// `as const` and the inferred literal type would not take a new z.
		let cursor: number = START_Z;
		openings.forEach(([z0, z1], i) => {
			if (z0 > cursor) sideWall(`hub-wall-${wantedSide}-${i}`, sign, cursor, z0, 0, HEIGHT);
			// The lintel over the opening.
			sideWall(`hub-lintel-${wantedSide}-${i}`, sign, z0, z1, DOOR_H, HEIGHT);
			cursor = z1;
		});
		if (cursor < END_Z) sideWall(`hub-wall-${wantedSide}-tail`, sign, cursor, END_Z, 0, HEIGHT);

		// A backstop just outside each opening, so a visitor who slips past the
		// trigger hits geometry rather than falling out of the world.
		for (const [z0, z1] of openings) {
			const stop = MeshBuilder.CreateBox(
				`hub-stop-${wantedSide}-${z0}`,
				{ width: WALL_T, height: HEIGHT, depth: z1 - z0 },
				scene
			);
			stop.position.set(sign * (HALF_W + 2.2), HEIGHT / 2, (z0 + z1) / 2);
			stop.material = concreteDark;
			stop.checkCollisions = true;
			stop.isVisible = true;
		}
	}

	// The far wall, with the `end` door cut out of it.
	const endDoorSpec = PORTALS.find((p) => p.side === 'end');
	{
		const sideSpan = (HALF_W * 2 - DOOR_W) / 2;
		for (const sign of [-1, 1] as const) {
			const panel = MeshBuilder.CreateBox(
				`hub-end-${sign}`,
				{ width: sideSpan, height: HEIGHT, depth: WALL_T },
				scene
			);
			panel.position.set(sign * (DOOR_W / 2 + sideSpan / 2), HEIGHT / 2, END_Z + WALL_T / 2);
			panel.material = concrete;
			panel.checkCollisions = true;
		}
		const lintel = MeshBuilder.CreateBox(
			'hub-end-lintel',
			{ width: DOOR_W, height: HEIGHT - DOOR_H, depth: WALL_T },
			scene
		);
		lintel.position.set(0, (HEIGHT + DOOR_H) / 2, END_Z + WALL_T / 2);
		lintel.material = concrete;
		lintel.checkCollisions = true;

		const stop = MeshBuilder.CreateBox(
			'hub-end-stop',
			{ width: DOOR_W, height: HEIGHT, depth: WALL_T },
			scene
		);
		stop.position.set(0, HEIGHT / 2, END_Z + 2.2);
		stop.material = concreteDark;
		stop.checkCollisions = true;
	}

	// --- kick plate and trim, the detail that makes it read as a facility ---
	for (const sign of [-1, 1] as const) {
		const kick = MeshBuilder.CreateBox(
			`hub-kick-${sign}`,
			{ width: 0.06, height: 0.34, depth: length },
			scene
		);
		kick.position.set(sign * (HALF_W - 0.03), 0.17, midZ);
		kick.material = seamMaterial;

		const rail = MeshBuilder.CreateBox(
			`hub-rail-${sign}`,
			{ width: 0.1, height: 0.1, depth: length },
			scene
		);
		rail.position.set(sign * (HALF_W - 0.05), HEIGHT - 0.55, midZ);
		rail.material = seamMaterial;
	}

	// Vertical panel seams, every couple of metres down both walls.
	for (let z = START_Z + 2.4; z < END_Z; z += 2.4) {
		for (const sign of [-1, 1] as const) {
			const seam = MeshBuilder.CreateBox(
				`hub-seam-${sign}-${z.toFixed(1)}`,
				{ width: 0.05, height: HEIGHT, depth: 0.07 },
				scene
			);
			seam.position.set(sign * (HALF_W - 0.025), HEIGHT / 2, z);
			seam.material = seamMaterial;
		}
	}

	// --- ceiling lamps ---
	const lamps = LAMP_DEPTHS.map((z, i) => {
		const panel = MeshBuilder.CreateBox(
			`hub-lamp-${i}`,
			{ width: 1.7, height: 0.1, depth: 2.2 },
			scene
		);
		panel.position.set(0, HEIGHT - 0.06, z);
		panel.material = lampMaterial;

		const housing = MeshBuilder.CreateBox(
			`hub-lamp-housing-${i}`,
			{ width: 2.1, height: 0.18, depth: 2.6 },
			scene
		);
		housing.position.set(0, HEIGHT - 0.02, z);
		housing.material = concreteDark;
		return panel;
	});

	// --- doors ---
	const doors: Door[] = PORTALS.map((spec, i) => {
		const sign = spec.side === 'left' ? -1 : 1;
		const isEnd = spec.side === 'end';

		const position = isEnd
			? new Vector3(0, DOOR_H / 2, END_Z)
			: new Vector3(sign * HALF_W, DOOR_H / 2, spec.depth);

		const surface = MeshBuilder.CreatePlane(
			`door-${i}-surface`,
			{ width: DOOR_W, height: DOOR_H, sideOrientation: 2 },
			scene
		);
		surface.position = position.clone();
		// Planes face +z by default; the side doors have to turn to face inward.
		if (!isEnd) surface.rotation.y = sign === -1 ? Math.PI / 2 : -Math.PI / 2;

		const surfaceMaterial = new StandardMaterial(`door-${i}-mat`, scene);
		makeEmissiveOnly(surfaceMaterial);
		surfaceMaterial.alpha = 0.92;
		surfaceMaterial.backFaceCulling = false;
		surface.material = surfaceMaterial;

		// A frame, so the opening reads as cut into the wall rather than painted on.
		const frameDepth = isEnd ? 0.12 : DOOR_W + 0.3;
		const frameWidth = isEnd ? DOOR_W + 0.3 : 0.12;
		for (const dy of [-1, 1] as const) {
			const bar = MeshBuilder.CreateBox(
				`door-${i}-frame-${dy}`,
				{ width: frameWidth, height: 0.14, depth: frameDepth },
				scene
			);
			bar.position.set(
				position.x + (isEnd ? 0 : -sign * 0.06),
				dy === -1 ? 0.07 : DOOR_H + 0.07,
				isEnd ? END_Z - 0.06 : spec.depth
			);
			bar.material = frameMaterial;
		}

		const light = new PointLight(
			`door-${i}-light`,
			position.add(new Vector3(isEnd ? 0 : -sign * 1.2, 0.4, isEnd ? -1.2 : 0)),
			scene
		);
		light.intensity = 0.7;
		light.range = 11;

		const anchor = isEnd
			? new Vector3(0, DOOR_H + 0.55, END_Z)
			: new Vector3(sign * (HALF_W - 0.1), DOOR_H + 0.55, spec.depth);

		return { spec, surface, surfaceMaterial, light, position, anchor, alt: i % 2 === 1 };
	});

	// --- state ---
	let interactive = false;
	let navigating = false;
	let elapsed = 0;
	/** Ambient mode walks the corridor on a loop instead of standing still. */
	let ambientZ = SPAWN_Z;

	// Held so the doorways can be repainted when the room changes, which is not
	// when the palette changes.
	let doorColor = Color3.White();
	let doorAlt = Color3.White();
	let paintedRoom: PortalKey | null = null;

	/**
	 * The exit takes the other accent and burns a little brighter, so it reads
	 * as the way out from down the corridor — long before the label over it is
	 * big enough to read, and at tile size where it never will be.
	 */
	function paintDoors() {
		paintedRoom = room.key;
		for (const door of doors) {
			const exit = door.spec.key === room.key;
			const color = exit || door.alt ? doorAlt : doorColor;
			door.surfaceMaterial.emissiveColor = color.scale(exit ? 1.15 : 0.85);
			door.light.diffuse = color;
		}
	}

	function applyPalette(p: ScenePalette) {
		const sky = hexColor(p.sky);
		const ground = hexColor(p.ground);
		const grid = hexColor(p.grid);
		const lightColor = hexColor(p.light);
		doorColor = hexColor(p.portal);
		doorAlt = hexColor(p.portalAlt);

		scene.clearColor = new Color4(sky.r, sky.g, sky.b, 1);
		scene.fogColor = hexColor(p.fog);
		ambient.diffuse = lightColor;
		ambient.groundColor = ground.scale(0.5);

		concrete.diffuseColor = ground.scale(1.35);
		concrete.emissiveColor = ground.scale(0.12);
		concreteDark.diffuseColor = ground.scale(0.7);
		concreteDark.emissiveColor = ground.scale(0.06);
		seamMaterial.diffuseColor = ground.scale(0.4);
		frameMaterial.diffuseColor = grid.scale(1.1);
		frameMaterial.emissiveColor = grid.scale(0.2);

		floorMaterial.diffuseColor = Color3.White();
		floorMaterial.emissiveColor = ground.scale(0.18);
		paintFloor(floorTexture, normalizeHex(p.ground), normalizeHex(p.grid));

		lampMaterial.emissiveColor = lightColor.scale(0.95);

		paintDoors();
	}

	function setInteractive(next: boolean) {
		if (next === interactive) return;
		interactive = next;
		if (next) {
			camera.attachControl(canvas, true);
			// Always start at the mouth of the corridor, facing down it, wherever
			// the ambient walk left off.
			camera.position.set(0, EYE_HEIGHT, SPAWN_Z);
			camera.setTarget(new Vector3(0, EYE_HEIGHT, SPAWN_Z + 10));
		} else {
			camera.detachControl();
			hubMarkers.clear();
		}
		navigating = false;
	}

	/**
	 * What a doorway leads to right now.
	 *
	 * Normally its own room. But the door of the room you are already in is the
	 * way out, not a link back to the page under your nose — so it is relabelled
	 * and pointed at the hub. Every route out of the corridor goes through here,
	 * so a doorway cannot say one thing and do another.
	 */
	function doorTarget(door: Door): { href: string; label: string } {
		if (door.spec.key !== room.key) {
			return { href: door.spec.href, label: door.spec.label };
		}
		return { href: EXIT_HREF, label: EXIT_LABEL };
	}

	// Clicking a doorway works everywhere, and is the only way in on a
	// touchscreen, where there is no pointer lock and no keyboard.
	const pointerObserver = scene.onPointerObservable.add((info) => {
		if (info.type !== PointerEventTypes.POINTERPICK || !interactive || navigating) return;
		const picked = info.pickInfo?.pickedMesh;
		if (!picked) return;
		const door = doors.find((d) => picked === d.surface);
		if (door) {
			navigating = true;
			navigate(doorTarget(door).href);
		}
	});

	/** Projects each doorway to canvas-relative coordinates for the HTML labels. */
	function publishMarkers() {
		const width = engine.getRenderWidth();
		const height = engine.getRenderHeight();
		if (width === 0 || height === 0) return;

		const transform = scene.getTransformMatrix();
		const viewport = camera.viewport.toGlobal(width, height);
		const forward = camera.getForwardRay().direction;

		const next: PortalMarker[] = doors.map((door) => {
			const projected = Vector3.Project(door.anchor, Matrix.Identity(), transform, viewport);
			const toDoor = door.anchor.subtract(camera.position);
			const distance = toDoor.length();
			const ahead = Vector3.Dot(toDoor.normalize(), forward) > 0.15;

			const x = projected.x / width;
			const y = projected.y / height;
			return {
				...door.spec,
				...doorTarget(door),
				x,
				y,
				distance,
				// A generous margin: a label half off screen is still a useful cue.
				visible: ahead && x > -0.15 && x < 1.15 && y > -0.15 && y < 1.15
			};
		});
		hubMarkers.set(next);
	}

	/** True once the camera has stepped into the mouth of a doorway. */
	function entered(door: Door): boolean {
		const { x, z } = camera.position;
		if (door.spec.side === 'end') {
			return z > END_Z - DOOR_TRIGGER_INSET && Math.abs(x) < DOOR_W / 2;
		}
		const sign = door.spec.side === 'left' ? -1 : 1;
		const past = sign === -1 ? x < -(HALF_W - DOOR_TRIGGER_INSET) : x > HALF_W - DOOR_TRIGGER_INSET;
		return past && Math.abs(z - door.spec.depth) < DOOR_W / 2;
	}

	function update(deltaMs: number) {
		const dt = Math.min(deltaMs, 100) / 1000;
		elapsed += dt;

		if (paintedRoom !== room.key) paintDoors();

		for (const door of doors) {
			// A slow breath across the opening, so a doorway never looks like a
			// flat coloured rectangle.
			const pulse = Math.sin(elapsed * 1.6 + door.position.z) * 0.04;
			door.surface.scaling.y = 1 + pulse;
			door.light.intensity = 0.6 + Math.sin(elapsed * 2.1 + door.position.z) * 0.12;
		}

		for (let i = 0; i < lamps.length; i++) {
			// A barely-there flicker on one lamp. Facilities hum.
			if (i === 2) lamps[i].scaling.y = 1 + Math.sin(elapsed * 17) * 0.04;
		}

		if (!interactive) {
			ambientZ += dt * 1.4;
			if (ambientZ > END_Z - 5) ambientZ = SPAWN_Z;
			camera.position.set(
				Math.sin(elapsed * 0.35) * 0.5,
				EYE_HEIGHT + Math.sin(elapsed * 1.6) * 0.04,
				ambientZ
			);
			camera.setTarget(new Vector3(0, EYE_HEIGHT, ambientZ + 9));
			return;
		}

		publishMarkers();

		if (navigating) return;
		for (const door of doors) {
			if (entered(door)) {
				navigating = true;
				navigate(doorTarget(door).href);
				return;
			}
		}
	}

	applyPalette(palette);

	return {
		id: 'hub',
		scene,
		setPalette: applyPalette,
		setInteractive,
		update,
		dispose() {
			scene.onPointerObservable.remove(pointerObserver);
			hubMarkers.clear();
			scene.dispose();
			glow.dispose();
		}
	};
}

// --- helpers ---

/**
 * Turns a StandardMaterial into one that shows exactly its emissive colour.
 *
 * `disableLighting` alone is not enough: the shader then treats `diffuseColor`
 * as a full-brightness base and adds emissive on top of it, so the default
 * white diffuse clips everything towards white.
 */
function makeEmissiveOnly(material: StandardMaterial) {
	material.disableLighting = true;
	material.diffuseColor = Color3.Black();
	material.specularColor = Color3.Black();
	material.ambientColor = Color3.Black();
}

/**
 * getComputedStyle can hand back `#abc`, `#aabbcc` or `rgb(...)` depending on
 * the browser and how the variable was written. Babylon only accepts six-digit
 * hex, so everything is normalised here.
 */
function normalizeHex(value: string): string {
	const v = value.trim();
	if (/^#[0-9a-f]{6}$/i.test(v)) return v;
	if (/^#[0-9a-f]{3}$/i.test(v)) {
		return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
	}
	const rgb = v.match(/^rgba?\(([^)]+)\)$/i);
	if (rgb) {
		const [r, g, b] = rgb[1]
			.split(/[,\s/]+/)
			.slice(0, 3)
			.map((n) => Math.max(0, Math.min(255, Math.round(parseFloat(n)))));
		return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
	}
	return '#9dff3c';
}

function hexColor(value: string): Color3 {
	return Color3.FromHexString(normalizeHex(value));
}

/** Floor plates: a seam grid with a painted centre line down the corridor. */
function paintFloor(texture: DynamicTexture, background: string, line: string) {
	const ctx = texture.getContext() as CanvasRenderingContext2D;
	const size = texture.getSize();

	ctx.fillStyle = background;
	ctx.fillRect(0, 0, size.width, size.height);

	ctx.strokeStyle = line;
	ctx.lineWidth = 5;
	ctx.strokeRect(0, 0, size.width, size.height);

	ctx.lineWidth = 1;
	ctx.globalAlpha = 0.35;
	ctx.beginPath();
	ctx.moveTo(size.width / 2, 0);
	ctx.lineTo(size.width / 2, size.height);
	ctx.moveTo(0, size.height / 2);
	ctx.lineTo(size.width, size.height / 2);
	ctx.stroke();

	// Scuffs, so a long run of identical plates does not read as wallpaper.
	ctx.globalAlpha = 0.14;
	for (let i = 0; i < 24; i++) {
		const x = (i * 97) % size.width;
		const y = (i * 211) % size.height;
		ctx.fillStyle = line;
		ctx.fillRect(x, y, 18 + (i % 5) * 9, 3);
	}
	ctx.globalAlpha = 1;

	texture.update();
}
