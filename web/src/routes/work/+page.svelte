<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import { PROJECTS } from '$lib/content/projects';
</script>

<svelte:head>
	<title>Work — slimewave</title>
</svelte:head>

<PageShell
	title="Work"
	lede="Things I built end to end, and what each one actually taught me. Stack choices are listed because they were choices."
>
	<ul class="space-y-px">
		{#each PROJECTS as project (project.name)}
			<li class="panel px-4 py-5 sm:px-6 sm:py-6">
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<h2 class="text-2xl">{project.name}</h2>
					{#if project.featured}
						<span
							class="font-mono text-[10px]"
							style:color="var(--color-accent)"
							style:border="1px solid var(--color-accent)"
							style:padding="1px 5px">featured</span
						>
					{/if}
					<span class="text-muted ml-auto font-mono text-xs">{project.year}</span>
				</div>

				<p class="label mt-1">{project.role}</p>
				<p class="prose-slim mt-3 text-sm">{project.summary}</p>

				<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
					<ul class="flex flex-wrap gap-1.5">
						{#each project.stack as tech (tech)}
							<li
								class="text-muted font-mono text-[11px]"
								style:border="1px solid var(--color-line)"
								style:padding="2px 6px"
							>
								{tech}
							</li>
						{/each}
					</ul>
					{#each project.links as link (link.href)}
						<a
							href={link.href}
							class="font-mono text-xs underline underline-offset-4"
							style:color="var(--color-accent)"
							rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
							target={link.href.startsWith('http') ? '_blank' : undefined}
						>
							{link.label} →
						</a>
					{/each}
				</div>
			</li>
		{/each}
	</ul>
</PageShell>
