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
import PaymentOrders from './pages/PaymentOrders.jsx';
import VerifyTicket from './pages/VerifyTicket.jsx';
import MovieManagement from './pages/MovieManagement.jsx';
import CinemaScreenDesigner from './pages/CinemaScreens.jsx'
import ScreenDesignerPage from './pages/ScreenDesignerPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { AdminProtectedRoute } from './routes/AdminProtectedRoutes.jsx';
import UnAuthorizedPage from './pages/UnAuthorizedPage.jsx';
import MoviePage from './pages/MoviePage.jsx';
import ShowPage from './pages/ShowPage.jsx';
import AddShowPage from './pages/AddShowPage.jsx';
import EditShowPage from './pages/EditShowPage.jsx';
import AddMultipleShowsPage from './pages/AddMultipleShowsPage.jsx';
import AdsManagement from './pages/AdsManagement.jsx';
import OffersManagement from './pages/OffersManagement.jsx';
import OfferFormPage from './pages/OfferFormPage.jsx';
import BookingDetailPage from './pages/BookingDetailPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import AdminsPage from './pages/AdminsPage.jsx';

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

          {/* Normal Cinema Admin routes */}
          <Route path="" element={
            <ProtectedRoute>
              <CinemaLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<HomePage />} />
            <Route path="/unauthorized" element={<UnAuthorizedPage />} />
            
            <Route path="/movie/:id" element={<MoviePage />} />
            <Route path="/screens" element={<CinemaScreenDesigner />} />
            <Route path="/screens/new" element={<ScreenDesignerPage />} />
            <Route path="/screens/:id/edit" element={<ScreenDesignerPage />} />
            <Route path="/shows" element={<ShowsManagement />} />
            <Route path="/shows/new" element={<AddShowPage />} />
            <Route path="/shows/bulk" element={<AddMultipleShowsPage />} />
            <Route path="/shows/:id/edit" element={<EditShowPage />} />
            <Route path="/show/:id" element={<ShowPage/>} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/payment-orders" element={<PaymentOrders />} />
            <Route path="/verify-ticket" element={<VerifyTicket />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Super Admin Routes */}
          <Route path="" element={
            <AdminProtectedRoute>
              <CinemaLayout />
            </AdminProtectedRoute>
          }>
            <Route path="/movies" element={<MovieManagement />} />
            <Route path="/ads" element={<AdsManagement />} />
            <Route path="/offers" element={<OffersManagement />} />
            <Route path="/offers/new" element={<OfferFormPage />} />
            <Route path="/offers/:id/edit" element={<OfferFormPage />} />
            <Route path="/customers" element={<UsersPage />} />
            <Route path="/admins" element={<AdminsPage />} />
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