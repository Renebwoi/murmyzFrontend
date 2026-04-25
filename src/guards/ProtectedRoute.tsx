import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { UserRole } from '../types/auth';
import { ROUTES } from '../constants/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Unauthorized: You don't have permission to access this page</p>
      </div>
    );
  }

  return <>{children}</>;
}
