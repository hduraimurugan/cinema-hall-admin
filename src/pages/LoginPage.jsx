import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Film, Clapperboard, Ticket, LayoutDashboard, ChevronRight } from 'lucide-react';
import { toast } from "sonner";

const FilmStrip = () => (
  <div className="flex gap-1">
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="w-6 h-4 rounded-sm bg-white/10 flex-shrink-0" />
    ))}
  </div>
);

const LeftPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#1a0505] to-[#2d0a0a]">
    {/* Film strip top */}
    <div className="absolute top-0 left-0 right-0 py-2 px-2 bg-black/40 overflow-hidden">
      <FilmStrip />
    </div>

    {/* Background orbs */}
    <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-rose-900/30 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />

    {/* Content */}
    <div className="relative flex flex-col justify-between h-full px-10 pt-20 pb-16">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Cinema Admin</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
          Your Cinema.
          <br />
          <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
            Your Control.
          </span>
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-xs">
          The complete management platform for modern cinema halls. Streamline every operation from a single dashboard.
        </p>
      </div>

      {/* Feature list */}
      <div className="space-y-4 my-10">
        {[
          { icon: LayoutDashboard, label: "Manage Showings & Schedules", desc: "Full show calendar with seat maps" },
          { icon: Ticket, label: "Track Bookings in Real-time", desc: "Live seat availability and revenue" },
          { icon: Clapperboard, label: "Seat & Screen Management", desc: "Configure layouts, pricing & aisles" },
        ].map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <div key={feature.label} className="flex items-start gap-4 group">
              <div className="w-10 h-10 bg-primary/15 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                <FeatureIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{feature.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{feature.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: "500+", label: "Screens Managed" },
          { value: "Real-time", label: "Booking Updates" },
          { value: "99.9%", label: "Uptime SLA" },
          { value: "24/7", label: "Support Access" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-primary font-bold text-lg">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Film strip bottom */}
    <div className="absolute bottom-0 left-0 right-0 py-2 px-2 bg-black/40 overflow-hidden">
      <FilmStrip />
    </div>
  </div>
);

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
    } catch {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground">CineMax Admin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your admin account</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cinema.com"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : (
                <span className="flex items-center gap-2">
                  Sign In <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">New here?</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => navigate('/register')}
            disabled={isLoading}
          >
            Create Account
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Need assistance?{" "}
            <a href="#" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
