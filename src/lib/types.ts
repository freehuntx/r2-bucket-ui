export interface R2Credentials {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	endpoint: string;
	bucketName: string;
}

export interface S3Object {
	Key: string;
	LastModified?: Date;
	Size?: number;
	ETag?: string;
}

export interface FileItem {
	name: string;
	size: number;
	lastModified: Date;
	isFolder: boolean;
	url?: string;
}
