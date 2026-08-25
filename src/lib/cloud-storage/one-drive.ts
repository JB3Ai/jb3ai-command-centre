/**
 * OneDrive Cloud Storage Integration
 */

import { CloudStorageService, CloudFile, CloudStorageConfig } from './types';

export class OneDriveService implements CloudStorageService {
  private config: CloudStorageConfig;
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';
  private watching: boolean = false;
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(config: CloudStorageConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
  }

  async connect(): Promise<void> {
    // Validate token and test connection
    try {
      const response = await fetch(`${this.baseUrl}/me/drive`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OneDrive connection failed: ${response.status}`);
      }

      // Connection successful
      console.log('Connected to OneDrive');
    } catch (error) {
      console.error('OneDrive connection error:', error);
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
    console.log('Disconnected from OneDrive');
  }

  async listFiles(folderPath?: string): Promise<CloudFile[]> {
    try {
      let url = `${this.baseUrl}/me/drive/root/children`;
      
      if (folderPath) {
        // Find the folder ID first
        const folderResponse = await fetch(
          `${this.baseUrl}/me/drive/root:/${folderPath}:/children?fields=id,name,folder,file`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
        
        if (folderResponse.ok) {
          const folderData = await folderResponse.json();
          if (folderData.id) {
            url = `${this.baseUrl}/me/drive/items/${folderData.id}/children`;
          }
        }
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list OneDrive files: ${response.status}`);
      }

      const data = await response.json();
      return data.value.map((item: any): CloudFile => ({
        id: item.id,
        name: item.name,
        mimeType: item.file?.mimeType || item.folder?.mimeType,
        sizeBytes: item.size ? parseInt(item.size) : undefined,
        createdAt: new Date(item.createdDateTime),
        modifiedAt: new Date(item.lastModifiedDateTime),
        ownerEmail: item.owner?.user?.email,
        fileUrl: item.webUrl,
        status: 'active',
        syncStatus: 'success',
        metadata: {
          webUrl: item.webUrl,
          parentReference: item.parentReference,
        },
      }));
    } catch (error) {
      console.error('Error listing OneDrive files:', error);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<CloudFile> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/drive/items/${fileId}?fields=id,name,file,size,createdDateTime,lastModifiedDateTime,owner,webUrl`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get OneDrive file: ${response.status}`);
      }

      const item = await response.json();
      return {
        id: item.id,
        name: item.name,
        mimeType: item.file?.mimeType,
        sizeBytes: item.size ? parseInt(item.size) : undefined,
        createdAt: new Date(item.createdDateTime),
        modifiedAt: new Date(item.lastModifiedDateTime),
        ownerEmail: item.owner?.user?.email,
        fileUrl: item.webUrl,
        status: 'active',
        syncStatus: 'success',
        metadata: {
          webUrl: item.webUrl,
        },
      };
    } catch (error) {
      console.error('Error getting OneDrive file:', error);
      throw error;
    }
  }

  watchForChanges(callback: (changes: CloudFile[]) => void): void {
    if (this.watching) return;
    
    this.watching = true;
    
    // Set up periodic polling for changes
    this.watchInterval = setInterval(async () => {
      try {
        const changes = await this.listFiles();
        callback(changes);
      } catch (error) {
        console.error('Error watching OneDrive changes:', error);
      }
    }, 30000); // Poll every 30 seconds
    
    console.log('Started watching OneDrive for changes');
  }

  stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    this.watching = false;
    console.log('Stopped watching OneDrive for changes');
  }

  async getStorageUsage(): Promise<{ used: number; total: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/me/drive`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get OneDrive storage usage: ${response.status}`);
      }

      const data = await response.json();
      return {
        used: data.quota.used ? parseInt(data.quota.used) : 0,
        total: data.quota.total ? parseInt(data.quota.total) : 0,
      };
    } catch (error) {
      console.error('Error getting OneDrive storage usage:', error);
      throw error;
    }
  }

  getPlatformInfo(): { name: string; icon: string } {
    return {
      name: 'OneDrive',
      icon: 'drive',
    };
  }
}