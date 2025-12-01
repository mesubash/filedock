import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileStack, Upload, Lock, Zap } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <FileStack className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Secure File Management
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload, manage, and share your files with enterprise-grade security. 
            Public and private file storage made simple.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/login')} className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8">
              Sign In
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Easy Uploads</h3>
              <p className="text-muted-foreground">
                Drag and drop files with progress tracking and instant feedback
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Secure Storage</h3>
              <p className="text-muted-foreground">
                Choose between public and private visibility for each file
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Fast Access</h3>
              <p className="text-muted-foreground">
                Share public files instantly with secure, shareable links
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
