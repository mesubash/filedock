import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockApi, FileRecord } from '@/lib/api/mock-api';
import { toast } from 'sonner';
import { ArrowLeft, Download, Copy, Lock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function FileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFile = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await mockApi.files.getById(id);
        setFile(data);
      } catch (error) {
        toast.error('File not found');
        navigate('/dashboard/files');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [id, navigate]);

  const handleCopyLink = () => {
    if (!file) return;
    const url = mockApi.files.getPublicUrl(file.storage_key);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => navigate('/dashboard/files')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Files
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{file.original_name}</CardTitle>
              <CardDescription>
                Uploaded {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <Badge variant={file.is_public ? 'default' : 'secondary'} className="text-sm">
              {file.is_public ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">File Size</p>
              <p className="font-medium">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Uploaded By</p>
              <p className="font-medium">{file.uploaded_by}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Storage Key</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">{file.storage_key}</p>
            </div>
          </div>

          {file.is_public ? (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <p className="font-medium">Public File</p>
              </div>
              <p className="text-sm text-muted-foreground">
                This file is publicly accessible via a shareable link
              </p>
              <div className="flex gap-2">
                <Button onClick={handleCopyLink} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Private File</p>
              </div>
              <p className="text-sm text-muted-foreground">
                This file is private and only accessible to authenticated users
              </p>
              <Button variant="secondary" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
