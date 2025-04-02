// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const { loading, userPrivilege, canAccessRoute } = useAuth();
  const location = useLocation();

  // Show loading state when Auth0 or our context is loading
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has access to this route
  if (!canAccessRoute(location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If everything is fine, render the children
  return children;
};

export default ProtectedRoute;