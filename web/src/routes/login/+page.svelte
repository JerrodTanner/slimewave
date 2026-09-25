<script lang="ts">
	import { goto } from '$app/navigation';
	import PageShell from '$lib/components/PageShell.svelte';
	import { session } from '$lib/state/session.svelte';

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		const ok = await session.login(email, password);
		submitting = false;
		if (ok) await goto(session.isOwner ? '/admin' : '/');
	}
</script>

<svelte:head>
	<title>Sign in — ShineWave</title>
</svelte:head>

<PageShell
	title="Sign in"
	lede="Signing in is how I manage what is published here. An account also carries your theme between devices — that is the whole of it."
>
	{#if session.signedIn}
		<div class="panel max-w-md px-5 py-5">
			<p class="text-sm">
				Signed in as <span class="font-mono" style:color="var(--color-accent)"
					>{session.user?.displayName}</span
				>.
			</p>
			<div class="mt-4 flex gap-2">
				{#if session.isOwner}
					<a class="btn-accent" href="/admin">go to admin</a>
				{/if}
				<button class="btn-ghost" type="button" onclick={() => session.logout()}>sign out</button>
			</div>
		</div>
	{:else}
		<form class="panel max-w-md space-y-4 px-5 py-5" onsubmit={submit}>
			<div>
				<label class="label mb-1.5 block" for="email">email</label>
				<input
					id="email"
					class="field"
					type="email"
					bind:value={email}
					autocomplete="username"
					required
				/>
			</div>

			<div>
				<label class="label mb-1.5 block" for="password">password</label>
				<input
					id="password"
					class="field"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					required
				/>
			</div>

			{#if session.error}
				<p class="font-mono text-xs" style:color="var(--color-warn)" role="alert">
					{session.error}
				</p>
			{/if}

			<button class="btn-accent w-full" type="submit" disabled={submitting}>
				{submitting ? 'checking…' : 'sign in'}
			</button>

			{#if !session.registrationOpen}
				<p class="label leading-snug">
					Accounts are closed on this site. Nothing here is gated behind one.
				</p>
			{/if}
		</form>
	{/if}
</PageShell>
