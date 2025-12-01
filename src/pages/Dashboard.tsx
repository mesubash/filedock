import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Files, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.files.list(1, 100);
        const totalSize = data.files.reduce((sum, file) => sum + file.size, 0);
        setStats({ totalFiles: data.total, totalSize });
      } catch (error) {
        // Stats are optional, don't show error
      }
    };
    loadStats();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Manage your files efficiently</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/upload')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Drag and drop files or browse to upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Go to Upload</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/files')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Files className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>All Files</CardTitle>
            <CardDescription>
              View and manage your uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">View Files</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>
              Track your storage usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles} Files</div>
            <p className="text-sm text-muted-foreground">{formatSize(stats.totalSize)} total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
