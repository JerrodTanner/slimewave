import { ui } from '$lib/state/ui.svelte';
import { stage } from './stage.svelte';

/**
 * The hub's front door.
 *
 * The corridor is not handed the pointer the moment someone lands on the
 * site. Until the gate is opened the screen carries an opaque cover and the
 * stage stays out of immersive mode, so nothing grabs the cursor, nothing
 * runs at full frame rate, and the first thing a visitor sees is the mark
 * rather than a camera they did not ask to be behind.
 *
 * Opening has to happen inside the click that asked for it: pointer lock is
 * only granted during a real gesture, and `stage.requestPointerLock()` is a
 * no-op unless the stage is already immersive. Hence the explicit setMode
 * here rather than waiting for the effect in GameStage to catch up.
 */
class HubGateState {
	open = $state(false);

	enter() {
		if (this.open) return;
		// Simple mode is the site without the game. The corridor stays a
		// backdrop, so there is no way in and nothing takes the pointer.
		if (ui.mode !== 'advanced') return;
		this.open = true;
		stage.setMode('immersive');
		stage.requestPointerLock();
	}

	/** Back to standby: the cover returns and the scene stops being driven. */
	stand() {
		if (!this.open) return;
		this.open = false;
		stage.exitPointerLock();
	}
}

export const hubGate = new HubGateState();
