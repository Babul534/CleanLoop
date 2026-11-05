import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute Component
 * Prevents unauthenticated access to member surfaces.
 * Displays an architectural loading state while validating token session.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen" aria-live="polite" aria-busy="true">
        <div className="auth-loading-card">
          <span className="auth-loading-spinner" />
          <p className="auth-loading-text">Verifying CleanLoop security credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

