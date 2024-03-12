import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = React.memo(({ user, children }) => {
  return user ? children : <Navigate to="/" replace />;
});

export default ProtectedRoute;
