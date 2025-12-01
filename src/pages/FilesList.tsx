import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileTable } from '@/components/FileTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { api, FileRecord, FileFilters } from '@/lib/api/client';
import { toast } from 'sonner';
import { Upload, RefreshCw, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FILE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'document', label: 'Documents' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'archive', label: 'Archives' },
  { value: 'other', label: 'Other' },
];

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'All Files' },
  { value: 'public', label: 'Public Only' },
  { value: 'private', label: 'Private Only' },
];

export default function FilesList() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [tagsFilter, setTagsFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const buildFilters = useCallback((): FileFilters => {
    const filters: FileFilters = {};
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    if (fileTypeFilter !== 'all') {
      filters.file_type = fileTypeFilter;
    }
    if (visibilityFilter !== 'all') {
      filters.is_public = visibilityFilter === 'public';
    }
    if (tagsFilter.trim()) {
      filters.tags = tagsFilter.trim();
    }
    
    return filters;
  }, [searchQuery, fileTypeFilter, visibilityFilter, tagsFilter]);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = buildFilters();
      const data = await api.files.list(page, perPage, filters);
      setFiles(data.files);
      setTotal(data.total);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [page, buildFilters]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, fileTypeFilter, visibilityFilter, tagsFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.files.delete(deleteId);
      toast.success('File deleted successfully');
      loadFiles();
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setDeleteId(null);
    }
  };

  const handleCopyLink = (file: FileRecord) => {
    // Use slug for public files, download URL for private
    const url = file.is_public && file.slug
      ? api.files.getPublicUrl(file.slug)
      : api.files.getDownloadUrl(file.id);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFileTypeFilter('all');
    setVisibilityFilter('all');
    setTagsFilter('');
  };

  const hasActiveFilters = searchQuery || fileTypeFilter !== 'all' || visibilityFilter !== 'all' || tagsFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Files</h2>
          <p className="text-muted-foreground">
            Manage your uploaded files ({total} total)
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="File Type" />
          </SelectTrigger>
          <SelectContent>
            {FILE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by tags..."
          value={tagsFilter}
          onChange={(e) => setTagsFilter(e.target.value)}
          className="w-[180px]"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
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

      {/* Pagination */}
      {total > perPage && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / perPage)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / perPage)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
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
