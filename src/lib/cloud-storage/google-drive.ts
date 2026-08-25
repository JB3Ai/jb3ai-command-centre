/**
 * Google Drive Cloud Storage Integration
 */

import { CloudStorageService, CloudFile, CloudStorageConfig } from './types';

export class GoogleDriveService implements CloudStorageService {
  private config: CloudStorageConfig;
  private accessToken: string;
  private baseUrl = 'https://www.googleapis.com/drive/v3';
  private watching: boolean = false;
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(config: CloudStorageConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
  }

  async connect(): Promise<void> {
    // Validate token and test connection
    try {
      const response = await fetch(`${this.baseUrl}/about?fields=user`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Google Drive connection failed: ${response.status}`);
      }

      // Connection successful
      console.log('Connected to Google Drive');
    } catch (error) {
      console.error('Google Drive connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Clean up any ongoing operations
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    this.watching = false;
    console.log('Disconnected from Google Drive');
  }

  async listFiles(folderPath?: string): Promise<CloudFile[]> {
    try {
      let query = 'trashed=false';
      
      if (folderPath) {
        // Find the folder ID first
        const folderResponse = await fetch(
          `${this.baseUrl}/files?q=name='${folderPath}' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
        
        if (folderResponse.ok) {
          const folderData = await folderResponse.json();
          if (folderData.files && folderData.files.length > 0) {
            const folderId = folderData.files[0].id;
            query += ` and '${folderId}' in parents`;
          }
        }
      }

      const response = await fetch(
        `${this.baseUrl}/files?pageSize=1000&q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,owners,webViewLink)`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list Google Drive files: ${response.status}`);
      }

      const data = await response.json();
      return data.files.map((file: any): CloudFile => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.size ? parseInt(file.size) : undefined,
        createdAt: new Date(file.createdTime),
        modifiedAt: new Date(file.modifiedTime),
        ownerEmail: file.owners?.[0]?.emailAddress,
        fileUrl: file.webViewLink,
        status: 'active',
        syncStatus: 'success',
        metadata: {
          webViewLink: file.webViewLink,
        },
      }));
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<CloudFile> {
    try {
      const response = await fetch(
        `${this.baseUrl}/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,owners,webViewLink`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get Google Drive file: ${response.status}`);
      }

      const file = await response.json();
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.size ? parseInt(file.size) : undefined,
        createdAt: new Date(file.createdTime),
        modifiedAt: new Date(file.modifiedTime),
        ownerEmail: file.owners?.[0]?.emailAddress,
        fileUrl: file.webViewLink,
        status: 'active',
        syncStatus: 'success',
        metadata: {
          webViewLink: file.webViewLink,
        },
      };
    } catch (error) {
      console.error('Error getting Google Drive file:', error);
      throw error;
    }
  }

  watchForChanges(callback: (changes: CloudFile[]) => void): void {
    if (this.watching) return;
    
    this.watching = true;
    
    // Set up periodic polling for changes (Google Drive doesn't support webhooks well)
    this.watchInterval = setInterval(async () => {
      try {
        const changes = await this.listFiles();
        callback(changes);
      } catch (error) {
        console.error('Error watching Google Drive changes:', error);
      }
    }, 30000); // Poll every 30 seconds
    
    console.log('Started watching Google Drive for changes');
  }

  stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    this.watching = false;
    console.log('Stopped watching Google Drive for changes');
  }

  async getStorageUsage(): Promise<{ used: number; total: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/about?fields=storageQuota`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get Google Drive storage usage: ${response.status}`);
      }

      const data = await response.json();
      return {
        used: data.storageQuota.used ? parseInt(data.storageQuota.used) : 0,
        total: data.storageQuota.limit ? parseInt(data.storageQuota.limit) : 0,
      };
    } catch (error) {
      console.error('Error getting Google Drive storage usage:', error);
      throw error;
    }
  }

  getPlatformInfo(): { name: string; icon: string } {
    return {
      name: 'Google Drive',
      icon: 'drive',
    };
  }
}