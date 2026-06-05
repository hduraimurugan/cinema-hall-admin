import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Film, ChevronRight, RefreshCw, MailCheck, ShieldAlert, Clock } from 'lucide-react';
import { toast } from "sonner";

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode(null);
    setLockedUntil(null);
    setUnverifiedEmail(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (!result.hall) {
          toast.info("Welcome! Please set up your first cinema hall to get started.", { duration: 5000 });
        } else {
          toast.success("Welcome back!");
        }
        navigate('/');
      } else {
        const data = result.data || {};
        setErrorCode(data.code || null);
        if (data.code === 'ACCOUNT_LOCKED') {
          setLockedUntil(data.lockedUntil);
          setError(result.message);
        } else if (data.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(data.email || email);
          setError(result.message);
        } else {
          setError(result.message || 'Login failed');
          toast.error(result.message || 'Login failed');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendingVerification(true);
    try {
      await authAPI.resendVerification(unverifiedEmail);
      toast.success("Verification email sent! Check your inbox.");
      navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
    } catch (err) {
      toast.error(err.message || "Failed to resend. Please try again.");
    } finally {
      setResendingVerification(false);
    }
  };

  const lockedUntilFormatted = lockedUntil
    ? new Date(lockedUntil).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">Sign in to your admin account</p>
      </div>

      {/* Email not verified */}
      {errorCode === 'EMAIL_NOT_VERIFIED' && (
        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <MailCheck className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300 leading-none mb-1">Email not verified</p>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                Check your inbox for the verification link, or request a new one below.
              </p>
              <button
                type="button"
                className="mt-3 h-8 px-3 text-xs rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 hover:border-amber-500/50 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleResendVerification}
                disabled={resendingVerification}
              >
                {resendingVerification ? (
                  <><RefreshCw className="w-3 h-3 animate-spin" />Sending…</>
                ) : (
                  <><RefreshCw className="w-3 h-3" />Resend verification email</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account locked */}
      {errorCode === 'ACCOUNT_LOCKED' && (
        <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/8 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-300 leading-none mb-1">Account temporarily locked</p>
              <p className="text-xs text-red-200/70 leading-relaxed">{error}</p>
              {lockedUntilFormatted && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock className="w-3 h-3 text-red-400/70" />
                  <span className="text-xs text-red-300/80">Unlocks at <span className="font-medium text-red-200">{lockedUntilFormatted}</span></span>
                </div>
              )}
              <p className="text-xs text-red-200/50 mt-2">
                Or{' '}
                <Link to="/forgot-password" className="text-red-300 underline underline-offset-2 hover:text-red-200">
                  reset your password
                </Link>{' '}
                to regain access immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generic error */}
      {error && !errorCode && (
        <Alert variant="destructive" className="mb-6 border-destructive/30 bg-destructive/8">
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
              className="pl-10 h-11 focus-visible:ring-primary/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10 h-11 focus-visible:ring-primary/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 font-medium bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300" disabled={isLoading}>
          {isLoading ? "Signing in..." : (
            <span className="flex items-center justify-center gap-2">
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
        className="w-full h-11 border-slate-700 hover:border-slate-500 hover:bg-slate-900/50"
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
  );
};
