import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from './routes/ProtectedRoutes.jsx'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { CinemaLayout } from './components/CinemaLayout.jsx';
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import HomePage from './pages/HomePage.jsx'
import HallManagement from './pages/HallManagement.jsx';
import ShowsManagement from './pages/ShowsManagement.jsx';
import Bookings from './pages/Bookings.jsx';
import MovieManagement from './pages/MovieManagement.jsx';
import AddScreen from './pages/AddScreen.jsx';
import EditScreen from './pages/EditScreen.jsx';
import CinemaScreenDesigner from './pages/CinemaScreens.jsx'

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="" element={
            <ProtectedRoute>
              <CinemaLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<HomePage />} />
            <Route path="/screens" element={<CinemaScreenDesigner />} />

            {/* <Route path="/screens" element={<HallManagement />} />
            <Route path="/add-screen" element={<AddScreen />} />
            <Route path="/edit-screen/:screenId" element={<EditScreen />} /> */}

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