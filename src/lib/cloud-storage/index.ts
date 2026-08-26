/**
 * Cloud Storage Integration Module
 */

import type { CloudPlatform, CloudStorageService, CloudFile, CloudStorageConfig } from './types';
import { GoogleDriveService } from './google-drive';
import { OneDriveService } from './one-drive';
import { iCloudService } from './icloud';

export class CloudStorageManager {
  private services: Map<CloudPlatform, CloudStorageService> = new Map();
  private config: CloudStorageConfig[];

  constructor(configs: CloudStorageConfig[]) {
    this.config = configs;
    this.initializeServices();
  }

  private initializeServices(): void {
    this.config.forEach((cfg) => {
      switch (cfg.platform) {
        case 'google_drive':
          this.services.set(cfg.platform, new GoogleDriveService(cfg));
          break;
        case 'onedrive':
          this.services.set(cfg.platform, new OneDriveService(cfg));
          break;
        case 'icloud':
          this.services.set(cfg.platform, new iCloudService(cfg));
          break;
      }
    });
  }

  async connectAll(): Promise<void> {
    const promises = Array.from(this.services.values()).map(service => service.connect());
    await Promise.all(promises);
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.services.values()).map(service => service.disconnect());
    await Promise.all(promises);
  }

  async listFiles(platform: CloudPlatform, folderPath?: string): Promise<CloudFile[]> {
    const service = this.services.get(platform);
    if (!service) {
      throw new Error(`No service found for platform: ${platform}`);
    }
    return service.listFiles(folderPath);
  }

  async getFile(platform: CloudPlatform, fileId: string): Promise<CloudFile> {
    const service = this.services.get(platform);
    if (!service) {
      throw new Error(`No service found for platform: ${platform}`);
    }
    return service.getFile(fileId);
  }

  watchForChanges(platform: CloudPlatform, callback: (changes: CloudFile[]) => void): void {
    const service = this.services.get(platform);
    if (!service) {
      throw new Error(`No service found for platform: ${platform}`);
    }
    service.watchForChanges(callback);
  }

  stopWatching(platform: CloudPlatform): void {
    const service = this.services.get(platform);
    if (!service) {
      throw new Error(`No service found for platform: ${platform}`);
    }
    service.stopWatching();
  }

  async getStorageUsage(platform: CloudPlatform): Promise<{ used: number; total: number }> {
    const service = this.services.get(platform);
    if (!service) {
      throw new Error(`No service found for platform: ${platform}`);
    }
    return service.getStorageUsage();
  }

  getPlatformInfo(platform: CloudPlatform): { name: string; icon: string } {
    const service = this.services.get(platform);
    if (!service) {
      throw new Error(`No service found for platform: ${platform}`);
    }
    return service.getPlatformInfo();
  }

  getAllPlatforms(): CloudPlatform[] {
    return Array.from(this.services.keys());
  }

  isPlatformConnected(platform: CloudPlatform): boolean {
    return this.services.has(platform);
  }
}