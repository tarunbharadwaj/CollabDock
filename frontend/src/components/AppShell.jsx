import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BadgeCheck,
  BriefcaseBusiness,
  IndianRupee,
  FileText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from './ui';
import { BrandLogo } from './BrandLogo';
import { ProductExperienceProvider } from '@/context/ProductExperienceContext';

const sidebarPreferenceKey = 'collabdock-sidebar-collapsed';

const nav = [
  { to: '/app', label: 'Overview', mobileLabel: 'Overview', icon: BarChart3, end: true },
  { to: '/app/collaborations', label: 'Collaborations', mobileLabel: 'Deals', icon: BriefcaseBusiness },
  { to: '/app/payments', label: 'Payments', icon: IndianRupee },
  { to: '/app/invoices', label: 'Invoices', icon: FileText },
  { to: '/app/paid-deals', label: 'Paid Deals', mobileLabel: 'Paid', icon: BadgeCheck },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const { logout } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(sidebarPreferenceKey) === 'true',
  );

  useEffect(() => {
    localStorage.setItem(sidebarPreferenceKey, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed((collapsed) => !collapsed);

  return (
    <ProductExperienceProvider>
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar" id="app-sidebar">
        <NavLink className="brand" to="/app" aria-label="CollabDock overview">
          <BrandLogo compact={sidebarCollapsed} className="sidebar-brand-logo"/>
        </NavLink>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          aria-controls="app-sidebar"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>} 
        </button>

        <Button
          className="sidebar-add"
          onClick={() => navigate('/app/collaborations/new')}
          data-tour="add-collaboration"
          aria-label="Add collaboration"
          title={sidebarCollapsed ? 'Add collaboration' : undefined}
        >
          <Plus size={17}/>
          <span className="sidebar-label">Add collaboration</span>
        </Button>

        <nav aria-label="Primary navigation">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={sidebarCollapsed ? label : undefined}
              title={sidebarCollapsed ? label : undefined}
              data-label={label}
            >
              <Icon size={18}/>
              <span className="sidebar-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="avatar" title={sidebarCollapsed ? profile?.displayName || 'Creator' : undefined}>
            {profile?.displayName?.[0]?.toUpperCase() || <UserRound size={17}/>} 
          </span>
          <div className="sidebar-user-details">
            <strong>{profile?.displayName || 'Creator'}</strong>
            <small>{profile?.instagramHandle ? `@${profile.instagramHandle.replace('@', '')}` : profile?.email}</small>
          </div>
          <button onClick={logout} aria-label="Log out" title="Log out"><LogOut size={17}/></button>
        </div>
      </aside>

      <main className="main-content"><Outlet/></main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map(({ to, label, mobileLabel, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} aria-label={label}><Icon size={19}/><span>{mobileLabel || label}</span></NavLink>
        ))}
      </nav>
      {!location.pathname.endsWith('/new') && (
        <button className="mobile-fab" data-tour="add-collaboration" aria-label="Add collaboration" onClick={() => navigate('/app/collaborations/new')}>
          <Plus size={22}/>
        </button>
      )}
    </div>
    </ProductExperienceProvider>
  );
}
