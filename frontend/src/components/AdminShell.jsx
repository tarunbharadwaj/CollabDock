import { NavLink, Outlet } from 'react-router-dom';
import { Gauge, LogOut, ScrollText, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from './BrandLogo';

const links = [
  { to: '/admin', label: 'Overview', icon: Gauge, end: true },
  { to: '/admin/creators', label: 'Creators', icon: UsersRound },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
];

export function AdminShell() {
  const { user, logout } = useAuth();
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <NavLink to="/admin" className="admin-brand"><BrandLogo/><span><small>Internal</small><strong>Admin</strong></span></NavLink>
        <div className="admin-security-pill"><ShieldCheck size={15}/><span>Protected workspace</span></div>
        <nav aria-label="Admin navigation">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={18}/><span>{label}</span></NavLink>)}
        </nav>
        <div className="admin-user">
          <span>{user?.email?.[0]?.toUpperCase() || 'A'}</span>
          <div><strong>Administrator</strong><small>{user?.email}</small></div>
          <button onClick={logout} aria-label="Log out"><LogOut size={17}/></button>
        </div>
      </aside>
      <main className="admin-main"><Outlet/></main>
      <nav className="admin-mobile-nav" aria-label="Admin mobile navigation">
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={19}/><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
}
