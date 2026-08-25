/**
 * Types for Cloud Storage Integration
 */

export type CloudPlatform = 'google_drive' | 'onedrive' | 'icloud';

export interface CloudFile {
  id: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: Date;
  modifiedAt: Date;
  lastAccessed?: Date;
  ownerEmail?: string;
  folderPath?: string;
  fileUrl?: string;
  storageUsageMb?: number;
  accessCount?: number;
  tags?: string[];
  status: 'active' | 'inactive' | 'deleted';
  syncStatus: 'pending' | 'syncing' | 'success' | 'error';
  lastSync?: Date;
  metadata?: Record<string, any>;
}

export interface CloudStorageConfig {
  platform: CloudPlatform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId: string;
}

export interface CloudStorageService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listFiles(folderPath?: string): Promise<CloudFile[]>;
  getFile(fileId: string): Promise<CloudFile>;
  watchForChanges(callback: (changes: CloudFile[]) => void): void;
  stopWatching(): void;
  getStorageUsage(): Promise<{ used: number; total: number }>;
  getPlatformInfo(): { name: string; icon: string };
}

export interface CloudStorageIntegration {
  platform: CloudPlatform;
  isConnected: boolean;
  lastSync?: Date;
  storageUsage?: { used: number; total: number };
  filesCount?: number;
  error?: string;
}