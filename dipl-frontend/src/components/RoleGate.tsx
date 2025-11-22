import { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";

type Role = "user" | "organisation" | "admin";

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: Role[];
}

export function RoleGate({ children, allowedRoles }: RoleGateProps) {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}




