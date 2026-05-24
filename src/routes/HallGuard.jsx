import { Navigate } from "react-router-dom"
import { useHall } from "../context/HallContext"
import { Loader } from "../components/Loader"

/**
 * Guards routes that require at least one hall.
 * While halls are loading, shows a full-screen loader.
 * If the admin has no halls yet, redirects to /onboarding.
 * Otherwise renders children normally.
 */
export function HallGuard({ children }) {
  const { halls, hallsLoading } = useHall()

  if (hallsLoading) {
    return <Loader />
  }

  if (halls.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
