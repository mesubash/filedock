import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Files, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

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
            <div className="text-2xl font-bold">2 Files</div>
            <p className="text-sm text-muted-foreground">3.1 MB total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
