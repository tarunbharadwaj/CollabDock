import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useProfileMock = vi.fn();
const postMock = vi.fn();

vi.mock('@/hooks/useProfile', () => ({ useProfile: () => useProfileMock() }));
vi.mock('@/services/api', () => ({ api: { post: (...args) => postMock(...args) }, apiMessage: (error) => error.message }));

import { isFeedbackPromptEligible, ProductExperienceProvider } from './ProductExperienceContext';

function renderProvider() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/app']}><ProductExperienceProvider><div>Workspace</div></ProductExperienceProvider></MemoryRouter></QueryClientProvider>);
}

describe('ProductExperienceProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useProfileMock.mockReturnValue({ data: { onboardingCompleted: true, productTourStatus: 'Not Seen' } });
    postMock.mockResolvedValue({ data: { data: { productTourStatus: 'Skipped', productTourVersion: 1 } } });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('offers the tour once the completed workspace has loaded', async () => {
    renderProvider();
    await act(async () => { vi.advanceTimersByTime(750); });
    expect(screen.getByRole('heading', { name: 'Welcome to your creator workspace' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
      await Promise.resolve();
    });
    expect(postMock).toHaveBeenCalledWith('/me/product-tour', { status: 'Skipped', version: 1 });
  });

  it('does not offer the tour after it has been acknowledged', async () => {
    useProfileMock.mockReturnValue({ data: { onboardingCompleted: true, productTourStatus: 'Completed' } });
    renderProvider();
    await act(async () => { vi.advanceTimersByTime(750); });
    expect(screen.queryByRole('heading', { name: 'Welcome to your creator workspace' })).not.toBeInTheDocument();
  });
});

describe('feedback prompt eligibility', () => {
  it('allows a first prompt and enforces a thirty day cooldown', () => {
    const now = new Date('2026-10-30T00:00:00.000Z').getTime();
    expect(isFeedbackPromptEligible(null, now)).toBe(true);
    expect(isFeedbackPromptEligible('2026-10-15T00:00:00.000Z', now)).toBe(false);
    expect(isFeedbackPromptEligible('2026-09-29T00:00:00.000Z', now)).toBe(true);
  });
});
