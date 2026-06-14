import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, ChevronRight, RefreshCw, MailCheck, ShieldAlert, Clock } from 'lucide-react';
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
  const [oauthLoading, setOauthLoading] = useState(null);
  const navigate = useNavigate();
  const { login, googleLogin, githubLogin } = useAuth();

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

  // Google OAuth login using implicit flow (access_token)
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading('google');
      setError('');
      setErrorCode(null);
      try {
        const result = await googleLogin(tokenResponse.access_token);
        if (result.success) {
          toast.success("Welcome!");
          navigate('/');
        } else {
          setError(result.message || 'Google login failed');
          toast.error(result.message || 'Google login failed');
        }
      } catch (err) {
        setError('Google login failed. Please try again.');
        toast.error('Google login failed. Please try again.');
      } finally {
        setOauthLoading(null);
      }
    },
    onError: () => {
      toast.error('Google login was cancelled.');
      setOauthLoading(null);
    },
  });

  // GitHub OAuth - redirect to GitHub authorize URL
  const handleGithubLogin = () => {
    setOauthLoading('github');
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
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

        <Button type="submit" className="w-full h-11 font-medium bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300" disabled={isLoading || oauthLoading}>
          {isLoading ? "Signing in..." : (
            <span className="flex items-center justify-center gap-2">
              Sign In <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>

      {/* OAuth Separator */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-medium">Or</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium border-border/60 hover:bg-muted/50 transition-all"
          onClick={() => handleGoogleLogin()}
          disabled={isLoading || oauthLoading}
        >
          {oauthLoading === 'google' ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium border-border/60 hover:bg-muted/50 transition-all"
          onClick={handleGithubLogin}
          disabled={isLoading || oauthLoading}
        >
          {oauthLoading === 'github' ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          )}
          GitHub
        </Button>
      </div>

      {/* New here? */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-medium">New here?</span>
        </div>
      </div>

      <Button
        type="button" variant="ghost"
        className="w-full h-11 text-slate-400 hover:text-white border border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/50 transition-all"
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
