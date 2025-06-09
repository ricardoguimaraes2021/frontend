import { Navigate } from "react-router-dom";
import Login from "../app/(auth)/login/page";
import { useAuth } from "../hooks/useAuth";

const AuthRedirect = () => {

  const isAuthenticated = useAuth();


  if (isAuthenticated === null) return null;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
};

export default AuthRedirect;
