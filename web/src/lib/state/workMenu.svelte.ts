/**
 * Which work sample the window has been asked to scroll to.
 *
 * The pitch tile and the window are siblings under HubFrame with no reason to
 * know about each other, so a proof point asks by key and the panel answers.
 * It is a request rather than a selection: the panel clears it as soon as it
 * has moved, so asking for the same sample twice scrolls to it twice.
 *
 * The key is the sample's `key` in the WORK list in WorkPanel.svelte, and a
 * proof point names it in the `sample` field of INDUSTRIES in
 * IndustriesTile.svelte. A row naming a sample that is not there yet simply
 * does nothing, which is what lets the two lists be filled in either order.
 */
class WorkMenuState {
	request = $state<string | null>(null);

	show(key: string) {
		this.request = key;
	}

	clear() {
		this.request = null;
	}
}

export const workMenu = new WorkMenuState();
