/**
 * Cloud Storage Integration Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CloudStorageDashboard from '@/components/cloud-storage/CloudStorageDashboard';
import CloudStorageIntegrationPanel from '@/components/cloud-storage/CloudStorageIntegrationPanel';
import { SupabaseCloudStorage } from '@/lib/cloud-storage/supabase-storage';
import { CloudStorageManager } from '@/lib/cloud-storage';

const CloudStoragePage: React.FC = () => {
  const navigate = useNavigate();
  const [supabaseStorage, setSupabaseStorage] = useState<SupabaseCloudStorage | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [cloudStorageManager, setCloudStorageManager] = useState<CloudStorageManager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Supabase and user context
    const initialize = async () => {
      try {
        // In a real implementation, we would get the authenticated user
        // For now, we'll simulate with a dummy user ID
        const simulatedUserId = 'user-123';
        setUserId(simulatedUserId);
        
        // Initialize Supabase storage handler
        const storage = new SupabaseCloudStorage(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        setSupabaseStorage(storage);
        
        // Initialize cloud storage manager
        const configs = [
          {
            platform: 'google_drive' as const,
            accessToken: '', // Would be fetched from Supabase
            userId: simulatedUserId,
          },
          {
            platform: 'onedrive' as const,
            accessToken: '', // Would be fetched from Supabase
            userId: simulatedUserId,
          },
          {
            platform: 'icloud' as const,
            accessToken: '', // Would be fetched from Supabase
            userId: simulatedUserId,
          },
        ];
        
        const manager = new CloudStorageManager(configs);
        setCloudStorageManager(manager);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize cloud storage page:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cloud Storage Integration</h1>
        <Button onClick={() => navigate('/config')}>
          Configure Integrations
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Storage Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Monitor and analyze your cloud storage usage across Google Drive, OneDrive, and iCloud.
                Track file access patterns, storage consumption, and synchronize data with your dashboard.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Google Drive</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Monitor files and folders in your Google Drive
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">OneDrive</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track files and storage in your OneDrive
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">iCloud Drive</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Analyze files in your iCloud storage
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <CloudStorageDashboard cloudStorageManager={cloudStorageManager!} />
        </div>
        
        <div className="space-y-6">
          <CloudStorageIntegrationPanel 
            supabase={supabaseStorage} 
            userId={userId || ''} 
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Storage Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Storage Used:</span>
                  <span className="font-medium">1.2 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Files Tracked:</span>
                  <span className="font-medium">142</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Platforms:</span>
                  <span className="font-medium">2/3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Sync:</span>
                  <span className="font-medium">Today, 10:30 AM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CloudStoragePage;