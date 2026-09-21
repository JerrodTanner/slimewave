<script lang="ts">
	/**
	 * The hub.
	 *
	 * There is nothing here on purpose. The frame — the heading rule, the
	 * window and the rail of doors — is mounted by the root layout rather than
	 * by this page, because it has to survive the walk through a door: on the
	 * hub the corridor has the big window, and behind a door it moves into that
	 * door's tile while the section's page takes the window. A frame owned by
	 * this route would be torn down and rebuilt in the middle of that swap.
	 *
	 * See lib/components/HubFrame.svelte for the furniture and
	 * lib/game/crt.svelte.ts for the switch-off that hides the swap.
	 */
</script>

<svelte:head>
	<title>Jerrod Tanner — slimewave</title>
</svelte:head>
