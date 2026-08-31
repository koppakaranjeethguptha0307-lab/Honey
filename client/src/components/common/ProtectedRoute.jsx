import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { AccessDeniedPage } from '../../pages/AccessDeniedPage';

export function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated } = useRole();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const userRole = (user?.role || '').toLowerCase();

  // Admin always has access to all internal management routes
  if (userRole === 'admin') {
    return children;
  }

  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
    return <AccessDeniedPage />;
  }

  return children;
}

export default ProtectedRoute;
