<script lang="ts">
	import { onMount } from 'svelte';
	import { credentials, loadCredentials } from '$lib/stores';
	import CredentialsForm from '$lib/components/CredentialsForm.svelte';
	import FileExplorer from '$lib/components/FileExplorer.svelte';

	let mounted = $state(false);
	let currentCredentials = $state($credentials);

	onMount(() => {
		loadCredentials();
		mounted = true;
	});

	// Subscribe to credentials changes
	$effect(() => {
		const unsubscribe = credentials.subscribe(value => {
			currentCredentials = value;
		});
		return unsubscribe;
	});
</script>

<svelte:head>
	<title>R2 Bucket File Explorer</title>
	<meta name="description" content="A simple file explorer for Cloudflare R2 buckets" />
</svelte:head>

{#if mounted}
	{#if currentCredentials}
		<FileExplorer />
	{:else}
		<CredentialsForm />
	{/if}
{:else}
	<div class="loading-screen">
		<div class="loader"></div>
		<p>Loading...</p>
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
			'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
		line-height: 1.6;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.loading-screen {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f5f7fa;
		color: #666;
	}

	.loader {
		width: 40px;
		height: 40px;
		border: 4px solid #e0e0e0;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
