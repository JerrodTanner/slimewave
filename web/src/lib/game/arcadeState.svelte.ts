/**
 * Shared state between an arcade scene and the HUD that renders over it.
 *
 * The scene writes, the Svelte components read. Keeping it here rather than
 * passing callbacks into the scene means the HUD can mount and unmount freely
 * while the scene keeps running.
 */
class ArcadeState {
	score = $state(0);
	best = $state(0);
	timeLeft = $state(0);
	running = $state(false);
	/** Set when a run ends, so the HUD can show the result. */
	lastResult = $state<{ score: number; best: boolean } | null>(null);

	#bestKey = '';

	configure(gameId: string) {
		this.#bestKey = `slimewave:best:${gameId}`;
		try {
			const stored = Number(localStorage.getItem(this.#bestKey));
			if (Number.isFinite(stored)) this.best = stored;
		} catch {
			/* storage blocked */
		}
	}

	begin(durationSeconds: number) {
		this.score = 0;
		this.timeLeft = durationSeconds;
		this.running = true;
		this.lastResult = null;
	}

	end() {
		this.running = false;
		const isBest = this.score > this.best;
		if (isBest) {
			this.best = this.score;
			try {
				localStorage.setItem(this.#bestKey, String(this.best));
			} catch {
				/* storage blocked */
			}
		}
		this.lastResult = { score: this.score, best: isBest };
	}

	reset() {
		this.score = 0;
		this.timeLeft = 0;
		this.running = false;
		this.lastResult = null;
	}
}

export const arcade = new ArcadeState();
