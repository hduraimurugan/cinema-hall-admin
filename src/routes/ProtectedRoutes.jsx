// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from '../components/Loader'

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    // Redirect to login and preserve the attempted path
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user.email_verified === false) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />
  }

  return children
}
