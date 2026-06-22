import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from './routes/ProtectedRoutes.jsx'
import { CinemaLayout } from './components/CinemaLayout.jsx';
import { AuthPage } from './pages/Auth/AuthPage.jsx'
import { GitHubCallback } from './pages/Auth/GitHubCallback.jsx'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsLayout } from './pages/settings/SettingsLayout'
import { GeneralSettingsPage } from './pages/settings/GeneralSettingsPage'
import { CinemaProfilePage } from './pages/settings/CinemaProfilePage'
import { ShowtimesSettingsPage } from './pages/settings/ShowtimesSettingsPage'
import { BookingSettingsPage } from './pages/settings/BookingSettingsPage'
import { PaymentSettingsPage } from './pages/settings/PaymentSettingsPage'
import { TeamManagementPage } from './pages/settings/TeamManagementPage'
import { RolesPermissionsPage } from './pages/settings/RolesPermissionsPage'
import HomePage from './pages/HomePage.jsx'
import ShowsManagement from './pages/ShowsManagement.jsx';
import Bookings from './pages/Bookings.jsx';
import PaymentOrders from './pages/PaymentOrders.jsx';
import VerifyTicket from './pages/VerifyTicket.jsx';
import MovieManagement from './pages/MovieManagement.jsx';
import CinemaScreenDesigner from './pages/CinemaScreens.jsx'
import ScreenDesignerPage from './pages/ScreenDesignerPage.jsx'
import { useAuth } from './context/AuthContext.jsx';
import { AdminProtectedRoute } from './routes/AdminProtectedRoutes.jsx';
import { PermissionProvider } from './context/PermissionContext'
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
import RefundsPage from './pages/RefundsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import AdminsPage from './pages/AdminsPage.jsx';
import HallsManagement from './pages/HallManagement.jsx'
import OnboardingPage, { OnboardingPageSkeleton } from './pages/OnboardingPage.jsx'
import { HallGuard } from './routes/HallGuard.jsx'
import { useHall } from './context/HallContext.jsx'
import { Loader } from './components/Loader.jsx'

function App() {
  const { isLoggedIn, user } = useAuth()
  const { halls, hallsLoading } = useHall()

  return (
    <>
      <Router>
        <PermissionProvider>
        <Routes>
          {/* Redirect to home if already logged in */}
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/" replace /> : <AuthPage view="login" />}
          />
          <Route path="/register" element={<AuthPage view="register" />} />
          <Route path="/verify-email" element={<AuthPage view="verify-email" />} />
          <Route path="/forgot-password" element={<AuthPage view="forgot-password" />} />
          <Route path="/reset-password" element={<AuthPage view="reset-password" />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />

          {/* Onboarding — only admins/owners with no halls see this; staff skip to / */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                {user?.role === 'staff'
                  ? <Navigate to="/" replace />
                  : hallsLoading
                    ? <OnboardingPageSkeleton />
                    : halls.length > 0
                      ? <Navigate to="/" replace />
                      : <OnboardingPage />}
              </ProtectedRoute>
            }
          />

          {/* All authenticated routes — HallGuard bypasses check for exempt paths */}
          <Route path="" element={
            <ProtectedRoute>
              <HallGuard>
                <CinemaLayout />
              </HallGuard>
            </ProtectedRoute>
          }>
            {/* Exempt: accessible without a hall */}
            <Route path="/unauthorized" element={<UnAuthorizedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="general" replace />} />
              <Route path="general" element={<GeneralSettingsPage />} />
              <Route path="cinema-profile" element={<CinemaProfilePage />} />
              <Route path="showtimes" element={<ShowtimesSettingsPage />} />
              <Route path="booking" element={<BookingSettingsPage />} />
              <Route path="payment" element={<PaymentSettingsPage />} />
              <Route path="team" element={<TeamManagementPage />} />
              <Route path="roles" element={<RolesPermissionsPage />} />
            </Route>
            <Route path="/halls" element={<HallsManagement />} />

            {/* Hall-gated */}
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MovieManagement />} />
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
            <Route path="/refunds" element={<RefundsPage />} />
            <Route path="/payment-orders" element={<PaymentOrders />} />
            <Route path="/verify-ticket" element={<VerifyTicket />} />
          </Route>

          {/* Super Admin Routes */}
          <Route path="" element={
            <AdminProtectedRoute>
              <CinemaLayout />
            </AdminProtectedRoute>
          }>
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
        </PermissionProvider>
      </Router>
      <Toaster position="top-right" />
    </>
  )
}

export default App