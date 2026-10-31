const configuredMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim().toUpperCase() || '';
const validMeasurementId = /^G-[A-Z0-9]+$/.test(configuredMeasurementId);
const enabledInThisEnvironment = import.meta.env.PROD || import.meta.env.VITE_GA_ENABLE_IN_DEV === 'true';

const ROUTE_TEMPLATES = [
  [/^\/admin\/creators\/[^/]+\/collaborations\/[^/]+$/, '/admin/creators/:uid/collaborations/:id'],
  [/^\/admin\/creators\/[^/]+$/, '/admin/creators/:uid'],
  [/^\/app\/collaborations\/(?!new$)[^/]+$/, '/app/collaborations/:id'],
];

const PAGE_TITLES = new Map([
  ['/', 'CollabDock - Creator deal workspace'],
  ['/login', 'Log in - CollabDock'],
  ['/register', 'Join the free beta - CollabDock'],
  ['/forgot-password', 'Reset password - CollabDock'],
  ['/contact', 'Contact - CollabDock'],
  ['/onboarding', 'Set up your workspace - CollabDock'],
  ['/app', 'Overview - CollabDock'],
  ['/app/collaborations', 'Collaborations - CollabDock'],
  ['/app/collaborations/new', 'Add collaboration - CollabDock'],
  ['/app/collaborations/:id', 'Collaboration details - CollabDock'],
  ['/app/payments', 'Payments - CollabDock'],
  ['/app/paid-deals', 'Paid deals - CollabDock'],
  ['/app/invoices', 'Invoices - CollabDock'],
  ['/app/invoices/new', 'Create invoice - CollabDock'],
  ['/app/settings', 'Settings - CollabDock'],
  ['/admin', 'Admin overview - CollabDock'],
  ['/admin/creators', 'Admin creators - CollabDock'],
  ['/admin/creators/:uid', 'Admin creator details - CollabDock'],
  ['/admin/creators/:uid/collaborations/:id', 'Admin collaboration - CollabDock'],
  ['/admin/feedback', 'Admin feedback - CollabDock'],
  ['/admin/audit', 'Admin audit log - CollabDock'],
]);

const SAFE_EVENT_PARAMETERS = new Set(['method', 'payment_type', 'linked_collaboration']);

let initialized = false;
let lastSourcePath = '';
let previousPageLocation = '';

export const analyticsEnabled = validMeasurementId && enabledInThisEnvironment;

export function sanitizeAnalyticsPath(pathname = '/') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const route = ROUTE_TEMPLATES.find(([pattern]) => pattern.test(normalizedPath));
  return route ? route[1] : normalizedPath;
}

export function analyticsPageTitle(pathname) {
  const safePath = sanitizeAnalyticsPath(pathname);
  return PAGE_TITLES.get(safePath) || 'CollabDock';
}

function sendToGoogle() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
}

export function initializeAnalytics() {
  if (!analyticsEnabled || initialized || typeof window === 'undefined') return analyticsEnabled;

  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || sendToGoogle;

  if (!document.querySelector('[data-collabdock-analytics]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(configuredMeasurementId)}`;
    script.dataset.collabdockAnalytics = 'true';
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', configuredMeasurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  return true;
}

export function trackPageView(pathname) {
  if (!initializeAnalytics()) return false;

  const sourcePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const pagePath = sanitizeAnalyticsPath(pathname);
  if (lastSourcePath === sourcePath) return false;

  const pageLocation = `${window.location.origin}${pagePath}`;
  const pageTitle = analyticsPageTitle(pagePath);
  document.title = pageTitle;
  window.gtag('event', 'page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    page_path: pagePath,
    ...(previousPageLocation ? { page_referrer: previousPageLocation } : {}),
  });
  previousPageLocation = pageLocation;
  lastSourcePath = sourcePath;
  return true;
}

export function trackEvent(name, parameters = {}) {
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(name) || !initializeAnalytics()) return false;

  const safeParameters = Object.fromEntries(
    Object.entries(parameters).filter(([key, value]) => (
      SAFE_EVENT_PARAMETERS.has(key)
      && ['string', 'number', 'boolean'].includes(typeof value)
    )),
  );
  window.gtag('event', name, safeParameters);
  return true;
}
