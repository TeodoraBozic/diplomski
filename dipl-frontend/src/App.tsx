import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AppLayout } from "./components/Layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastContainer, useToast } from "./components/Toast";

// Public pages
import { Home } from "./pages/public/Home";
import { EventsList } from "./pages/public/EventsList";
import { EventDetail } from "./pages/public/EventDetail";
import { OrganisationsList } from "./pages/public/OrganisationsList";
import { OrganisationDetail } from "./pages/public/OrganisationDetail";
import { UserDetailPublic } from "./pages/public/UserDetailPublic";

// Auth pages
import { LoginUser } from "./auth/LoginUser";
import { LoginOrg } from "./auth/LoginOrg";
import { RegisterUser } from "./auth/RegisterUser";
import { RegisterOrg } from "./auth/RegisterOrg";

// User pages
import { Dashboard as UserDashboard } from "./pages/user/Dashboard";
import { Profile as UserProfile } from "./pages/user/Profile";
import { EditProfile as UserEditProfile } from "./pages/user/EditProfile";
import { MyApplications } from "./pages/user/MyApplications";
import { ApplyToEvent } from "./pages/user/ApplyToEvent";
import { ReviewsGivenToOrg } from "./pages/user/ReviewsGivenToOrg";

// Organisation pages
import { Dashboard as OrgDashboard } from "./pages/organisation/Dashboard";
import { MyEvents } from "./pages/organisation/MyEvents";
import { CreateEvent } from "./pages/organisation/CreateEvent";
import { EditEvent } from "./pages/organisation/EditEvent";
import { EventApplications } from "./pages/organisation/EventApplications";
import { AllApplications } from "./pages/organisation/AllApplications";
import { Profile as OrgProfile } from "./pages/organisation/Profile";
import { EditProfile as OrgEditProfile } from "./pages/organisation/EditProfile";
import { ReviewsGivenToUsers } from "./pages/organisation/ReviewsGivenToUsers";
import { EventVolunteers } from "./pages/organisation/EventVolunteers";

// Admin pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { PendingOrganisations } from "./pages/admin/PendingOrganisations";
import { ApproveOrganisation } from "./pages/admin/ApproveOrganisation";
import { AllUsers } from "./pages/admin/AllUsers";

// Shared pages
import { Notifications } from "./pages/shared/Notifications";

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <AppLayout>
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventsList />} />
            <Route path="/events/:title" element={<EventDetail />} />
            <Route path="/organisations" element={<OrganisationsList />} />
            <Route path="/organisations/:username" element={<OrganisationDetail />} />
            <Route path="/users/:username" element={<UserDetailPublic />} />

            {/* Auth routes */}
            <Route path="/login-user" element={<LoginUser />} />
            <Route path="/login-org" element={<LoginOrg />} />
            <Route path="/register-user" element={<RegisterUser />} />
            <Route path="/register-org" element={<RegisterOrg />} />

            {/* User protected routes */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute role="user">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/profile"
              element={
                <ProtectedRoute role="user">
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/profile/edit"
              element={
                <ProtectedRoute role="user">
                  <UserEditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/applications"
              element={
                <ProtectedRoute role="user">
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/apply/:title"
              element={
                <ProtectedRoute role="user">
                  <ApplyToEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/reviews/:eventId"
              element={
                <ProtectedRoute role="user">
                  <ReviewsGivenToOrg />
                </ProtectedRoute>
              }
            />

            {/* Organisation protected routes */}
            <Route
              path="/org/dashboard"
              element={
                <ProtectedRoute role="organisation">
                  <OrgDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/events"
              element={
                <ProtectedRoute role="organisation">
                  <MyEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/events/create"
              element={
                <ProtectedRoute role="organisation">
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/events/:title/edit"
              element={
                <ProtectedRoute role="organisation">
                  <EditEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/events/:eventId/applications"
              element={
                <ProtectedRoute role="organisation">
                  <EventApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/applications"
              element={
                <ProtectedRoute role="organisation">
                  <AllApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/profile"
              element={
                <ProtectedRoute role="organisation">
                  <OrgProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/profile/edit"
              element={
                <ProtectedRoute role="organisation">
                  <OrgEditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/reviews/:eventId/:userId"
              element={
                <ProtectedRoute role="organisation">
                  <ReviewsGivenToUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/events/:eventId/volunteers"
              element={
                <ProtectedRoute role="organisation">
                  <EventVolunteers />
                </ProtectedRoute>
              }
            />

            {/* Admin protected routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pending"
              element={
                <ProtectedRoute role="admin">
                  <PendingOrganisations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="admin">
                  <AllUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:orgId/approve"
              element={
                <ProtectedRoute role="admin">
                  <ApproveOrganisation />
                </ProtectedRoute>
              }
            />

            {/* Shared routes */}
            <Route
              path="/notifications"
              element={<Notifications />}
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
