import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Role } from "./roles";

interface ProtectedRouteProps {
  children: ReactNode;
  /** When set, the user must hold at least one of these roles. */
  roles?: Role[];
}

/**
 * Route guard: unauthenticated users go to /login, authenticated users
 * without a required role go to /access-denied. This is a UX convenience
 * only — real authorization is always enforced by the API.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p className="page">Checking your session…</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.some((role) => user.roles.includes(role))) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
