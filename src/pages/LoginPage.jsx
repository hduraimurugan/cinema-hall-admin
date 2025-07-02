import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Film } from 'lucide-react';
import { toast } from "sonner";

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast.success("Welcome back!");
        navigate('/');
      } else {
        setError(result.message || 'Login failed');
        toast.error(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Film className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Cinema Admin
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in to manage your cinema hall
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@cinema.com"
                    className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">
                  New to Cinema Admin?
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-11 border-border/50 hover:bg-secondary/50 transition-colors"
              onClick={() => navigate('/register')}
              disabled={isLoading}
            >
              Create Account
            </Button>
          </CardContent>

          <CardFooter className="justify-center pt-6">
            <p className="text-xs text-muted-foreground text-center">
              Need assistance?{" "}
              <a href="#" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
