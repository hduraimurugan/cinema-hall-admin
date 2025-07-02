import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from './routes/ProtectedRoutes.jsx'
import { CinemaLayout } from './components/CinemaLayout.jsx';
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import HomePage from './pages/HomePage.jsx'
import ShowsManagement from './pages/ShowsManagement.jsx';
import Bookings from './pages/Bookings.jsx';
import MovieManagement from './pages/MovieManagement.jsx';
import CinemaScreenDesigner from './pages/CinemaScreens.jsx'
import RegisterPage from './pages/RegisterPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const { isLoggedIn } = useAuth()

  return (
    <>
      <Router>
        <Routes>
          {/* Redirect to home if already logged in */}
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />}
          />          
          <Route path="/register" element={<RegisterPage />} />

          <Route path="" element={
            <ProtectedRoute>
              <CinemaLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<HomePage />} />
            <Route path="/screens" element={<CinemaScreenDesigner />} />

            <Route path="/movies" element={<MovieManagement />} />
            <Route path="/shows" element={<ShowsManagement />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  )
}

export default App