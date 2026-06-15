import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

type ProtectedRouteProps = {
  children: ReactElement;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}