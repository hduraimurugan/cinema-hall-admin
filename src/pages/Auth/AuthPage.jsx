import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, LayoutDashboard, Ticket, Clapperboard } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { VerifyEmailForm } from './VerifyEmailForm';
import { ResetPasswordForm } from './ResetPasswordForm';

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
    className="w-full lg:w-1/2 flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] lg:min-h-screen"
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
    <div className="lg:hidden relative z-20 flex items-center justify-between px-6 pt-10 pb-6">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
          <Film className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">CineMax Admin</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Management Platform</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-primary text-sm font-semibold leading-tight">Your Cinema.</p>
        <p className="text-slate-400 text-xs">Your Control.</p>
      </div>
    </div>

    {/* === DESKTOP content — vertically centered === */}
    <div className="hidden lg:flex flex-col justify-center h-full pl-16 pr-12 py-20 relative z-10 gap-7">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <span className="text-white font-bold text-xl tracking-wide">CineMax Admin</span>
      </div>

      {/* Badge */}
      <div className="inline-flex w-fit items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3.5 py-1">
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
        <p className="text-slate-400 text-sm leading-relaxed mt-3 max-w-[280px]">
          The complete management platform for modern cinema halls — from scheduling to seat maps.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4">
        {FEATURES.map((feature) => {
          const FeatureIcon = feature.icon;
          return (
            <div key={feature.label} className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-all duration-300">
                <FeatureIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium leading-none">{feature.label}</p>
                <p className="text-slate-500 text-xs mt-1.5">{feature.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex gap-6 pt-3 border-t border-white/[0.06]">
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

const viewIndexes = {
  'login': 0,
  'forgot-password': 1,
  'register': 2,
  'verify-email': 3,
  'reset-password': 4
};

const slideVariants = {
  initial: (dir) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 28 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 }
    }
  },
  exit: (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 28 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 }
    }
  })
};

export const AuthPage = ({ view }) => {
  const [prevView, setPrevView] = useState(view);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const origHtmlOverflow = html.style.overflow;
    const origBodyOverflow = body.style.overflow;

    html.style.overflow = 'auto';
    body.style.overflow = 'auto';

    return () => {
      html.style.overflow = origHtmlOverflow;
      body.style.overflow = origBodyOverflow;
    };
  }, []);

  if (view !== prevView) {
    const prevIndex = viewIndexes[prevView] !== undefined ? viewIndexes[prevView] : 0;
    const currIndex = viewIndexes[view] !== undefined ? viewIndexes[view] : 0;
    setDirection(currIndex >= prevIndex ? 1 : -1);
    setPrevView(view);
  }

  const renderForm = () => {
    switch (view) {
      case 'login':
        return <LoginForm />;
      case 'register':
        return <RegisterForm />;
      case 'forgot-password':
        return <ForgotPasswordForm />;
      case 'verify-email':
        return <VerifyEmailForm />;
      case 'reset-password':
        return <ResetPasswordForm />;
      default:
        return <LoginForm />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 text-white overflow-x-hidden">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-start lg:justify-center bg-slate-950 relative px-4 py-8 md:py-16 overflow-y-auto">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Film reel watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Film className="w-[30rem] h-[30rem] text-white/[0.01]" strokeWidth={0.4} />
        </div>

        {/* Card containing forms */}
        <div className="relative z-10 w-full max-w-lg bg-transparent border-0 shadow-none p-0 sm:bg-slate-900/35 sm:backdrop-blur-xl sm:border sm:border-white/[0.06] sm:rounded-2xl sm:p-8 md:p-10 sm:shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 hidden sm:block" />
          
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={view}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full h-full flex items-center"
            >
              {renderForm()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
