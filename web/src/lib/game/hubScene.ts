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
import { DOOR_ICON, EXIT_ICON } from './doorIcons';
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
/** The glyph plate in each opening: metres square, and how high it hangs. */
const ICON_SIZE = 1.15;
const ICON_Y = 1.95;

interface Door {
	spec: PortalSpec;
	surface: Mesh;
	surfaceMaterial: StandardMaterial;
	/** The lit panel at the back of the recess, seen through the opening. */
	glowMaterial: StandardMaterial;
	/** The door's own sign, repainted whenever the door itself is. */
	iconTexture: DynamicTexture;
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
	// The arrow keys are what the HUD tells you to use, because one set has to
	// be on the readout and they are the set that needs no explaining. WASD is
	// bound too and always will be: the hand that reaches for it already knows
	// what it is doing, and nothing is gained by refusing it.
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

	// The far wall. A doorway is cut into it only if some door asks for one;
	// with no `end` door on the list the corridor simply stops there, so the
	// wall is drawn whole rather than left standing open onto nothing.
	const endDoorSpec = PORTALS.find((p) => p.side === 'end');
	if (!endDoorSpec) {
		const wall = MeshBuilder.CreateBox(
			'hub-end',
			{ width: HALF_W * 2, height: HEIGHT, depth: WALL_T },
			scene
		);
		wall.position.set(0, HEIGHT / 2, END_Z + WALL_T / 2);
		wall.material = concrete;
		wall.checkCollisions = true;
	} else {
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

	// --- coffered ceiling ---
	// The ceiling was one flat slab, which read as a lid rather than structure.
	// Transverse beams on the same 2.4m cadence as the wall seams, plus two
	// runs down the length, make it a grid of recessed panels. A beam that
	// would land on a lamp is skipped rather than drawn across it.
	for (let z = START_Z + 2.4; z < END_Z; z += 2.4) {
		if (LAMP_DEPTHS.some((lampZ) => Math.abs(lampZ - z) < 1.4)) continue;
		const beam = MeshBuilder.CreateBox(
			`hub-beam-${z.toFixed(1)}`,
			{ width: HALF_W * 2, height: 0.18, depth: 0.16 },
			scene
		);
		beam.position.set(0, HEIGHT - 0.09, z);
		beam.material = seamMaterial;
	}
	for (const x of [-1.25, 1.25]) {
		const run = MeshBuilder.CreateBox(
			`hub-beam-run-${x}`,
			{ width: 0.16, height: 0.18, depth: length },
			scene
		);
		run.position.set(x, HEIGHT - 0.09, midZ);
		run.material = seamMaterial;
	}

	// --- wall sconces ---
	// The corridor's character light. The ceiling panels are fill; these are
	// what shapes it, throwing a pool up and down the wall and onto the floor
	// beside it. Depths are chosen to miss the doorways.
	//
	// Every fixture gets an emissive face, which costs nothing, but only two
	// pairs get a real PointLight: the materials cap at eight lights each and
	// the doorways already claim several of those. Babylon keeps the nearest
	// per mesh, which is the right answer anyway.
	const SCONCE_DEPTHS = [-3.5, 2.5, 12.5, 22.5];
	const SCONCE_LIT = [2.5, 22.5];
	for (const z of SCONCE_DEPTHS) {
		for (const sign of [-1, 1] as const) {
			const housing = MeshBuilder.CreateBox(
				`hub-sconce-housing-${sign}-${z}`,
				{ width: 0.18, height: 0.56, depth: 0.38 },
				scene
			);
			housing.position.set(sign * (HALF_W - 0.09), 2.6, z);
			housing.material = concreteDark;

			const face = MeshBuilder.CreateBox(
				`hub-sconce-${sign}-${z}`,
				{ width: 0.07, height: 0.42, depth: 0.26 },
				scene
			);
			face.position.set(sign * (HALF_W - 0.2), 2.6, z);
			face.material = lampMaterial;

			if (!SCONCE_LIT.includes(z)) continue;
			const light = new PointLight(
				`hub-sconce-light-${sign}-${z}`,
				new Vector3(sign * (HALF_W - 0.6), 2.5, z),
				scene
			);
			light.intensity = 0.6;
			light.range = 8;
		}
	}

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
		// Nearly clear. A doorway is an opening you see through, not a slab of
		// light standing in it — this is enough tint to say which door it is,
		// and something for a click to land on.
		surfaceMaterial.alpha = 0.18;
		surfaceMaterial.backFaceCulling = false;
		surface.material = surfaceMaterial;

		// The room beyond. There has always been a backstop 2.2m behind every
		// opening; this puts a lit panel just in front of it, so a doorway
		// reads as somewhere you could walk into rather than a bright plane.
		const glow = MeshBuilder.CreatePlane(
			`door-${i}-glow`,
			{ width: DOOR_W, height: DOOR_H, sideOrientation: 2 },
			scene
		);
		glow.position = isEnd
			? new Vector3(0, DOOR_H / 2, END_Z + 1.95)
			: new Vector3(sign * (HALF_W + 1.95), DOOR_H / 2, spec.depth);
		if (!isEnd) glow.rotation.y = sign === -1 ? Math.PI / 2 : -Math.PI / 2;
		// The plane in the opening is the pick target; this one must not steal
		// the ray, or a click would land behind the door rather than on it.
		glow.isPickable = false;

		const glowMaterial = new StandardMaterial(`door-${i}-glow-mat`, scene);
		makeEmissiveOnly(glowMaterial);
		glowMaterial.backFaceCulling = false;
		glow.material = glowMaterial;

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
		// It sits in the corridor rather than in the recess, because what sells
		// an open door is the light landing on the floor outside it.
		light.intensity = 1.15;
		light.range = 14;

		// The door's own sign, hung in the opening at head height. The glyph is
		// the one the rail and the titlebar wear — same paths, drawn onto a
		// canvas instead of into the DOM. Its colour is painted rather than
		// tinted, so the plate carries the drawing and the material only has to
		// know where the ink is.
		const iconTexture = new DynamicTexture(
			`door-${i}-icon`,
			{ width: 256, height: 256 },
			scene,
			true
		);
		iconTexture.hasAlpha = true;

		const iconMaterial = new StandardMaterial(`door-${i}-icon-mat`, scene);
		makeEmissiveOnly(iconMaterial);
		iconMaterial.emissiveTexture = iconTexture;
		iconMaterial.opacityTexture = iconTexture;
		iconMaterial.backFaceCulling = false;

		const iconPlate = MeshBuilder.CreatePlane(`door-${i}-icon-plate`, { size: ICON_SIZE }, scene);
		// A hair inside the corridor from the opening, so it never z-fights the
		// tinted plane it hangs in front of.
		iconPlate.position = isEnd
			? new Vector3(0, ICON_Y, END_Z - 0.06)
			: new Vector3(sign * (HALF_W - 0.06), ICON_Y, spec.depth);
		// Planes face +z. Every one of these has to face the corridor instead,
		// which for the far door means turning right around.
		iconPlate.rotation.y = isEnd ? Math.PI : sign === -1 ? Math.PI / 2 : -Math.PI / 2;
		iconPlate.material = iconMaterial;
		// The tinted plane behind it is the pick target; a sign that ate the
		// click would make the door stop opening where it looks like it should.
		iconPlate.isPickable = false;

		const anchor = isEnd
			? new Vector3(0, DOOR_H + 0.55, END_Z)
			: new Vector3(sign * (HALF_W - 0.1), DOOR_H + 0.55, spec.depth);

		return {
			spec,
			surface,
			surfaceMaterial,
			glowMaterial,
			iconTexture,
			light,
			position,
			anchor,
			alt: i % 2 === 1
		};
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
			door.glowMaterial.emissiveColor = color.scale(exit ? 1.3 : 1);
			door.light.diffuse = color;
			// The sign makes the same swap the label does: the door of the room
			// you are in is the way out, so it stops advertising the section.
			paintIcon(
				door.iconTexture,
				exit ? EXIT_ICON : DOOR_ICON[door.spec.key],
				color.toHexString()
			);
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

/**
 * A door's sign, stroked onto its plate.
 *
 * The paths are the same 24-unit glyphs the rail draws, so the drawing is
 * scaled into the canvas rather than redrawn for it. Everything lands in the
 * alpha channel as well as the colour channels, which is what lets one texture
 * be both the emissive and the opacity map: ink where the glyph is, nothing
 * anywhere else.
 */
function paintIcon(texture: DynamicTexture, paths: string[], color: string) {
	const ctx = texture.getContext() as CanvasRenderingContext2D;
	const { width, height } = texture.getSize();

	ctx.clearRect(0, 0, width, height);
	ctx.save();
	// The glyphs are drawn on a 24×24 grid with a little air around them.
	const pad = width * 0.12;
	const scale = (width - pad * 2) / 24;
	ctx.translate(pad, pad);
	ctx.scale(scale, scale);
	ctx.strokeStyle = color;
	ctx.lineWidth = 1.7;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	for (const d of paths) ctx.stroke(new Path2D(d));
	ctx.restore();

	texture.update();
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
