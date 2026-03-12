import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { routePaths } from '../router';
import { buildLoginRedirectState } from '../utils/authRedirect';

export function RequireAuth({ children }: { children: ReactElement }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-green-500" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={routePaths.login} state={buildLoginRedirectState(location)} replace />;
  }

  return children;
}
