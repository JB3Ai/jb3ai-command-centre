/**
 * Cloud Storage Dashboard Component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { CloudStorageIntegration } from '@/lib/cloud-storage/types';
import { CloudStorageManager } from '@/lib/cloud-storage';

interface CloudStorageDashboardProps {
  cloudStorageManager: CloudStorageManager;
}

const CloudStorageDashboard: React.FC<CloudStorageDashboardProps> = ({ cloudStorageManager }) => {
  const [integrations, setIntegrations] = useState<CloudStorageIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const platforms = cloudStorageManager.getAllPlatforms();
      const integrationsList: CloudStorageIntegration[] = platforms.map(platform => ({
        platform,
        isConnected: cloudStorageManager.isPlatformConnected(platform),
        // Additional stats would be fetched here
      }));
      setIntegrations(integrationsList);
      setError(null);
    } catch (err) {
      setError('Failed to load cloud storage integrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      // In a real implementation, this would initiate the OAuth flow
      // For now, we'll simulate a connection
      console.log(`Connecting to ${platform}...`);
      // Simulate connection success
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadIntegrations();
    } catch (err) {
      setError(`Failed to connect to ${platform}`);
      console.error(err);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      // In a real implementation, this would revoke tokens and disconnect
      console.log(`Disconnecting from ${platform}...`);
      // Simulate disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadIntegrations();
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Storage Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your cloud storage integrations with Google Drive, OneDrive, and iCloud.
          </p>
          
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {integrations.map((integration) => {
                  const platformInfo = cloudStorageManager.getPlatformInfo(integration.platform);
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
                          
                          <div className="flex justify-between items-center">
                            <span>Last Sync:</span>
                            <span className="text-sm">
                              {integration.lastSync ? integration.lastSync.toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Files:</span>
                            <span className="text-sm">{integration.filesCount || 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Storage:</span>
                            <span className="text-sm">
                              {integration.storageUsage ? `${(integration.storageUsage.used / 1024).toFixed(1)} GB` : 'N/A'}
                            </span>
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
            </TabsContent>
            
            <TabsContent value="files" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>File listing functionality coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>Analytics dashboard coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {error && (
        <Card variant="destructive">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CloudStorageDashboard;