import { FileRecord } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  File, 
  Eye, 
  Trash2, 
  Copy, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  FileQuestion 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FileTableProps {
  files: FileRecord[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (file: FileRecord) => void;
}

const FILE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  other: FileQuestion,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  document: 'bg-blue-100 text-blue-600',
  image: 'bg-green-100 text-green-600',
  video: 'bg-purple-100 text-purple-600',
  audio: 'bg-orange-100 text-orange-600',
  archive: 'bg-yellow-100 text-yellow-600',
  other: 'bg-gray-100 text-gray-600',
};

export function FileTable({ files, onView, onDelete, onCopyLink }: FileTableProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType: string | null) => {
    const type = fileType || 'other';
    return FILE_TYPE_ICONS[type] || File;
  };

  const getIconColor = (fileType: string | null) => {
    const type = fileType || 'other';
    return FILE_TYPE_COLORS[type] || FILE_TYPE_COLORS.other;
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No files found</p>
        <p className="text-sm text-muted-foreground">
          Upload a file or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const IconComponent = getFileIcon(file.file_type);
            const iconColor = getIconColor(file.file_type);
            
            return (
              <TableRow key={file.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium block truncate max-w-[200px]" title={file.original_name}>
                        {file.original_name}
                      </span>
                      {file.description && (
                        <span className="text-xs text-muted-foreground block truncate max-w-[200px]" title={file.description}>
                          {file.description}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {file.file_type || 'unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(file.size)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Badge variant={file.is_public ? 'default' : 'secondary'}>
                    {file.is_public ? 'Public' : 'Private'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {file.tags && (
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {file.tags.split(',').slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                      {file.tags.split(',').length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{file.tags.split(',').length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopyLink(file)}
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(file.id)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(file.id)}
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
