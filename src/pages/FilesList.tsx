import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileTable } from '@/components/FileTable';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { mockApi, FileRecord } from '@/lib/api/mock-api';
import { toast } from 'sonner';
import { Upload, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FilesList() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const data = await mockApi.files.list();
      setFiles(data);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await mockApi.files.delete(deleteId);
      toast.success('File deleted successfully');
      loadFiles();
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setDeleteId(null);
    }
  };

  const handleCopyLink = (storageKey: string) => {
    const url = mockApi.files.getPublicUrl(storageKey);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Files</h2>
          <p className="text-muted-foreground">
            Manage your uploaded files
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/dashboard/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <FileTable
          files={files}
          onView={(id) => navigate(`/dashboard/files/${id}`)}
          onDelete={setDeleteId}
          onCopyLink={handleCopyLink}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
