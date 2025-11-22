import { Navigate } from "react-router-dom";

export function Profile() {
  // Redirect to dashboard since profile is now integrated there
  return <Navigate to="/user/dashboard" replace />;
}

