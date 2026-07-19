import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Roles } from "./auth/roles";
import { HomePage } from "./features/public/HomePage";
import { LoginPage } from "./features/auth/LoginPage";
import { AccessDeniedPage, UnauthorizedPage } from "./features/auth/ErrorPages";
import { PortalPlaceholder } from "./features/shared/PortalPlaceholder";
import "./App.css";

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav aria-label="Main navigation" className="main-nav">
      <Link to="/">Home</Link>
      <Link to="/portal/customer">Customer Portal</Link>
      <Link to="/portal/updater">Data Updater Portal</Link>
      <Link to="/portal/admin">Admin Portal</Link>
      <span className="nav-spacer" />
      {user ? (
        <>
          <span>{user.email}</span>
          <button type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </>
      ) : (
        <Link to="/login">Sign in</Link>
      )}
    </nav>
  );
}

/**
 * Route guards are a navigation convenience only — every protected resource
 * is authorized again server-side by the API.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route
            path="/portal/customer"
            element={
              <ProtectedRoute roles={[Roles.Customer, Roles.Admin]}>
                <PortalPlaceholder title="Customer Portal" milestone="Milestone 4" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/updater"
            element={
              <ProtectedRoute roles={[Roles.DataUpdater, Roles.Admin]}>
                <PortalPlaceholder title="Data Updater Portal" milestone="Milestone 5" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/admin"
            element={
              <ProtectedRoute roles={[Roles.Admin]}>
                <PortalPlaceholder title="Admin Portal" milestone="Milestone 5" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
