import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, FolderBreadcrumb } from '@/lib/api/client';
import { toast } from 'sonner';
import { Folder, ChevronRight } from 'lucide-react';

const FILE_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'archive', label: 'Archive' },
  { value: 'other', label: 'Other' },
];

export default function UploadFile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folder') || undefined;
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('');
  const [tags, setTags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [folderPath, setFolderPath] = useState<FolderBreadcrumb[]>([]);

  useEffect(() => {
    const loadFolderPath = async () => {
      if (folderId) {
        try {
          const breadcrumbs = await api.folders.getBreadcrumbs(folderId);
          setFolderPath(breadcrumbs);
        } catch (error) {
          // Folder not found, ignore
        }
      }
    };
    loadFolderPath();
  }, [folderId]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          await api.files.upload({
            file,
            isPublic: visibility === 'public',
            customName: visibility === 'public' && customName ? `${customName}-${i}` : undefined,
            description: description || undefined,
            fileType: fileType || undefined,
            tags: tags || undefined,
            folderId: folderId,
            onProgress: (progress) => {
              const overallProgress = Math.round(((i + progress / 100) / selectedFiles.length) * 100);
              setUploadProgress(overallProgress);
            },
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file${failCount !== 1 ? 's' : ''}`);
      }

      // Navigate back to the folder or file browser
      navigate(folderId ? `/dashboard/browse?folder=${folderId}` : '/dashboard/browse');
    } catch (error) {
      toast.error('Upload failed');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Upload File</h2>
        <p className="text-muted-foreground">
          Upload files to your storage
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>
            Choose a file and configure its metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Folder Location */}
          {folderId && folderPath.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uploading to:</span>
              <div className="flex items-center gap-1">
                {folderPath.map((crumb, index) => (
                  <span key={crumb.id} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
                    <span className="text-sm font-medium">{crumb.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <FileUploader
            onFileSelect={setSelectedFiles}
            selectedFiles={selectedFiles}
            onClear={() => {
              setSelectedFiles([]);
              setUploadProgress(0);
            }}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
          />

          {selectedFiles.length > 0 && !isUploading && (
            <div className="space-y-4">
              <div>
                <Label className="text-base mb-3 block">Visibility</Label>
                <RadioGroup
                  value={visibility}
                  onValueChange={(value) => setVisibility(value as 'public' | 'private')}
                >
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="public" id="public" />
                    <div className="flex-1">
                      <Label htmlFor="public" className="font-medium cursor-pointer">
                        Public
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Anyone with the link can access this file
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="private" id="private" />
                    <div className="flex-1">
                      <Label htmlFor="private" className="font-medium cursor-pointer">
                        Private
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Only authenticated users can access this file
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {visibility === 'public' && (
                <div className="space-y-2">
                  <Label htmlFor="customName">Custom URL Name (optional)</Label>
                  <Input
                    id="customName"
                    placeholder="e.g., my-document, annual-report-2024"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    This will create a friendly URL like /api/public/my-document-abc123
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the file..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fileType">File Type (optional)</Label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-detect
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., report, 2024, finance"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated tags for filtering
                  </p>
                </div>
              </div>

              <Button onClick={handleUpload} className="w-full" size="lg">
                Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
