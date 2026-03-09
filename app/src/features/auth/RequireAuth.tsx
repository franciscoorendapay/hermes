import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './auth.store';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function RequireAuth() {
  const { isAuthenticated, isLoading, initSession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Only init if we are loading and haven't initialized yet
    // (This is safe to call multiple times as initSession checks token existence)
    if (isLoading) {
      initSession();
    }
  }, [isLoading, initSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the current location they were trying to go to
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
