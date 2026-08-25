/**
 * Cloud Storage Integration Panel for Command Centre
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, Drive, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { CloudStorageManager } from '@/lib/cloud-storage';
import { SupabaseCloudStorage } from '@/lib/cloud-storage/supabase-storage';

interface CloudStorageIntegrationPanelProps {
  supabase: any; // Supabase client
  userId: string;
}

const CloudStorageIntegrationPanel: React.FC<CloudStorageIntegrationPanelProps> = ({ 
  supabase, 
  userId 
}) => {
  const [cloudStorageManager, setCloudStorageManager] = useState<CloudStorageManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);

  useEffect(() => {
    initializeCloudStorage();
  }, []);

  const initializeCloudStorage = async () => {
    try {
      setLoading(true);
      
      // Initialize Supabase storage handler
      const supabaseStorage = new SupabaseCloudStorage(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      // In a real implementation, we would fetch stored credentials from Supabase
      // For now, we'll create a basic manager
      const configs = [
        {
          platform: 'google_drive' as const,
          accessToken: '', // Would be fetched from Supabase
          userId,
        },
        {
          platform: 'onedrive' as const,
          accessToken: '', // Would be fetched from Supabase
          userId,
        },
        {
          platform: 'icloud' as const,
          accessToken: '', // Would be fetched from Supabase
          userId,
        },
      ];
      
      const manager = new CloudStorageManager(configs);
      setCloudStorageManager(manager);
      
      // Load current integrations
      const platforms = ['google_drive', 'onedrive', 'icloud'];
      const integrationList = platforms.map(platform => ({
        platform,
        isConnected: false, // Would check actual connection status
        lastSync: null,
        storageUsage: null,
        filesCount: 0,
      }));
      
      setIntegrations(integrationList);
      setError(null);
    } catch (err) {
      setError('Failed to initialize cloud storage integration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      if (!cloudStorageManager) return;
      
      // In a real implementation, this would initiate OAuth flow
      // For now, we'll simulate the connection
      console.log(`Initiating ${platform} connection...`);
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update UI to reflect connection
      setIntegrations(prev => prev.map(int => 
        int.platform === platform ? {...int, isConnected: true} : int
      ));
      
    } catch (err) {
      setError(`Failed to connect to ${platform}`);
      console.error(err);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      if (!cloudStorageManager) return;
      
      // In a real implementation, this would revoke tokens
      console.log(`Disconnecting from ${platform}...`);
      
      // Simulate disconnection process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI to reflect disconnection
      setIntegrations(prev => prev.map(int => 
        int.platform === platform ? {...int, isConnected: false} : int
      ));
      
    } catch (err) {
      setError(`Failed to disconnect from ${platform}`);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Cloud Storage Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Integrate with your cloud storage services to monitor and analyze file usage.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {integrations.map((integration) => {
            const platformInfo = integration.platform === 'google_drive' 
              ? { name: 'Google Drive', icon: 'drive' } 
              : integration.platform === 'onedrive' 
                ? { name: 'OneDrive', icon: 'drive' } 
                : { name: 'iCloud Drive', icon: 'drive' };
            
            return (
              <Card key={integration.platform}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Drive className="h-4 w-4" />
                    {platformInfo.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <Badge variant={integration.isConnected ? "default" : "destructive"}>
                        {integration.isConnected ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Disconnected
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="pt-2">
                      {integration.isConnected ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisconnect(integration.platform)}
                          className="w-full"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleConnect(integration.platform)}
                          className="w-full"
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudStorageIntegrationPanel;