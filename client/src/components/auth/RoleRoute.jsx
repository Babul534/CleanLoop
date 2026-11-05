import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * RoleRoute Component
 * Restricts route access to users possessing specific authorization roles.
 */
export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen" aria-live="polite" aria-busy="true">
        <div className="auth-loading-card">
          <span className="auth-loading-spinner" />
          <p className="auth-loading-text">Validating role authorizations...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/workspace" replace />;
  }

  return children;
};

export default RoleRoute;

