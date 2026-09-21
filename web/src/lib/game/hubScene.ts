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
import { PORTALS, type PortalSpec } from './portals';

export { PORTALS };
export type { PortalSpec };

const RING_RADIUS = 19;
const PORTAL_TRIGGER_DISTANCE = 2.4;
const EYE_HEIGHT = 1.75;
/**
 * Portals sit on an arc in front of the spawn point rather than a full ring.
 * A ring looks tidier on paper, but it puts most of the site's navigation
 * behind your head on arrival; an arc this wide fits all of them on screen at
 * the starting camera angle and still takes a look around to read the ends.
 */
const ARC_HALF_SPAN = (44 * Math.PI) / 180;
/** Wide enough to hold the whole arc; narrow enough not to fish-eye. */
const CAMERA_FOV = 1.05;
const SPAWN_Z = -9;

interface Portal {
	spec: PortalSpec;
	root: Mesh;
	ring: Mesh;
	surface: Mesh;
	light: PointLight;
	ringMaterial: StandardMaterial;
	surfaceMaterial: StandardMaterial;
	position: Vector3;
	/** Accent colour index, alternating across the arc. */
	alt: boolean;
}

export function createHubScene(ctx: SceneContext): SceneHandle {
	const { scene, canvas, palette, navigate } = ctx;
	const engine = scene.getEngine();

	scene.collisionsEnabled = true;
	scene.gravity = new Vector3(0, -0.6, 0);
	scene.fogMode = Scene.FOGMODE_EXP2;
	scene.fogDensity = 0.022;

	const camera = new FreeCamera('hub-camera', new Vector3(0, EYE_HEIGHT, SPAWN_Z), scene);
	camera.setTarget(new Vector3(0, EYE_HEIGHT, 0));
	camera.fov = CAMERA_FOV;
	camera.minZ = 0.1;
	camera.speed = 0.55;
	camera.angularSensibility = 2600;
	camera.inertia = 0.82;
	camera.checkCollisions = true;
	camera.applyGravity = true;
	camera.ellipsoid = new Vector3(0.6, EYE_HEIGHT / 2, 0.6);
	// WASD in addition to the arrow keys Babylon binds by default.
	camera.keysUp = [87, 38];
	camera.keysDown = [83, 40];
	camera.keysLeft = [65, 37];
	camera.keysRight = [68, 39];

	const ambient = new HemisphericLight('hub-ambient', new Vector3(0, 1, 0), scene);
	ambient.intensity = 0.45;

	const glow = new GlowLayer('hub-glow', scene, { blurKernelSize: 48 });
	glow.intensity = 0.7;

	// --- ground ---
	const ground = MeshBuilder.CreateGround('hub-ground', { width: 140, height: 140 }, scene);
	ground.checkCollisions = true;
	const groundMaterial = new StandardMaterial('hub-ground-mat', scene);
	groundMaterial.specularColor = Color3.Black();
	ground.material = groundMaterial;

	const gridTexture = new DynamicTexture('hub-grid', { width: 512, height: 512 }, scene, true);
	gridTexture.wrapU = Texture.WRAP_ADDRESSMODE;
	gridTexture.wrapV = Texture.WRAP_ADDRESSMODE;
	gridTexture.uScale = 28;
	gridTexture.vScale = 28;
	groundMaterial.diffuseTexture = gridTexture;

	// An invisible wall keeps the camera inside the arena without the player
	// ever seeing a boundary.
	const wall = MeshBuilder.CreateCylinder(
		'hub-bounds',
		{ diameter: RING_RADIUS * 2 + 16, height: 30, sideOrientation: 1 },
		scene
	);
	wall.checkCollisions = true;
	wall.isVisible = false;
	wall.position.y = 15;

	// --- portals ---
	const portals: Portal[] = PORTALS.map((spec, i) => {
		// Angle measured from straight ahead (+z), spread evenly across the arc.
		const t = PORTALS.length === 1 ? 0 : i / (PORTALS.length - 1) - 0.5;
		const angle = t * 2 * ARC_HALF_SPAN;
		const position = new Vector3(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS);

		const root = MeshBuilder.CreateBox(`portal-${i}-root`, { size: 0.01 }, scene);
		root.isVisible = false;
		root.position = position.clone();
		// Turn each portal to face the spawn point.
		root.rotation.y = angle;

		const ringMaterial = new StandardMaterial(`portal-${i}-ring-mat`, scene);
		makeEmissiveOnly(ringMaterial);
		const ring = MeshBuilder.CreateTorus(
			`portal-${i}-ring`,
			{ diameter: 4.4, thickness: 0.22, tessellation: 48 },
			scene
		);
		ring.material = ringMaterial;
		ring.parent = root;
		ring.position.y = 2.4;
		ring.rotation.x = Math.PI / 2;

		const surfaceMaterial = new StandardMaterial(`portal-${i}-surface-mat`, scene);
		makeEmissiveOnly(surfaceMaterial);
		surfaceMaterial.alpha = 0.55;
		surfaceMaterial.backFaceCulling = false;
		const surface = MeshBuilder.CreateDisc(`portal-${i}-surface`, { radius: 2.1 }, scene);
		surface.material = surfaceMaterial;
		surface.parent = root;
		surface.position.y = 2.4;

		const light = new PointLight(`portal-${i}-light`, position.add(new Vector3(0, 2.4, 0)), scene);
		light.intensity = 0.55;
		light.range = 16;

		return {
			spec,
			root,
			ring,
			surface,
			light,
			ringMaterial,
			surfaceMaterial,
			position,
			alt: i % 2 === 1
		};
	});

	// --- a few slow-bobbing blobs, so the arena is not just geometry ---
	const blobMaterial = new StandardMaterial('hub-blob-mat', scene);
	makeEmissiveOnly(blobMaterial);
	blobMaterial.alpha = 0.75;
	const blobs = Array.from({ length: 10 }, (_, i) => {
		const blob = MeshBuilder.CreateSphere(`hub-blob-${i}`, { diameter: 0.34, segments: 8 }, scene);
		blob.material = blobMaterial;
		// Kept high and wide so they read as atmosphere rather than cluttering
		// the sight line between the spawn point and the portals.
		const angle = (i / 10) * Math.PI * 2;
		const radius = 9 + (i % 4) * 3.5;
		blob.position = new Vector3(
			Math.cos(angle) * radius,
			4.5 + (i % 4) * 1.4,
			Math.sin(angle) * radius
		);
		return { mesh: blob, phase: i * 0.7, baseY: blob.position.y };
	});

	// --- state ---
	let interactive = false;
	let navigating = false;
	let elapsed = 0;
	// Ambient mode pans across the arc instead of leaving the camera wherever
	// the visitor abandoned it.
	let ambientAngle = 0;

	function applyPalette(p: ScenePalette) {
		const sky = hexColor(p.sky);
		const ground3 = hexColor(p.ground);
		const portalColor = hexColor(p.portal);
		const portalAlt = hexColor(p.portalAlt);

		scene.clearColor = new Color4(sky.r, sky.g, sky.b, 1);
		scene.fogColor = hexColor(p.fog);
		ambient.diffuse = hexColor(p.light);
		ambient.groundColor = ground3.scale(0.6);

		groundMaterial.diffuseColor = Color3.White();
		groundMaterial.emissiveColor = ground3.scale(0.25);
		paintGrid(gridTexture, normalizeHex(p.ground), normalizeHex(p.grid));

		blobMaterial.emissiveColor = portalAlt.scale(0.45);

		for (const portal of portals) {
			const color = portal.alt ? portalAlt : portalColor;
			portal.ringMaterial.emissiveColor = color;
			portal.surfaceMaterial.emissiveColor = color.scale(0.55);
			portal.light.diffuse = color;
		}
	}

	function setInteractive(next: boolean) {
		if (next === interactive) return;
		interactive = next;
		if (next) {
			camera.attachControl(canvas, true);
			// Always start facing the arc, wherever the ambient drift left off.
			camera.position.set(0, EYE_HEIGHT, SPAWN_Z);
			camera.setTarget(new Vector3(0, EYE_HEIGHT, 0));
		} else {
			camera.detachControl();
			hubMarkers.clear();
		}
		navigating = false;
	}

	// Clicking a portal works everywhere, and is the only way in on a
	// touchscreen, where there is no pointer lock and no keyboard.
	const pointerObserver = scene.onPointerObservable.add((info) => {
		if (info.type !== PointerEventTypes.POINTERPICK || !interactive || navigating) return;
		const picked = info.pickInfo?.pickedMesh;
		if (!picked) return;
		const portal = portals.find((p) => picked === p.ring || picked === p.surface);
		if (portal) {
			navigating = true;
			navigate(portal.spec.href);
		}
	});

	/** Projects each portal to canvas-relative coordinates for the HTML labels. */
	function publishMarkers() {
		const width = engine.getRenderWidth();
		const height = engine.getRenderHeight();
		if (width === 0 || height === 0) return;

		const transform = scene.getTransformMatrix();
		const viewport = camera.viewport.toGlobal(width, height);
		const forward = camera.getForwardRay().direction;

		const next: PortalMarker[] = portals.map((portal) => {
			// The label sits above the ring, not at its centre.
			const anchor = portal.position.add(new Vector3(0, 5.1, 0));
			const projected = Vector3.Project(anchor, Matrix.Identity(), transform, viewport);
			const toPortal = anchor.subtract(camera.position);
			const distance = toPortal.length();
			const ahead = Vector3.Dot(toPortal.normalize(), forward) > 0.15;

			const x = projected.x / width;
			const y = projected.y / height;
			return {
				...portal.spec,
				x,
				y,
				distance,
				// A generous margin: a label half off screen is still a useful cue.
				visible: ahead && x > -0.15 && x < 1.15 && y > -0.15 && y < 1.15
			};
		});
		hubMarkers.set(next);
	}

	function update(deltaMs: number) {
		const dt = Math.min(deltaMs, 100) / 1000;
		elapsed += dt;

		for (const portal of portals) {
			portal.ring.rotation.z += dt * 0.35;
			portal.surface.scaling.x = 1 + Math.sin(elapsed * 1.4 + portal.position.x) * 0.03;
			portal.surface.scaling.y = 1 + Math.cos(elapsed * 1.1 + portal.position.z) * 0.03;
			portal.light.intensity = 0.45 + Math.sin(elapsed * 2 + portal.position.x) * 0.12;
		}

		for (const blob of blobs) {
			blob.mesh.position.y = blob.baseY + Math.sin(elapsed * 0.8 + blob.phase) * 0.4;
			blob.mesh.rotation.y += dt * 0.3;
		}

		if (!interactive) {
			// Ambient drift: a slow pan across the arc, never turning away from
			// it, so the backdrop behind a page always shows something.
			ambientAngle += dt * 0.12;
			camera.position.set(
				Math.sin(ambientAngle) * 8,
				EYE_HEIGHT + 1 + Math.sin(elapsed * 0.3) * 0.3,
				SPAWN_Z + Math.cos(ambientAngle * 0.7) * 2.5
			);
			camera.setTarget(new Vector3(Math.sin(ambientAngle) * 4, EYE_HEIGHT + 1.6, RING_RADIUS));
			return;
		}

		publishMarkers();

		if (navigating) return;
		for (const portal of portals) {
			const dx = camera.position.x - portal.position.x;
			const dz = camera.position.z - portal.position.z;
			if (Math.hypot(dx, dz) < PORTAL_TRIGGER_DISTANCE) {
				navigating = true;
				navigate(portal.spec.href);
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

function paintGrid(texture: DynamicTexture, background: string, line: string) {
	const ctx = texture.getContext() as CanvasRenderingContext2D;
	const size = texture.getSize();
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, size.width, size.height);

	ctx.strokeStyle = line;
	ctx.lineWidth = 4;
	ctx.strokeRect(0, 0, size.width, size.height);

	// One lighter subdivision, so the floor reads at both near and far distance.
	ctx.lineWidth = 1;
	ctx.globalAlpha = 0.4;
	ctx.beginPath();
	ctx.moveTo(size.width / 2, 0);
	ctx.lineTo(size.width / 2, size.height);
	ctx.moveTo(0, size.height / 2);
	ctx.lineTo(size.width, size.height / 2);
	ctx.stroke();
	ctx.globalAlpha = 1;

	texture.update();
}
