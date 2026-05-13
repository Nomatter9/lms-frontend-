import type { ReactNode } from "react";

type Role = 'admin' | 'headmaster' | 'teacher' | 'parent' | 'pupil';

interface PermissionGateProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({ allowedRoles, children, fallback = null }: PermissionGateProps) {
  const role = localStorage.getItem("role") as Role | null;
  if (!role || !allowedRoles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}