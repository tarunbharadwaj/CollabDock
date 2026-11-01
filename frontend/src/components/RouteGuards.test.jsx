import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();

vi.mock('@/context/AuthContext', () => ({ useAuth: () => useAuthMock() }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: vi.fn() }));

import { AuthGuard, GuestGuard } from './RouteGuards';

function CurrentLocation() {
  const location = useLocation();
  return <div>{`${location.pathname}|${location.state?.from || ''}`}</div>;
}

describe('route authentication boundaries', () => {
  beforeEach(() => useAuthMock.mockReset());

  it('keeps signed-out visitors on guest routes', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<GuestGuard/>}><Route path="/login" element={<div>Login form</div>}/></Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login form')).toBeInTheDocument();
  });

  it('redirects authenticated users away from login and signup routes', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'creator' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route element={<GuestGuard/>}><Route path="/register" element={<div>Signup form</div>}/></Route>
          <Route path="/app" element={<div>Creator workspace</div>}/>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Creator workspace')).toBeInTheDocument();
    expect(screen.queryByText('Signup form')).not.toBeInTheDocument();
  });

  it('preserves a protected route query and hash when requesting sign in', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/app/invoices?status=issued#latest']}>
        <Routes>
          <Route element={<AuthGuard/>}><Route path="/app/invoices" element={<div>Invoices</div>}/></Route>
          <Route path="/login" element={<CurrentLocation/>}/>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('/login|/app/invoices?status=issued#latest')).toBeInTheDocument();
  });

  it('redirects authenticated users away from the admin login route', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'admin' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route element={<GuestGuard redirectTo="/admin"/>}><Route path="/admin/login" element={<div>Admin login</div>}/></Route>
          <Route path="/admin" element={<div>Admin workspace</div>}/>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Admin workspace')).toBeInTheDocument();
    expect(screen.queryByText('Admin login')).not.toBeInTheDocument();
  });
});
