import { describe, expect, it } from 'vitest';
import { analyticsPageTitle, sanitizeAnalyticsPath } from './analytics';

describe('Google Analytics route privacy', () => {
  it('removes collaboration record IDs from creator routes', () => {
    expect(sanitizeAnalyticsPath('/app/collaborations/671fa25abf14628d12345678')).toBe('/app/collaborations/:id');
  });

  it('removes creator UIDs and collaboration IDs from admin routes', () => {
    expect(sanitizeAnalyticsPath('/admin/creators/firebase-user-123/collaborations/671fa25abf14628d12345678'))
      .toBe('/admin/creators/:uid/collaborations/:id');
  });

  it('keeps static routes unchanged', () => {
    expect(sanitizeAnalyticsPath('/app/collaborations/new')).toBe('/app/collaborations/new');
  });

  it('returns a useful title for dynamic routes', () => {
    expect(analyticsPageTitle('/app/collaborations/671fa25abf14628d12345678')).toBe('Collaboration details - CollabDock');
  });
});
