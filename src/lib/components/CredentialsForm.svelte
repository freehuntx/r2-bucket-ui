<script lang="ts">
	import type { R2Credentials } from '$lib/types';
	import { saveCredentials } from '$lib/stores';

	let formData = $state({
		accessKeyId: '',
		secretAccessKey: '',
		region: 'auto',
		endpoint: '',
		bucketName: ''
	});

	let loading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			const credentials: R2Credentials = {
				accessKeyId: formData.accessKeyId.trim(),
				secretAccessKey: formData.secretAccessKey.trim(),
				region: formData.region.trim(),
				endpoint: formData.endpoint.trim(),
				bucketName: formData.bucketName.trim()
			};

			// Validate required fields
			if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.endpoint || !credentials.bucketName) {
				error = 'All fields are required';
				return;
			}

			// Test connection
			const testClient = new (await import('$lib/r2Client')).R2BucketClient(credentials);
			const isValid = await testClient.testConnection();

			if (!isValid) {
				error = 'Failed to connect to R2 bucket. Please check your credentials.';
				return;
			}

			// Save credentials
			saveCredentials(credentials);
		} catch (err) {
			console.error('Connection test failed:', err);
			error = 'Failed to connect to R2 bucket. Please check your credentials and network connection.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="credentials-form">
	<div class="form-container">
		<h1>R2 Bucket File Explorer</h1>
		<p class="subtitle">Enter your Cloudflare R2 credentials to get started</p>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-group">
				<label for="accessKeyId">Access Key ID</label>
				<input
					id="accessKeyId"
					type="text"
					bind:value={formData.accessKeyId}
					placeholder="Your R2 Access Key ID"
					required
				/>
			</div>

			<div class="form-group">
				<label for="secretAccessKey">Secret Access Key</label>
				<input
					id="secretAccessKey"
					type="password"
					bind:value={formData.secretAccessKey}
					placeholder="Your R2 Secret Access Key"
					required
				/>
			</div>

			<div class="form-group">
				<label for="region">Region</label>
				<input
					id="region"
					type="text"
					bind:value={formData.region}
					placeholder="auto"
					required
				/>
			</div>

			<div class="form-group">
				<label for="endpoint">Endpoint URL</label>
				<input
					id="endpoint"
					type="url"
					bind:value={formData.endpoint}
					placeholder="https://your-account-id.r2.cloudflarestorage.com"
					required
				/>
			</div>

			<div class="form-group">
				<label for="bucketName">Bucket Name</label>
				<input
					id="bucketName"
					type="text"
					bind:value={formData.bucketName}
					placeholder="your-bucket-name"
					required
				/>
			</div>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<button type="submit" disabled={loading} class="submit-btn">
				{loading ? 'Testing Connection...' : 'Connect to R2 Bucket'}
			</button>
		</form>

		<div class="help-text">
			<h3>Where to find these values:</h3>
			<ul>
				<li><strong>Access Key ID & Secret:</strong> Cloudflare Dashboard → R2 → Manage R2 API Tokens</li>
				<li><strong>Endpoint:</strong> Your account-specific R2 endpoint URL</li>
				<li><strong>Bucket Name:</strong> The name of your R2 bucket</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.credentials-form {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
	}

	.form-container {
		background: white;
		border-radius: 16px;
		padding: 3rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		max-width: 500px;
		width: 100%;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		color: #333;
		text-align: center;
		font-size: 2rem;
		font-weight: 700;
	}

	.subtitle {
		text-align: center;
		color: #666;
		margin-bottom: 2rem;
		font-size: 1.1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.error {
		background: #fee;
		color: #c53030;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		border: 1px solid #fed7d7;
		font-size: 0.9rem;
	}

	.help-text {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e0e0e0;
	}

	.help-text h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1rem;
	}

	.help-text ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #666;
		font-size: 0.9rem;
	}

	.help-text li {
		margin-bottom: 0.5rem;
	}

	@media (max-width: 640px) {
		.credentials-form {
			padding: 1rem;
		}

		.form-container {
			padding: 2rem;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
