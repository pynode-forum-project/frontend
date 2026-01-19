import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);

  // Not logged in → Redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/users/login" replace />;
  }

  // Logged in → Access granted
  return <Outlet />;
};

export default ProtectedRoute;
