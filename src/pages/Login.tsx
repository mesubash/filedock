import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileStack, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password
    if (password.length < 3) {
      toast.error('Password must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      // Handle different error types
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('422') || message.includes('unprocessable')) {
          toast.error('Invalid email or password format');
        } else if (message.includes('401') || message.includes('unauthorized')) {
          toast.error('Invalid email or password');
        } else if (message.includes('403') || message.includes('forbidden')) {
          toast.error('Account is disabled. Contact administrator.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <FileStack className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            Sign in to manage your files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
