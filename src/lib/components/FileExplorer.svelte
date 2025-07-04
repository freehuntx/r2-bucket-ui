<script lang="ts">
	import type { FileItem } from '$lib/types';
	import { client, clearCredentials } from '$lib/stores';

	let currentPath = $state('');
	let files = $state<FileItem[]>([]);
	let loading = $state(false);
	let error = $state('');
	let uploading = $state(false);
	let selectedFiles = $state<FileList | null>(null);
	let currentClient = $state($client);
	let showCreateFolder = $state(false);
	let newFolderName = $state('');
	let showUploadModal = $state(false);
	let uploadPath = $state('');

	let fileInput: HTMLInputElement;

	// Subscribe to client changes
	$effect(() => {
		const unsubscribe = client.subscribe(value => {
			currentClient = value;
		});
		return unsubscribe;
	});

	async function loadFiles() {
		if (!currentClient) return;

		loading = true;
		error = '';

		try {
			files = await currentClient.listObjects(currentPath);
		} catch (err) {
			console.error('Failed to load files:', err);
			error = 'Failed to load files. Please check your connection.';
		} finally {
			loading = false;
		}
	}

	async function navigateToFolder(folderName: string) {
		currentPath = currentPath + folderName + '/';
		await loadFiles();
	}

	async function navigateUp() {
		const pathParts = currentPath.split('/').filter(Boolean);
		pathParts.pop();
		currentPath = pathParts.length > 0 ? pathParts.join('/') + '/' : '';
		await loadFiles();
	}

	async function downloadFile(file: FileItem) {
		if (!currentClient || file.isFolder) return;

		try {
			const url = await currentClient.getDownloadUrl(currentPath + file.name);
			const link = document.createElement('a');
			link.href = url;
			link.download = file.name;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (err) {
			console.error('Failed to download file:', err);
			alert('Failed to download file');
		}
	}

	async function deleteFile(file: FileItem) {
		if (!currentClient) return;

		const itemType = file.isFolder ? 'folder' : 'file';
		const confirmMessage = file.isFolder 
			? `Are you sure you want to delete the folder "${file.name}" and all its contents? This cannot be undone.`
			: `Are you sure you want to delete "${file.name}"?`;
		
		const confirmed = confirm(confirmMessage);
		if (!confirmed) return;

		try {
			if (file.isFolder) {
				await currentClient.deleteFolder(currentPath + file.name);
			} else {
				await currentClient.deleteFile(currentPath + file.name);
			}
			await loadFiles();
		} catch (err) {
			console.error(`Failed to delete ${itemType}:`, err);
			alert(`Failed to delete ${itemType}`);
		}
	}

	async function uploadFiles() {
		if (!currentClient || !selectedFiles || selectedFiles.length === 0) return;

		uploading = true;

		try {
			const targetPath = uploadPath || currentPath;
			for (let i = 0; i < selectedFiles.length; i++) {
				const file = selectedFiles[i];
				await currentClient.uploadFile(targetPath + file.name, file);
			}
			
			selectedFiles = null;
			uploadPath = '';
			fileInput.value = '';
			showUploadModal = false;
			await loadFiles();
		} catch (err) {
			console.error('Failed to upload files:', err);
			alert('Failed to upload files');
		} finally {
			uploading = false;
		}
	}

	async function createFolder() {
		if (!currentClient || !newFolderName.trim()) return;

		try {
			const folderPath = currentPath + newFolderName.trim();
			await currentClient.createFolder(folderPath);
			newFolderName = '';
			showCreateFolder = false;
			await loadFiles();
		} catch (err) {
			console.error('Failed to create folder:', err);
			alert('Failed to create folder');
		}
	}

	function openUploadModal() {
		uploadPath = currentPath;
		showUploadModal = true;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	}

	function getFileIcon(fileName: string): string {
		const ext = fileName.split('.').pop()?.toLowerCase();
		
		const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
		const videoExts = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
		const audioExts = ['mp3', 'wav', 'ogg', 'flac'];
		const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
		const codeExts = ['js', 'ts', 'html', 'css', 'json', 'py', 'java', 'cpp'];

		if (imageExts.includes(ext || '')) return '🖼️';
		if (videoExts.includes(ext || '')) return '🎥';
		if (audioExts.includes(ext || '')) return '🎵';
		if (docExts.includes(ext || '')) return '📄';
		if (codeExts.includes(ext || '')) return '💻';
		
		return '📄';
	}

	async function previewFile(file: FileItem) {
		if (!currentClient || file.isFolder) return;

		const ext = file.name.split('.').pop()?.toLowerCase();
		const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
		
		if (imageExts.includes(ext || '')) {
			try {
				const url = await currentClient.getDownloadUrl(currentPath + file.name);
				window.open(url, '_blank');
			} catch (err) {
				console.error('Failed to preview file:', err);
				alert('Failed to preview file');
			}
		} else {
			downloadFile(file);
		}
	}

	// Load files when client becomes available
	$effect(() => {
		if (currentClient) {
			loadFiles();
		}
	});
</script>

<div class="file-explorer">
	<header class="header">
		<div class="header-content">
			<h1>📁 R2 File Explorer</h1>
			<button onclick={() => clearCredentials()} class="logout-btn">
				Disconnect
			</button>
		</div>
	</header>

	<div class="content">
		<div class="toolbar">
			<div class="breadcrumb">
				<button onclick={navigateUp} disabled={!currentPath} class="nav-btn">
					← Back
				</button>
				<span class="path">
					/ {currentPath.replace(/\/$/, '').split('/').filter(Boolean).join(' / ')}
				</span>
			</div>

			<div class="upload-section">
				<button onclick={() => showCreateFolder = true} class="create-folder-btn">
					📁 New Folder
				</button>
				<button onclick={openUploadModal} class="upload-btn">
					📤 Upload Files
				</button>
			</div>
		</div>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		{#if loading}
			<div class="loading">Loading files...</div>
		{:else}
			<div class="file-grid">
				{#each files as file (file.name)}
					<div class="file-item" class:folder={file.isFolder}>
						<div 
							class="file-content" 
							class:clickable={file.isFolder}
							onclick={file.isFolder ? () => navigateToFolder(file.name) : undefined}
						>
							<div class="file-icon">
								{file.isFolder ? '📁' : getFileIcon(file.name)}
							</div>
							
							<div class="file-info">
								<div class="file-name" title={file.name}>
									{file.name}
								</div>
								{#if !file.isFolder}
									<div class="file-meta">
										{formatFileSize(file.size)} • {formatDate(file.lastModified)}
									</div>
								{/if}
							</div>
						</div>

						<div class="file-actions">
							{#if file.isFolder}
								<button onclick={() => deleteFile(file)} class="action-btn danger">
									🗑️ Delete
								</button>
							{:else}
								<button onclick={() => previewFile(file)} class="action-btn">
									👁️ Preview
								</button>
								<button onclick={() => downloadFile(file)} class="action-btn">
									📥 Download
								</button>
								<button onclick={() => deleteFile(file)} class="action-btn danger">
									🗑️ Delete
								</button>
							{/if}
						</div>
					</div>
				{/each}

				{#if files.length === 0 && !loading}
					<div class="empty-state">
						<div class="empty-icon">📂</div>
						<h3>This folder is empty</h3>
						<p>Upload some files to get started</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Create Folder Modal -->
{#if showCreateFolder}
	<div class="modal-overlay" onclick={() => showCreateFolder = false}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h3>Create New Folder</h3>
			<form onsubmit={(e) => { e.preventDefault(); createFolder(); }}>
				<input
					type="text"
					bind:value={newFolderName}
					placeholder="Folder name"
					class="folder-input"
					autofocus
				/>
				<div class="modal-actions">
					<button type="button" onclick={() => showCreateFolder = false} class="cancel-btn">
						Cancel
					</button>
					<button type="submit" disabled={!newFolderName.trim()} class="create-btn">
						Create
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Upload Modal -->
{#if showUploadModal}
	<div class="modal-overlay" onclick={() => showUploadModal = false}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h3>Upload Files</h3>
			<div class="upload-form">
				<div class="form-group">
					<label for="uploadPath">Upload to:</label>
					<input
						id="uploadPath"
						type="text"
						bind:value={uploadPath}
						placeholder="Enter folder path (leave empty for current folder)"
						class="path-input"
					/>
					<small class="help-text">
						Path should end with / for folders (e.g., "images/" or "docs/projects/")
					</small>
				</div>
				
				<div class="form-group">
					<input
						bind:this={fileInput}
						type="file"
						multiple
						onchange={(e) => selectedFiles = e.target.files}
						class="file-input"
					/>
				</div>

				{#if selectedFiles && selectedFiles.length > 0}
					<div class="selected-files">
						<p><strong>{selectedFiles.length} file(s) selected:</strong></p>
						<ul class="file-list">
							{#each Array.from(selectedFiles) as file}
								<li>{file.name} ({formatFileSize(file.size)})</li>
							{/each}
						</ul>
					</div>
				{/if}

				<div class="modal-actions">
					<button type="button" onclick={() => showUploadModal = false} class="cancel-btn">
						Cancel
					</button>
					<button 
						onclick={uploadFiles} 
						disabled={uploading || !selectedFiles || selectedFiles.length === 0} 
						class="upload-confirm-btn"
					>
						{uploading ? 'Uploading...' : 'Upload'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.file-explorer {
		min-height: 100vh;
		background: #f5f7fa;
	}

	.header {
		background: white;
		border-bottom: 1px solid #e0e0e0;
		padding: 1rem 0;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h1 {
		margin: 0;
		color: #333;
		font-size: 1.5rem;
	}

	.logout-btn {
		padding: 0.5rem 1rem;
		background: #e53e3e;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.logout-btn:hover {
		background: #c53030;
	}

	.content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-btn {
		padding: 0.5rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.nav-btn:hover:not(:disabled) {
		background: #5a67d8;
	}

	.nav-btn:disabled {
		background: #a0aec0;
		cursor: not-allowed;
	}

	.path {
		color: #666;
		font-family: monospace;
		font-size: 0.9rem;
	}

	.upload-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.upload-btn, .upload-confirm-btn {
		padding: 0.5rem 1rem;
		background: #48bb78;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.upload-btn:hover, .upload-confirm-btn:hover:not(:disabled) {
		background: #38a169;
	}

	.upload-confirm-btn:disabled {
		background: #a0aec0;
		cursor: not-allowed;
	}

	.create-folder-btn {
		padding: 0.5rem 1rem;
		background: #ed8936;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.create-folder-btn:hover {
		background: #dd6b20;
	}

	.selected-count {
		color: #666;
		font-size: 0.9rem;
	}

	.error {
		background: #fee;
		color: #c53030;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		border: 1px solid #fed7d7;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #666;
		font-size: 1.1rem;
	}

	.file-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.file-item {
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		transition: all 0.2s ease;
	}

	.file-item:hover {
		border-color: #667eea;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
	}

	.file-item.folder:hover {
		border-color: #ed8936;
		box-shadow: 0 2px 8px rgba(237, 137, 54, 0.1);
	}

	.file-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0; /* Allow content to shrink */
	}

	.file-content.clickable {
		cursor: pointer;
		border-radius: 6px;
		padding: 0.5rem;
		margin: -0.5rem;
		transition: background-color 0.2s ease;
	}

	.file-content.clickable:hover {
		background-color: #f7fafc;
	}

	.file-item.folder .file-content.clickable:hover {
		background-color: #fef5e7;
	}

	.file-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.file-info {
		flex: 1;
		min-width: 0;
	}

	.file-name {
		font-weight: 600;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-meta {
		font-size: 0.8rem;
		color: #666;
		margin-top: 0.25rem;
	}

	.file-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex-shrink: 0;
		min-width: 120px;
	}

	.action-btn {
		padding: 0.6rem 1rem;
		border: 1px solid #e0e0e0;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		transition: all 0.2s ease;
		text-align: center;
		white-space: nowrap;
	}

	.action-btn:hover {
		background: #f7fafc;
	}

	.action-btn.primary {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.action-btn.primary:hover {
		background: #5a67d8;
	}

	.action-btn.danger {
		color: #e53e3e;
		border-color: #e53e3e;
	}

	.action-btn.danger:hover {
		background: #fee;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.content {
			padding: 1rem;
		}

		.toolbar {
			flex-direction: column;
			align-items: stretch;
		}

		.file-grid {
			grid-template-columns: 1fr;
		}

		.file-item {
			flex-direction: column;
			align-items: stretch;
		}

		.file-content {
			flex-direction: row;
			justify-content: flex-start;
		}

		.file-actions {
			align-self: stretch;
			min-width: auto;
		}

		.action-btn {
			width: 100%;
		}
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	}

	.modal h3 {
		margin: 0 0 1.5rem 0;
		color: #333;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	.folder-input, .path-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.folder-input:focus, .path-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.file-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px dashed #e0e0e0;
		border-radius: 6px;
		background: #f9f9f9;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.file-input:hover {
		border-color: #667eea;
		background: #f0f4ff;
	}

	.help-text {
		color: #666;
		font-size: 0.8rem;
		margin-top: 0.25rem;
		font-style: italic;
	}

	.selected-files {
		background: #f0f4ff;
		border: 1px solid #e0e6ff;
		border-radius: 6px;
		padding: 1rem;
		margin: 1rem 0;
	}

	.selected-files p {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.file-list {
		margin: 0;
		padding-left: 1.5rem;
		color: #666;
		font-size: 0.9rem;
	}

	.file-list li {
		margin-bottom: 0.25rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background: #e2e8f0;
		color: #4a5568;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.cancel-btn:hover {
		background: #cbd5e0;
	}

	.create-btn {
		padding: 0.75rem 1.5rem;
		background: #ed8936;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.create-btn:hover:not(:disabled) {
		background: #dd6b20;
	}

	.create-btn:disabled {
		background: #a0aec0;
		cursor: not-allowed;
	}
</style>
