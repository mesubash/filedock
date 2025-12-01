import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { api, FileRecord } from '@/lib/api/client';
import { toast } from 'sonner';
import { ArrowLeft, Download, Copy, Lock, Globe, Eye, FileText, Image, Video, Music, Archive, FileQuestion, Maximize2, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

const FILE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  other: FileQuestion,
};

// Helper to determine preview type from content type
const getPreviewType = (contentType: string | null): 'image' | 'video' | 'audio' | 'pdf' | 'none' => {
  if (!contentType) return 'none';
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType === 'application/pdf') return 'pdf';
  return 'none';
};

export default function FileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  useEffect(() => {
    const loadFile = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await api.files.getById(id);
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

  // Load preview when file is loaded
  useEffect(() => {
    const loadPreview = async () => {
      if (!file) return;
      
      const previewType = getPreviewType(file.content_type);
      if (previewType === 'none') return;

      setPreviewLoading(true);
      const token = api.files.getAuthToken();
      
      try {
        const response = await fetch(api.files.getViewUrl(file.id), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!response.ok) throw new Error('Preview failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Failed to load preview:', error);
      } finally {
        setPreviewLoading(false);
      }
    };

    loadPreview();

    // Cleanup blob URL on unmount
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

  const handleCopyLink = () => {
    if (!file || !file.slug) return;
    const url = window.location.origin + `/api/public/${file.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleToggleVisibility = async () => {
    if (!file) return;
    
    setIsUpdatingVisibility(true);
    try {
      const updatedFile = await api.files.update(file.id, {
        is_public: !file.is_public,
      });
      setFile(updatedFile);
      toast.success(updatedFile.is_public ? 'File is now public' : 'File is now private');
    } catch (error) {
      toast.error('Failed to update visibility');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    
    const token = api.files.getAuthToken();
    if (!token) {
      toast.error('Please login to download');
      return;
    }

    try {
      const response = await fetch(api.files.getDownloadUrl(file.id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleView = async () => {
    if (!file) return;
    
    const token = api.files.getAuthToken();
    if (!token) {
      toast.error('Please login to view');
      return;
    }

    try {
      const response = await fetch(api.files.getViewUrl(file.id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('View failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to view file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType: string | null) => {
    const type = fileType || 'other';
    return FILE_TYPE_ICONS[type] || FileQuestion;
  };

  // Render preview based on file type
  const renderPreview = (fullscreen = false) => {
    if (!file || !previewUrl) return null;
    
    const previewType = getPreviewType(file.content_type);
    const containerClass = fullscreen 
      ? "w-full h-full flex items-center justify-center" 
      : "w-full";

    switch (previewType) {
      case 'image':
        return (
          <div className={containerClass}>
            <img
              src={previewUrl}
              alt={file.original_name}
              className={fullscreen ? "max-w-full max-h-[80vh] object-contain" : "w-full max-h-96 object-contain rounded-lg"}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className={containerClass}>
            <video
              src={previewUrl}
              controls
              className={fullscreen ? "max-w-full max-h-[80vh]" : "w-full max-h-96 rounded-lg"}
            >
              Your browser does not support video playback.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className={`${containerClass} p-4 bg-muted/30 rounded-lg`}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="h-12 w-12 text-primary" />
              </div>
              <p className="text-sm font-medium text-center">{file.original_name}</p>
              <audio src={previewUrl} controls className="w-full max-w-md">
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        );
      
      case 'pdf':
        return (
          <div className={containerClass}>
            <iframe
              src={previewUrl}
              title={file.original_name}
              className={fullscreen ? "w-full h-[80vh]" : "w-full h-96 rounded-lg border"}
            />
          </div>
        );
      
      default:
        return null;
    }
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

  const IconComponent = getFileIcon(file.file_type);
  const previewType = getPreviewType(file.content_type);
  const hasPreview = previewType !== 'none';

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" onClick={() => navigate('/dashboard/files')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Files
      </Button>

      {/* File Preview Section */}
      {hasPreview && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Preview</CardTitle>
              {previewUrl && previewType !== 'audio' && (
                <Button variant="ghost" size="sm" onClick={() => setShowFullscreen(true)}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : previewUrl ? (
              renderPreview()
            ) : (
              <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Failed to load preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Preview Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogTitle className="sr-only">{file.original_name} - Preview</DialogTitle>
          <div className="relative w-full h-full bg-black/95 flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setShowFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            {renderPreview(true)}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{file.original_name}</CardTitle>
                <CardDescription>
                  Uploaded {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
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
          {/* Description */}
          {file.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{file.description}</p>
            </div>
          )}

          {/* File metadata grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">File Size</p>
              <p className="font-medium">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Type</p>
              <Badge variant="outline" className="capitalize">
                {file.file_type || 'unknown'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Content Type</p>
              <p className="font-medium text-sm">{file.content_type || 'unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Uploaded</p>
              <p className="font-medium text-sm">
                {format(new Date(file.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Tags */}
          {file.tags && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {file.tags.split(',').map((tag, i) => (
                  <Badge key={i} variant="secondary">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Slug for public files */}
          {file.slug && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Public URL Slug</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">{file.slug}</p>
            </div>
          )}

          {/* Visibility Toggle */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {file.is_public ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{file.is_public ? 'Public File' : 'Private File'}</p>
                  <p className="text-sm text-muted-foreground">
                    {file.is_public 
                      ? 'Anyone with the link can access this file' 
                      : 'Only authenticated admins can access this file'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="visibility-toggle" className="text-sm text-muted-foreground">
                  {file.is_public ? 'Public' : 'Private'}
                </Label>
                <Switch
                  id="visibility-toggle"
                  checked={file.is_public}
                  onCheckedChange={handleToggleVisibility}
                  disabled={isUpdatingVisibility}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {file.is_public && file.slug && (
                <Button onClick={handleCopyLink} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>
              )}
              <Button variant="outline" onClick={handleView} className={file.is_public && file.slug ? "" : "flex-1"}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button variant="secondary" onClick={handleDownload} className={file.is_public && file.slug ? "" : "flex-1"}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
