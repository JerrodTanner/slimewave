<script lang="ts">
	import SettingsMenu from './SettingsMenu.svelte';
	import SineMark from './SineMark.svelte';
	import SiteMission from './SiteMission.svelte';

	/**
	 * The header on the flat pages — the ones that do not render inside the
	 * hub frame.
	 *
	 * It is the same card the frame wears, and deliberately so: the name, the
	 * cog, the sentence saying what the place is for, and the mark. No link
	 * row. The doors are the navigation, and a second list of them along the
	 * top only competed with the corridor for the job.
	 */
</script>

<header class="sticky top-0 z-20 px-4 pt-4 sm:px-6">
	<div class="head mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3">
		<a href="/" class="wordmark">ShineWave</a>

		<SettingsMenu />

		<span class="divider" aria-hidden="true"></span>

		<SiteMission />

		<span class="flex-1"></span>

		<SineMark width={92} />
	</div>
</header>

<style>
	.head {
		min-height: 72px;
		padding: 0.9rem 1.1rem;
		border: 1px solid var(--color-line);
		border-radius: calc(var(--radius-panel) + 4px);
		background-color: var(--color-surface-raised);
	}

	/* The name as the cover sets it, at a size the header can hold. */
	.wordmark {
		flex-shrink: 0;
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.015em;
		color: var(--color-accent);
	}

	/* Separates the mark and its cog from the sentence. It goes once the row
	   wraps, where the line break already does that job. */
	.divider {
		flex-shrink: 0;
		width: 1px;
		height: 26px;
		background-color: var(--color-line);
	}

	@media (max-width: 40rem) {
		.divider {
			display: none;
		}
	}
</style>
