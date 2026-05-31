import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Film, Clapperboard, Ticket, LayoutDashboard, ChevronRight, RefreshCw, MailCheck, ShieldAlert, Clock } from 'lucide-react';
import { toast } from "sonner";

const FEATURES = [
  { icon: LayoutDashboard, label: "Manage Showings & Schedules", desc: "Full show calendar with seat maps" },
  { icon: Ticket, label: "Track Bookings in Real-time", desc: "Live seat availability and revenue" },
  { icon: Clapperboard, label: "Seat & Screen Management", desc: "Configure layouts, pricing & aisles" },
];

const STATS = [
  { value: "500+", label: "Screens Managed" },
  { value: "Real-time", label: "Booking Updates" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "24/7", label: "Support Access" },
];

const LeftPanel = () => (
  <div
    className="w-full lg:w-1/2 flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a]"
    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
  >
    {/* Glow orbs */}
    <div className="absolute top-1/4 -left-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-1/3 -right-10 w-64 h-64 bg-rose-900/25 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute top-2/3 left-1/3 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

    {/* Right border */}
    <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent z-10" />

    {/* Watermark — desktop only */}
    <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
      <Film className="w-[30rem] h-[30rem] text-white/[0.025]" strokeWidth={0.5} />
    </div>

    {/* === MOBILE compact banner === */}
    <div className="lg:hidden relative z-20 flex items-center justify-between px-5 pt-10 pb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
          <Film className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">Cinema Admin</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Management Platform</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-primary text-sm font-semibold leading-tight">Your Cinema.</p>
        <p className="text-slate-400 text-xs">Your Control.</p>
      </div>
    </div>

    {/* === DESKTOP content — vertically centered === */}
    <div className="hidden lg:flex flex-col justify-center h-full pl-12 pr-10 py-20 relative z-10 gap-7">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <span className="text-white font-bold text-lg tracking-wide">Cinema Admin</span>
      </div>

      {/* Badge */}
      <div className="inline-flex w-fit items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-primary text-xs font-medium">Trusted by 500+ Cinema Operators</span>
      </div>

      {/* Headline */}
      <div>
        <h1 className="text-4xl xl:text-[2.6rem] font-bold text-white leading-tight">
          Your Cinema.
          <br />
          <span className="bg-gradient-to-r from-primary via-rose-400 to-orange-400 bg-clip-text text-transparent">
            Your Control.
          </span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mt-3 max-w-[260px]">
          The complete management platform for modern cinema halls — from scheduling to seat maps.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3">
        {FEATURES.map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <div key={feature.label} className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-200">
                <FeatureIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium leading-none">{feature.label}</p>
                <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats row */}
      <div className="flex gap-6 pt-2 border-t border-white/[0.06]">
        {STATS.slice(0, 3).map(({ value, label }) => (
          <div key={label}>
            <p className="text-primary font-bold text-base">{value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>

  </div>
);

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState(null)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode(null)
    setLockedUntil(null)
    setUnverifiedEmail(null)
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (!result.hall) {
          toast.info("Welcome! Please set up your first cinema hall to get started.", { duration: 5000 })
        } else {
          toast.success("Welcome back!")
        }
        navigate('/');
      } else {
        const data = result.data || {}
        setErrorCode(data.code || null)
        if (data.code === 'ACCOUNT_LOCKED') {
          setLockedUntil(data.lockedUntil)
          setError(result.message)
        } else if (data.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(data.email || email)
          setError(result.message)
        } else {
          setError(result.message || 'Login failed')
          toast.error(result.message || 'Login failed')
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
    if (!unverifiedEmail) return
    setResendingVerification(true)
    try {
      await authAPI.resendVerification(unverifiedEmail)
      toast.success("Verification email sent! Check your inbox.")
      navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)
    } catch (err) {
      toast.error(err.message || "Failed to resend. Please try again.")
    } finally {
      setResendingVerification(false)
    }
  }

  // Format locked until time
  const lockedUntilFormatted = lockedUntil
    ? new Date(lockedUntil).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo — hidden when compact banner is shown */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground">Cinema Admin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your admin account</p>
          </div>

          {/* Email not verified — prominent banner */}
          {errorCode === 'EMAIL_NOT_VERIFIED' && (
            <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
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

          {/* Account locked banner */}
          {errorCode === 'ACCOUNT_LOCKED' && (
            <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/8 p-4">
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
                  className="pl-10 h-11"
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
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
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
