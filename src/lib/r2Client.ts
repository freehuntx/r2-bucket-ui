import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { R2Credentials, FileItem } from './types';

export class R2BucketClient {
	private s3Client: S3Client;
	private credentials: R2Credentials;

	constructor(credentials: R2Credentials) {
		this.credentials = credentials;
		this.s3Client = new S3Client({
			region: credentials.region,
			credentials: {
				accessKeyId: credentials.accessKeyId,
				secretAccessKey: credentials.secretAccessKey,
			},
			endpoint: credentials.endpoint,
			forcePathStyle: true,
		});
	}

	async listObjects(prefix: string = ''): Promise<FileItem[]> {
		try {
			const command = new ListObjectsV2Command({
				Bucket: this.credentials.bucketName,
				Prefix: prefix,
				Delimiter: '/',
			});

			const response = await this.s3Client.send(command);
			const items: FileItem[] = [];

			// Add folders (common prefixes)
			if (response.CommonPrefixes) {
				for (const commonPrefix of response.CommonPrefixes) {
					if (commonPrefix.Prefix) {
						const folderName = commonPrefix.Prefix.slice(prefix.length).replace('/', '');
						if (folderName) {
							items.push({
								name: folderName,
								size: 0,
								lastModified: new Date(),
								isFolder: true,
							});
						}
					}
				}
			}

			// Add files
			if (response.Contents) {
				for (const object of response.Contents) {
					if (object.Key && object.Key !== prefix) {
						const fileName = object.Key.slice(prefix.length);
						if (fileName && !fileName.endsWith('/')) {
							items.push({
								name: fileName,
								size: object.Size || 0,
								lastModified: object.LastModified || new Date(),
								isFolder: false,
							});
						}
					}
				}
			}

			return items.sort((a, b) => {
				if (a.isFolder && !b.isFolder) return -1;
				if (!a.isFolder && b.isFolder) return 1;
				return a.name.localeCompare(b.name);
			});
		} catch (error) {
			console.error('Error listing objects:', error);
			throw error;
		}
	}

	async getDownloadUrl(key: string): Promise<string> {
		try {
			const command = new GetObjectCommand({
				Bucket: this.credentials.bucketName,
				Key: key,
			});

			return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
		} catch (error) {
			console.error('Error getting download URL:', error);
			throw error;
		}
	}

	async uploadFile(key: string, file: File): Promise<void> {
		try {
			// Convert File to ArrayBuffer for better compatibility
			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);

			const command = new PutObjectCommand({
				Bucket: this.credentials.bucketName,
				Key: key,
				Body: uint8Array,
				ContentType: file.type,
				ContentLength: file.size,
			});

			await this.s3Client.send(command);
		} catch (error) {
			console.error('Error uploading file:', error);
			throw error;
		}
	}

	async createFolder(folderPath: string): Promise<void> {
		try {
			// Ensure folder path ends with a slash
			const folderKey = folderPath.endsWith('/') ? folderPath : folderPath + '/';
			
			const command = new PutObjectCommand({
				Bucket: this.credentials.bucketName,
				Key: folderKey,
				Body: new Uint8Array(0), // Empty content
				ContentType: 'application/x-directory',
			});

			await this.s3Client.send(command);
		} catch (error) {
			console.error('Error creating folder:', error);
			throw error;
		}
	}

	async deleteFile(key: string): Promise<void> {
		try {
			const command = new DeleteObjectCommand({
				Bucket: this.credentials.bucketName,
				Key: key,
			});

			await this.s3Client.send(command);
		} catch (error) {
			console.error('Error deleting file:', error);
			throw error;
		}
	}

	async deleteFolder(folderPath: string): Promise<void> {
		try {
			// Ensure folder path ends with a slash
			const folderPrefix = folderPath.endsWith('/') ? folderPath : folderPath + '/';
			
			// First, list all objects with this prefix
			const listCommand = new ListObjectsV2Command({
				Bucket: this.credentials.bucketName,
				Prefix: folderPrefix,
			});

			const response = await this.s3Client.send(listCommand);
			
			if (response.Contents && response.Contents.length > 0) {
				// Delete all objects in batches (S3 has a limit of 1000 objects per batch)
				const deletePromises = response.Contents.map(object => {
					if (object.Key) {
						return this.deleteFile(object.Key);
					}
					return Promise.resolve();
				});

				await Promise.all(deletePromises);
			}

			// Also delete the folder marker itself if it exists
			try {
				await this.deleteFile(folderPrefix);
			} catch (error) {
				// Folder marker might not exist, which is fine
				console.debug('Folder marker not found, which is expected:', error);
			}
		} catch (error) {
			console.error('Error deleting folder:', error);
			throw error;
		}
	}

	async testConnection(): Promise<boolean> {
		try {
			await this.listObjects();
			return true;
		} catch (error) {
			console.error('Connection test failed:', error);
			return false;
		}
	}
}
