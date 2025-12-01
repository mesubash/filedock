import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { api, FolderRecord, FileRecord, FolderWithContents, FolderBreadcrumb } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  Upload,
  FolderPlus,
  RefreshCw,
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Download,
  Copy,
  Home,
  ChevronRight,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  FileQuestion,
  FolderOpen,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const FILE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  other: FileQuestion,
};

export default function FileBrowser() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolderId = searchParams.get('folder') || undefined;
  
  const [contents, setContents] = useState<FolderWithContents | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FolderRecord | null>(null);
  
  // Delete confirmation states
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'file'; id: string; name: string } | null>(null);

  const loadContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.folders.getContents(currentFolderId);
      setContents(data);
      
      // Load breadcrumbs if in a folder
      if (currentFolderId) {
        const crumbs = await api.folders.getBreadcrumbs(currentFolderId);
        setBreadcrumbs(crumbs);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      toast.error('Failed to load folder contents');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const navigateToFolder = (folderId?: string) => {
    if (folderId) {
      setSearchParams({ folder: folderId });
    } else {
      setSearchParams({});
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await api.folders.create({
        name: newFolderName.trim(),
        parent_id: currentFolderId || null,
      });
      toast.success('Folder created successfully');
      setShowCreateFolder(false);
      setNewFolderName('');
      loadContents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
    }
  };

  const handleRenameFolder = async () => {
    if (!selectedFolder || !newFolderName.trim()) return;
    
    try {
      await api.folders.update(selectedFolder.id, { name: newFolderName.trim() });
      toast.success('Folder renamed successfully');
      setShowRenameFolder(false);
      setSelectedFolder(null);
      setNewFolderName('');
      loadContents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rename folder');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'folder') {
        await api.folders.delete(deleteTarget.id, true);
        toast.success('Folder deleted successfully');
      } else {
        await api.files.delete(deleteTarget.id);
        toast.success('File deleted successfully');
      }
      setDeleteTarget(null);
      loadContents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleCopyLink = (file: FileRecord) => {
    const url = file.is_public && file.slug
      ? api.files.getPublicUrl(file.slug)
      : api.files.getDownloadUrl(file.id);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleDownload = async (file: FileRecord) => {
    const token = api.files.getAuthToken();
    if (!token) {
      toast.error('Please login to download');
      return;
    }

    try {
      const response = await fetch(api.files.getDownloadUrl(file.id), {
        headers: { Authorization: `Bearer ${token}` },
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string | null) => {
    return FILE_TYPE_ICONS[fileType || 'other'] || FileQuestion;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">File Browser</h2>
          <p className="text-muted-foreground">
            Organize your files and folders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadContents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowCreateFolder(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => navigate(`/dashboard/upload${currentFolderId ? `?folder=${currentFolderId}` : ''}`)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              className="cursor-pointer flex items-center gap-1"
              onClick={() => navigateToFolder()}
            >
              <Home className="h-4 w-4" />
              Root
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.id}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink 
                  className="cursor-pointer"
                  onClick={() => navigateToFolder(crumb.id)}
                >
                  {crumb.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {contents?.subfolders && contents.subfolders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {contents.subfolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group relative border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigateToFolder(folder.id)}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolder(folder);
                            setNewFolderName(folder.name);
                            setShowRenameFolder(true);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name });
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-center truncate w-full">
                        {folder.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {folder.subfolder_count} folders, {folder.file_count} files
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {contents?.files && contents.files.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Files</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {contents.files.map((file) => {
                  const IconComponent = getFileIcon(file.file_type);
                  return (
                    <div
                      key={file.id}
                      className="group relative border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/files/${file.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(file)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget({ type: 'file', id: file.id, name: file.original_name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-center truncate w-full" title={file.original_name}>
                          {file.original_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                          <Badge variant={file.is_public ? 'default' : 'secondary'} className="text-xs">
                            {file.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!contents?.subfolders?.length && !contents?.files?.length) && (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">This folder is empty</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a folder or upload files to get started
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setShowCreateFolder(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button onClick={() => navigate(`/dashboard/upload${currentFolderId ? `?folder=${currentFolderId}` : ''}`)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={showRenameFolder} onOpenChange={setShowRenameFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for the folder
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder} disabled={!newFolderName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === 'folder' ? 'Folder' : 'File'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.type === 'folder' && (
                <span className="block mt-2 text-destructive">
                  This will also delete all files and subfolders inside it.
                </span>
              )}
              This action cannot be undone.
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
