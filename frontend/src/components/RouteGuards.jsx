import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { api } from '@/services/api';
import { BrandLogo } from './BrandLogo';

function FullLoader({ startup = false }) {
  if (startup) {
    return (
      <div className="service-startup" role="status" aria-live="polite">
        <BrandLogo className="state-brand-logo" />
        <span className="service-startup-kicker">Connecting securely</span>
        <h1>Starting your workspace</h1>
        <p>
          CollabDock is waking up after a quiet period. This can take up to a minute,
          and we will reconnect automatically.
        </p>
        <span className="service-startup-status">
          <i aria-hidden="true" />
          Preparing your creator workspace
        </span>
        <span className="service-startup-progress" aria-hidden="true"><i /></span>
      </div>
    );
  }

  return <div className="full-loader"><BrandLogo className="state-brand-logo"/><p>Checking your sign in...</p></div>;
}

function ProfileError({ error, retry, retrying, logout }) {
  const [retryMessage, setRetryMessage] = useState('');
  const unauthenticated = error?.response?.status === 401;
  const accountUnavailable = ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETION_PENDING'].includes(error?.response?.data?.error?.code);

  const handleRetry = async () => {
    setRetryMessage('');
    const result = await retry();

    if (result.isError) {
      setRetryMessage('The workspace is still starting. We will keep trying automatically.');
    }
  };

  return (
    <div className="route-error">
      <BrandLogo className="state-brand-logo"/>
      <h1>{unauthenticated ? 'Please sign in again' : accountUnavailable ? 'Your account is unavailable' : 'CollabDock is taking longer than usual'}</h1>
      <p>
        {unauthenticated
          ? 'Your session has expired. Sign in again to continue.'
          : accountUnavailable
            ? 'Please contact CollabDock support if you believe this is a mistake.'
            : 'We will keep reconnecting automatically. You can also try again now.'}
      </p>
      {retryMessage && <p className="route-error-feedback" role="status">{retryMessage}</p>}
      <div>
        {unauthenticated || accountUnavailable ? (
          <button className="button button-primary button-md" onClick={logout}>Go to sign in</button>
        ) : (
          <button className="button button-primary button-md" onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Trying again...' : 'Try again'}
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function OnboardingGuard() {
  const { logout } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useProfile();
  const location = useLocation();
  if (isLoading) return <FullLoader startup />;
  if (isError) return <ProfileError error={error} retry={refetch} retrying={isFetching} logout={logout} />;
  if (!data?.onboardingCompleted && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (data?.onboardingCompleted && location.pathname === '/onboarding') return <Navigate to="/app" replace />;
  return <Outlet />;
}

export function AdminGuard() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const admin = useQuery({
    queryKey: ['admin', 'me', user?.uid],
    queryFn: async () => (await api.get('/admin/me')).data.data,
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (loading || (user && admin.isLoading)) return <FullLoader />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (admin.isError) {
    const forbidden = admin.error?.response?.status === 403;
    return (
      <div className="route-error admin-access-error">
        <BrandLogo className="state-brand-logo"/>
        <h1>{forbidden ? 'Admin access required' : "We couldn't load the admin workspace"}</h1>
        <p>{forbidden ? 'This account does not have permission to open CollabDock Admin.' : 'Please check your connection and try again.'}</p>
        <div>
          {forbidden
            ? <button className="button button-secondary button-md" onClick={logout}>Use another account</button>
            : <button className="button button-primary button-md" onClick={() => admin.refetch()}>Try again</button>}
        </div>
      </div>
    );
  }
  return <Outlet context={{ admin: admin.data }}/>;
}
