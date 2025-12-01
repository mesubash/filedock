import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockApi } from '@/lib/api/mock-api';
import { toast } from 'sonner';

export default function UploadFile() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await mockApi.files.upload(
        selectedFile,
        visibility === 'public',
        setUploadProgress
      );
      toast.success('File uploaded successfully');
      navigate('/dashboard/files');
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
            Choose a file and set its visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploader
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onClear={() => {
              setSelectedFile(null);
              setUploadProgress(0);
            }}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
          />

          {selectedFile && !isUploading && (
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

              <Button onClick={handleUpload} className="w-full" size="lg">
                Upload File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
