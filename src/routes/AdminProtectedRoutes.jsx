import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from '../components/Loader'

export const AdminProtectedRoute = ({ children }) => {
  const { loading, user, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    // Not logged in → go to login
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isSuperAdmin) {
    // Logged in but not super admin → go to unauthorized page
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
