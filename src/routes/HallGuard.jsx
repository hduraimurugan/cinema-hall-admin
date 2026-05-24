import { Navigate, useLocation } from "react-router-dom"
import { useHall } from "../context/HallContext"

// These paths are always accessible even without a hall
const EXEMPT_PATHS = ["/halls", "/profile", "/settings", "/unauthorized"]

/**
 * Guards routes that require at least one hall.
 * Exempt paths (/halls, /profile, /settings) pass through unconditionally.
 * While halls are loading (for gated paths), shows a neutral spinner.
 * If the admin has no halls, redirects to /onboarding.
 */
export function HallGuard({ children }) {
  const { halls, hallsLoading } = useHall()
  const { pathname } = useLocation()

  // Always allow exempt paths — admin must be able to reach /halls to add one
  if (EXEMPT_PATHS.includes(pathname)) {
    return children
  }

  if (hallsLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    )
  }

  if (halls.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
