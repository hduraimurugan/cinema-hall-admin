import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from './routes/ProtectedRoutes.jsx'
import { CinemaLayout } from './components/CinemaLayout.jsx';
import { AuthPage } from './pages/Auth/AuthPage.jsx'
import { GitHubCallback } from './pages/Auth/GitHubCallback.jsx'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsLayout, SettingsIndexRedirect } from './pages/settings/SettingsLayout'
import { GeneralSettingsPage } from './pages/settings/GeneralSettingsPage'
import { CinemaProfilePage } from './pages/settings/CinemaProfilePage'
import { ShowtimesSettingsPage } from './pages/settings/ShowtimesSettingsPage'
import { BookingSettingsPage } from './pages/settings/BookingSettingsPage'
import { PaymentSettingsPage } from './pages/settings/PaymentSettingsPage'
import { TeamManagementPage } from './pages/settings/TeamManagementPage'
import { RolesPermissionsPage } from './pages/settings/RolesPermissionsPage'
import { AuditLogPage } from './pages/settings/AuditLogPage'
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
import Notifications from './pages/Notifications.jsx'

/**
 * Permission gate for routes inside the authenticated shell.
 *
 * These routes previously carried no permission prop at all, so any signed-in
 * member could reach every admin page by typing the URL. AdminProtectedRoute
 * already implements the check; this is just a shorthand so each route reads
 * as one line.
 */
const Gate = ({ p, children }) => (
  <AdminProtectedRoute permission={p}>{children}</AdminProtectedRoute>
)

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
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<SettingsIndexRedirect />} />
              <Route path="general" element={<Gate p="settings.org.read"><GeneralSettingsPage /></Gate>} />
              <Route path="cinema-profile" element={<Gate p="settings.hall.read"><CinemaProfilePage /></Gate>} />
              <Route path="showtimes" element={<Gate p="settings.hall.read"><ShowtimesSettingsPage /></Gate>} />
              <Route path="booking" element={<Gate p="settings.hall.read"><BookingSettingsPage /></Gate>} />
              <Route path="payment" element={<Gate p="settings.org.read"><PaymentSettingsPage /></Gate>} />
              <Route path="team" element={<Gate p="team.manage"><TeamManagementPage /></Gate>} />
              <Route path="roles" element={<Gate p="roles.read"><RolesPermissionsPage /></Gate>} />
              <Route path="audit-log" element={<Gate p="audit.view"><AuditLogPage /></Gate>} />
            </Route>
            <Route path="/halls" element={<Gate p="halls.read"><HallsManagement /></Gate>} />

            {/* Hall-gated */}
            <Route path="/" element={<Gate p="dashboard.view"><HomePage /></Gate>} />
            <Route path="/movies" element={<Gate p="movies.read"><MovieManagement /></Gate>} />
            <Route path="/movie/:id" element={<Gate p="movies.read"><MoviePage /></Gate>} />
            <Route path="/screens" element={<Gate p="screens.read"><CinemaScreenDesigner /></Gate>} />
            <Route path="/screens/new" element={<Gate p="screens.create"><ScreenDesignerPage /></Gate>} />
            <Route path="/screens/:id/edit" element={<Gate p="screens.update"><ScreenDesignerPage /></Gate>} />
            <Route path="/shows" element={<Gate p="shows.read"><ShowsManagement /></Gate>} />
            <Route path="/shows/new" element={<Gate p="shows.create"><AddShowPage /></Gate>} />
            <Route path="/shows/bulk" element={<Gate p="shows.create"><AddMultipleShowsPage /></Gate>} />
            <Route path="/shows/:id/edit" element={<Gate p="shows.update"><EditShowPage /></Gate>} />
            <Route path="/show/:id" element={<Gate p="shows.read"><ShowPage/></Gate>} />
            <Route path="/bookings" element={<Gate p="bookings.read"><Bookings /></Gate>} />
            <Route path="/bookings/:id" element={<Gate p="bookings.read"><BookingDetailPage /></Gate>} />
            <Route path="/refunds" element={<Gate p="refunds.read"><RefundsPage /></Gate>} />
            <Route path="/payment-orders" element={<Gate p="payment.read"><PaymentOrders /></Gate>} />
            <Route path="/verify-ticket" element={<Gate p="verify-ticket.use"><VerifyTicket /></Gate>} />
          </Route>

          {/* Super Admin / Gated Routes */}
          <Route path="" element={
            <AdminProtectedRoute>
              <CinemaLayout />
            </AdminProtectedRoute>
          }>
            <Route path="/ads" element={<AdminProtectedRoute permission="ads.read" requireSuperAdmin={true}><AdsManagement /></AdminProtectedRoute>} />
            <Route path="/offers" element={<AdminProtectedRoute permission="offers.read"><OffersManagement /></AdminProtectedRoute>} />
            <Route path="/offers/new" element={<AdminProtectedRoute permission="offers.create"><OfferFormPage /></AdminProtectedRoute>} />
            <Route path="/offers/:id/edit" element={<AdminProtectedRoute permission="offers.update"><OfferFormPage /></AdminProtectedRoute>} />
            <Route path="/customers" element={<AdminProtectedRoute permission="customers.read" requireSuperAdmin={true}><UsersPage /></AdminProtectedRoute>} />
            <Route path="/admins" element={<AdminProtectedRoute permission="team.manage" requireSuperAdmin={true}><AdminsPage /></AdminProtectedRoute>} />
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