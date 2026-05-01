import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only authenticated users can access it.
 * Unauthenticated users are redirected to /login and the intended
 * URL is preserved so they can be sent back after login.
 *
 * Usage:
 *   <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
 *
 * Optional: requireAdmin={true} to restrict to Admin role only.
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
