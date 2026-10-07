<script lang="ts">
	import { RESUME_SUMMARY } from '$lib/content/resume';

	/**
	 * The door the Bold header calls "About me": who a visitor would be
	 * working with. A portrait and the summary from the top of the resume,
	 * word for word, in the Bold page's own type, on the same frosted card
	 * as the contact panel. It lives behind its own door rather than on the
	 * front page, which stays about the work.
	 */
</script>

<svelte:head>
	<title>About me — ShineWave</title>
</svelte:head>

<div class="page">
	<p class="eyebrow">About me</p>
	<h1>Jerrod Tanner</h1>
	<p class="role">The person behind ShineWave · Fort Lauderdale, Florida</p>

	<div class="card">
		<img class="photo" src="/about/jerrod.jpg" alt="Jerrod Tanner" width="240" height="320" />
		<div class="words">
			<p class="summary">{RESUME_SUMMARY}</p>
			<nav class="next" aria-label="Next steps">
				<a class="pill pill-bold" href="/resume">Read my resume →</a>
				<a class="pill" href="/plan">Plan a Project</a>
			</nav>
		</div>
	</div>
</div>

<style>
	.page {
		display: grid;
		gap: 0.75rem;
		max-width: 960px;
		margin: 0 auto;
		padding: clamp(32px, 6vw, 72px) clamp(16px, 4vw, 40px) clamp(48px, 8vw, 96px);
	}

	.eyebrow {
		margin: 0;
		font: 600 0.75rem var(--font-mono);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	h1 {
		margin: 0;
		font: 900 clamp(2.5rem, 7vw, 5rem) / 0.95 var(--font-display);
		letter-spacing: var(--tracking-display);
	}

	.role {
		margin: 0 0 1rem;
		font-size: clamp(1rem, 1.6vw, 1.2rem);
		color: var(--color-muted);
	}

	/* The same frosted sheet as the contact panel on the front page. */
	.card {
		display: grid;
		grid-template-columns: 1fr;
		justify-items: center;
		gap: clamp(20px, 3vw, 36px);
		padding: clamp(20px, 4vw, 40px);
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
	}

	/* Side by side once there is room: the portrait, then the words. */
	@media (min-width: 720px) {
		.card {
			grid-template-columns: auto minmax(0, 1fr);
			align-items: center;
			justify-items: start;
		}
	}

	.photo {
		width: 240px;
		max-width: 100%;
		height: auto;
		aspect-ratio: 3 / 4;
		border: 4px solid var(--color-surface);
		border-radius: 20px;
		object-fit: cover;
		box-shadow: 0 10px 28px rgb(0 0 0 / 0.12);
	}

	.words {
		display: grid;
		gap: 1.25rem;
	}

	.summary {
		margin: 0;
		max-width: 60ch;
		font-size: clamp(1.05rem, 1.4vw, 1.2rem);
		line-height: 1.6;
		color: var(--color-ink);
	}

	.next {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	/* The front page's contact pills. */
	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 3rem;
		padding: 0 1.25rem;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		font-weight: 700;
		white-space: nowrap;
		color: var(--color-ink);
		background-color: var(--color-surface);
	}

	.pill:hover {
		border-color: var(--color-ink);
	}

	.pill-bold {
		border-color: transparent;
		background-color: var(--color-accent);
		color: var(--color-accent-ink);
	}

	.pill-bold:hover {
		border-color: transparent;
		filter: brightness(1.1);
	}
</style>
