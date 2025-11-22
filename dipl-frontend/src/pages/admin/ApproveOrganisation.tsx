// This page can redirect to PendingOrganisations or be used for a detailed view
// For now, redirecting to the list view
import { Navigate } from "react-router-dom";

export function ApproveOrganisation() {
  return <Navigate to="/admin/pending" replace />;
}




