/**
 * Cloud Storage Monitoring Component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { CloudFile } from '@/lib/cloud-storage/types';

interface CloudStorageMonitoringProps {
  files: CloudFile[];
  onFileClick?: (file: CloudFile) => void;
}

const CloudStorageMonitoring: React.FC<CloudStorageMonitoringProps> = ({ 
  files, 
  onFileClick 
}) => {
  const [filteredFiles, setFilteredFiles] = useState<CloudFile[]>(files);
  const [filter, setFilter] = useState<'all' | 'recent' | 'large' | 'access'>('all');

  useEffect(() => {
    let result = [...files];
    
    switch (filter) {
      case 'recent':
        result = result.sort((a, b) => 
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        ).slice(0, 10);
        break;
      case 'large':
        result = result
          .filter(f => f.sizeBytes && f.sizeBytes > 1000000) // Filter files > 1MB
          .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0))
          .slice(0, 10);
        break;
      case 'access':
        result = result
          .filter(f => f.accessCount && f.accessCount > 5) // Filter files accessed > 5 times
          .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
          .slice(0, 10);
        break;
      default:
        result = result.slice(0, 10);
    }
    
    setFilteredFiles(result);
  }, [files, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'deleted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Storage Monitoring</span>
          <div className="flex gap-2">
            <Badge 
              variant={filter === 'all' ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setFilter('all')}
            >
              All
            </Badge>
            <Badge 
              variant={filter === 'recent' ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setFilter('recent')}
            >
              Recent
            </Badge>
            <Badge 
              variant={filter === 'large' ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setFilter('large')}
            >
              Large Files
            </Badge>
            <Badge 
              variant={filter === 'access' ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setFilter('access')}
            >
              High Access
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>No files found matching current filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onFileClick && onFileClick(file)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(file.status)}`}></div>
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {file.mimeType || 'Unknown type'} • {file.sizeBytes ? `${(file.sizeBytes / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {file.modifiedAt.toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file.accessCount} accesses
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudStorageMonitoring;