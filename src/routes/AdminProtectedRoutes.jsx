import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from '../components/Loader'
import { usePermissions } from '../context/PermissionContext'

export const AdminProtectedRoute = ({ children, permission }) => {
  const { loading, user, isSuperAdmin } = useAuth()
  const { can } = usePermissions() || {}
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  if (permission && !can?.(permission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
