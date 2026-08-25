/**
 * Supabase Integration for Cloud Storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CloudFile } from './types';

export class SupabaseCloudStorage {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveFile(platform: string, file: CloudFile): Promise<{ data: any; error: any }> {
    const cloudFileData = {
      platform,
      file_id: file.id,
      name: file.name,
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
      created_at: file.createdAt.toISOString(),
      modified_at: file.modifiedAt.toISOString(),
      last_accessed: file.lastAccessed?.toISOString(),
      owner_email: file.ownerEmail,
      folder_path: file.folderPath,
      file_url: file.fileUrl,
      storage_usage_mb: file.storageUsageMb,
      access_count: file.accessCount,
      tags: file.tags,
      status: file.status,
      sync_status: file.syncStatus,
      last_sync: file.lastSync?.toISOString(),
      metadata: file.metadata,
    };

    return await this.supabase
      .from('hub_cloud_storage')
      .upsert(cloudFileData, {
        onConflict: 'file_id',
        ignoreDuplicates: false,
      });
  }

  async saveFiles(platform: string, files: CloudFile[]): Promise<{ data: any; error: any }[]> {
    const promises = files.map(file => this.saveFile(platform, file));
    return await Promise.all(promises);
  }

  async getFiles(platform: string, limit?: number): Promise<{ data: CloudFile[]; error: any }> {
    let query = this.supabase
      .from('hub_cloud_storage')
      .select('*')
      .eq('platform', platform);

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) {
      return { data: [], error };
    }

    // Convert to CloudFile objects
    const cloudFiles: CloudFile[] = data.map((item: any): CloudFile => ({
      id: item.file_id,
      name: item.name,
      mimeType: item.mime_type,
      sizeBytes: item.size_bytes,
      createdAt: new Date(item.created_at),
      modifiedAt: new Date(item.modified_at),
      lastAccessed: item.last_accessed ? new Date(item.last_accessed) : undefined,
      ownerEmail: item.owner_email,
      folderPath: item.folder_path,
      fileUrl: item.file_url,
      storageUsageMb: item.storage_usage_mb,
      accessCount: item.access_count,
      tags: item.tags,
      status: item.status as 'active' | 'inactive' | 'deleted',
      syncStatus: item.sync_status as 'pending' | 'syncing' | 'success' | 'error',
      lastSync: item.last_sync ? new Date(item.last_sync) : undefined,
      metadata: item.metadata,
    }));

    return { data: cloudFiles, error: null };
  }

  async getFileById(platform: string, fileId: string): Promise<{ data: CloudFile | null; error: any }> {
    const { data, error } = await this.supabase
      .from('hub_cloud_storage')
      .select('*')
      .eq('platform', platform)
      .eq('file_id', fileId)
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: null };
    }

    // Convert to CloudFile object
    const cloudFile: CloudFile = {
      id: data.file_id,
      name: data.name,
      mimeType: data.mime_type,
      sizeBytes: data.size_bytes,
      createdAt: new Date(data.created_at),
      modifiedAt: new Date(data.modified_at),
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
      ownerEmail: data.owner_email,
      folderPath: data.folder_path,
      fileUrl: data.file_url,
      storageUsageMb: data.storage_usage_mb,
      accessCount: data.access_count,
      tags: data.tags,
      status: data.status as 'active' | 'inactive' | 'deleted',
      syncStatus: data.sync_status as 'pending' | 'syncing' | 'success' | 'error',
      lastSync: data.last_sync ? new Date(data.last_sync) : undefined,
      metadata: data.metadata,
    };

    return { data: cloudFile, error: null };
  }

  async updateFile(platform: string, fileId: string, updates: Partial<CloudFile>): Promise<{ data: any; error: any }> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.mimeType !== undefined) updateData.mime_type = updates.mimeType;
    if (updates.sizeBytes !== undefined) updateData.size_bytes = updates.sizeBytes;
    if (updates.modifiedAt !== undefined) updateData.modified_at = updates.modifiedAt.toISOString();
    if (updates.lastAccessed !== undefined) updateData.last_accessed = updates.lastAccessed?.toISOString();
    if (updates.ownerEmail !== undefined) updateData.owner_email = updates.ownerEmail;
    if (updates.folderPath !== undefined) updateData.folder_path = updates.folderPath;
    if (updates.fileUrl !== undefined) updateData.file_url = updates.fileUrl;
    if (updates.storageUsageMb !== undefined) updateData.storage_usage_mb = updates.storageUsageMb;
    if (updates.accessCount !== undefined) updateData.access_count = updates.accessCount;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.syncStatus !== undefined) updateData.sync_status = updates.syncStatus;
    if (updates.lastSync !== undefined) updateData.last_sync = updates.lastSync?.toISOString();
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    return await this.supabase
      .from('hub_cloud_storage')
      .update(updateData)
      .eq('platform', platform)
      .eq('file_id', fileId);
  }

  async deleteFile(platform: string, fileId: string): Promise<{ data: any; error: any }> {
    return await this.supabase
      .from('hub_cloud_storage')
      .delete()
      .eq('platform', platform)
      .eq('file_id', fileId);
  }

  async getStorageUsage(platform: string): Promise<{ used: number; total: number }> {
    const { data, error } = await this.supabase
      .from('hub_cloud_storage')
      .select('storage_usage_mb')
      .eq('platform', platform)
      .single();

    if (error || !data) {
      return { used: 0, total: 0 };
    }

    return {
      used: data.storage_usage_mb || 0,
      total: 0, // We'd need to get this from the actual cloud service
    };
  }

  async getPlatformStats(platform: string): Promise<{
    filesCount: number;
    totalSize: number;
    lastSync?: Date;
  }> {
    const { data, error } = await this.supabase
      .from('hub_cloud_storage')
      .select('size_bytes, last_sync')
      .eq('platform', platform);

    if (error) {
      return { filesCount: 0, totalSize: 0 };
    }

    const totalSize = data.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
    const lastSync = data.length > 0 
      ? new Date(Math.max(...data.map(item => new Date(item.last_sync).getTime())))
      : undefined;

    return {
      filesCount: data.length,
      totalSize,
      lastSync,
    };
  }
}