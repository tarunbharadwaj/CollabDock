import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { BrandLogo } from './BrandLogo';

function FullLoader() {
  return <div className="full-loader"><BrandLogo className="state-brand-logo"/><p>Preparing your workspace...</p></div>;
}

function ProfileError({ error, retry, retrying, logout }) {
  const [retryMessage, setRetryMessage] = useState('');
  const unauthenticated = error?.response?.status === 401;

  const handleRetry = async () => {
    setRetryMessage('');
    const result = await retry();

    if (result.isError) {
      setRetryMessage('We still cannot connect. Please wait a moment and try again.');
    }
  };

  return (
    <div className="route-error">
      <BrandLogo className="state-brand-logo"/>
      <h1>{unauthenticated ? 'Please sign in again' : "We couldn't load your workspace"}</h1>
      <p>
        {unauthenticated
          ? 'Your session has expired. Sign in again to continue.'
          : 'Something went wrong while loading CollabDock. Please check your connection and try again.'}
      </p>
      {retryMessage && <p className="route-error-feedback" role="status">{retryMessage}</p>}
      <div>
        {unauthenticated ? (
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
  if (isLoading) return <FullLoader />;
  if (isError) return <ProfileError error={error} retry={refetch} retrying={isFetching} logout={logout} />;
  if (!data?.onboardingCompleted && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (data?.onboardingCompleted && location.pathname === '/onboarding') return <Navigate to="/app" replace />;
  return <Outlet />;
}
