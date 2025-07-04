import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { R2Credentials } from './types';
import { R2BucketClient } from './r2Client';

const STORAGE_KEY = 'r2-credentials';

export const credentials = writable<R2Credentials | null>(null);
export const client = writable<R2BucketClient | null>(null);

export function loadCredentials() {
	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				credentials.set(parsed);
				client.set(new R2BucketClient(parsed));
			} catch (error) {
				console.error('Failed to parse stored credentials:', error);
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	}
}

export function saveCredentials(newCredentials: R2Credentials) {
	credentials.set(newCredentials);
	client.set(new R2BucketClient(newCredentials));
	
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newCredentials));
	}
}

export function clearCredentials() {
	credentials.set(null);
	client.set(null);
	
	if (browser) {
		localStorage.removeItem(STORAGE_KEY);
	}
}

// Load credentials on initialization
if (browser) {
	loadCredentials();
}
