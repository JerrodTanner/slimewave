/**
 * Which work sample the window has been asked to scroll to.
 *
 * The pitch tile and the window are siblings under HubFrame with no reason to
 * know about each other, so a proof point asks by key and the panel answers.
 * It is a request rather than a selection: the panel clears it as soon as it
 * has moved, so asking for the same sample twice scrolls to it twice.
 *
 * The key is a time saver's `name` in lib/content/jobs: the tile's rows ask
 * by it, and WorkPanel keys each sample by it. A row whose job has no sample
 * simply does nothing.
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
