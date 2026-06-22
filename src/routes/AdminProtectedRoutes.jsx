import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from '../components/Loader'
import { usePermissions } from '../context/PermissionContext'

export const AdminProtectedRoute = ({ children, permission, requireSuperAdmin }) => {
  const { loading, user, isSuperAdmin } = useAuth()
  const { can } = usePermissions() || {}
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Reject immediately if page requires platform superAdmin and user is not one
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  // Allow global platform super admin to bypass organization check.
  // Otherwise, organization members must have an organization (orgId) set.
  if (!isSuperAdmin && !user.orgId) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }

  // Gate by permission (global platform super admin bypasses permission checks)
  if (!isSuperAdmin && permission && !can?.(permission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
