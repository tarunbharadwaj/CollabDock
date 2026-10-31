import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsPageTitle, trackPageView } from '@/lib/analytics';

export function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = analyticsPageTitle(pathname);
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
