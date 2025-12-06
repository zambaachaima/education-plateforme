import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, userData, adminOnly, children }) {
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && (!userData || !userData.isAdmin)) return <Navigate to="/main" replace />;
  return children;
}
