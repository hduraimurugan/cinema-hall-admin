import { Navigate, useLocation } from "react-router-dom"
import { useHall } from "../context/HallContext"
import { useAuth } from "../context/AuthContext"

// These paths are always accessible even without a hall
const EXEMPT_PATHS = ["/halls", "/profile", "/settings", "/unauthorized"]

/**
 * Guards routes that require at least one hall.
 * Exempt paths (/halls, /profile, /settings) pass through unconditionally.
 * While halls are loading (for gated paths), shows a neutral spinner.
 * Staff members are never sent to onboarding — they don't own halls.
 * If the admin has no halls, redirects to /onboarding.
 */
export function HallGuard({ children }) {
  const { halls, hallsLoading } = useHall()
  const { user } = useAuth()
  const { pathname } = useLocation()

  // Always allow exempt paths — admin must be able to reach /halls to add one
  if (EXEMPT_PATHS.includes(pathname)) {
    return children
  }

  // Wait for HallContext to resolve the active hall BEFORE rendering any
  // hall-scoped page. HallContext writes activeHallId to localStorage, which is
  // where apiFetch reads the X-Hall-Id header from — render too early and the
  // page's first request goes out without it and fails with
  // "X-Hall-Id header is required".
  //
  // The staff bypass used to sit above this check, so staff skipped the wait
  // and hit exactly that error on every fresh login (on a reload localStorage
  // was already populated, which is why it only showed up right after signing in).
  if (hallsLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    )
  }

  // Staff are never redirected to onboarding — they don't own halls
  if (user?.role === 'staff') {
    return children
  }

  if (halls.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
