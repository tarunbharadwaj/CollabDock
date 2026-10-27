import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();
const useQueryMock = vi.fn();

vi.mock('@/context/AuthContext', () => ({ useAuth: () => useAuthMock() }));
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, useQuery: (...args) => useQueryMock(...args) };
});

import { AdminGuard } from './RouteGuards';

function renderGuard() {
  return render(<MemoryRouter initialEntries={['/admin']}><Routes><Route element={<AdminGuard/>}><Route path="/admin" element={<div>Admin content</div>}/></Route><Route path="/admin/login" element={<div>Admin login</div>}/></Routes></MemoryRouter>);
}

describe('AdminGuard', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useQueryMock.mockReset();
  });

  it('redirects signed-out visitors to the dedicated admin login', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    useQueryMock.mockReturnValue({ isLoading: false });
    renderGuard();
    expect(screen.getByText('Admin login')).toBeInTheDocument();
  });

  it('shows a clear denial instead of protected content for non-admin users', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'creator' }, loading: false, logout: vi.fn() });
    useQueryMock.mockReturnValue({ isLoading: false, isError: true, error: { response: { status: 403 } } });
    renderGuard();
    expect(screen.getByRole('heading', { name: 'Admin access required' })).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('renders protected routes after server-confirmed admin access', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'admin' }, loading: false });
    useQueryMock.mockReturnValue({ isLoading: false, isError: false, data: { admin: true } });
    renderGuard();
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
