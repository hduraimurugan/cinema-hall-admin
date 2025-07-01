import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoutes.jsx'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import HomePage from './pages/HomePage.jsx'
import HallManagement from './pages/HallManagement.jsx';
import ShowsManagement from './pages/ShowsManagement.jsx';
import Bookings from './pages/Bookings.jsx';
import { CinemaLayout } from './components/CinemaLayout.jsx';

function App() {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={
                <ProtectedRoute>
                  <CinemaLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<HomePage />} />
                <Route path="/movies" element={<HallManagement />} />
                <Route path="/screens" element={<HallManagement />} />
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
        </AuthProvider>
      </ThemeProvider>
    </>
  )
}

export default App