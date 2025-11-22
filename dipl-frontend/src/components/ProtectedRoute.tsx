import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ReactNode } from "react";

type Role = "user" | "organisation" | "admin";

interface ProtectedRouteProps {
  children: ReactNode;
  role: Role;
}

export function ProtectedRoute({ children, role: requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login-user" replace />;
  }

  // Admin može pristupiti svim rutama
  if (role === "admin") {
    return <>{children}</>;
  }

  if (role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}




