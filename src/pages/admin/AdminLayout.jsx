import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminSession } from './AdminAuthGate';

const SIDEBAR_WIDTH = 248;

const NAV_ITEMS = [
  { label: 'Overview', to: '/ops/console', end: true },
];

const DEPT_LINKS = [
  { label: 'AI & ML', to: '/ops/console/departments/aiml' },
  { label: 'AI & DS', to: '/ops/console/departments/aids' },
  { label: 'CSE',     to: '/ops/console/departments/cse' },
  { label: 'ISE',     to: '/ops/console/departments/ise' },
  { label: 'ECE',     to: '/ops/console/departments/ece' },
  { label: 'EEE',     to: '/ops/console/departments/eee' },
];

const EVENT_LINKS = [
  { label: 'Treasure Hunt', to: '/ops/console/events/treasure-hunt' },
  { label: 'Hackathon',     to: '/ops/console/events/hackathon' },
];

const linkBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '0.88rem',
  fontWeight: 500,
  color: 'var(--text-dim)',
  textDecoration: 'none',
  transition: 'background 0.15s, color 0.15s',
  lineHeight: 1.3,
};

const linkActive = {
  background: 'var(--cyan-dim)',
  color: 'var(--cyan)',
  fontWeight: 700,
};

function SidebarLink({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...linkBase,
        ...(isActive ? linkActive : {}),
      })}
    >
      {label}
    </NavLink>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--text-muted)',
      padding: '12px 14px 4px',
    }}>
      {children}
    </div>
  );
}

export default function AdminLayout() {
  const { session, handleLogout } = useAdminSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminEmail = session?.user?.email || '';

  const sidebarContent = (
    <aside style={{
      width: SIDEBAR_WIDTH,
      minWidth: SIDEBAR_WIDTH,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--bg-card-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
    }}>
      {/* Branding */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--bg-card-border)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Ops Console
        </div>
        <div style={{ fontFamily: 'var(--font-subheading)', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
          HexaVerse Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} to={item.to} label={item.label} end={item.end} />
        ))}

        <SectionLabel>Departments</SectionLabel>
        {DEPT_LINKS.map((item) => (
          <SidebarLink key={item.to} to={item.to} label={item.label} />
        ))}

        <SectionLabel>Mega Events</SectionLabel>
        {EVENT_LINKS.map((item) => (
          <SidebarLink key={item.to} to={item.to} label={item.label} />
        ))}
      </nav>

      {/* Bottom — logged-in user + logout */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--bg-card-border)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {adminEmail}
        </div>
        <button
          className="btn-details"
          style={{ width: '100%', fontSize: '0.82rem', padding: '7px 12px' }}
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Desktop sidebar — always visible */}
      <div className="admin-sidebar-desktop">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex',
          }}
          onClick={() => setSidebarOpen(false)}
        >
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,36,43,0.35)' }} />
          {/* Sidebar panel */}
          <div
            style={{ position: 'relative', zIndex: 1, width: SIDEBAR_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top-bar with hamburger */}
        <div className="admin-topbar-mobile" style={{
          display: 'none',
          padding: '12px 16px',
          borderBottom: '1px solid var(--bg-card-border)',
          background: 'var(--bg-card)',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px' }}
            aria-label="Open sidebar"
          >
            {[0,1,2].map(i => (
              <span key={i} style={{ display: 'block', width: '22px', height: '2px', background: 'var(--text)', borderRadius: '2px' }} />
            ))}
          </button>
          <span style={{ fontFamily: 'var(--font-subheading)', fontWeight: 700, fontSize: '0.95rem' }}>HexaVerse Admin</span>
        </div>

        {/* Outlet for nested routes */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }} className="admin-main-content">
          <Outlet />
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 769px) {
          .admin-sidebar-desktop { display: flex; flex-direction: column; }
          .admin-topbar-mobile { display: none !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none; }
          .admin-topbar-mobile { display: flex !important; }
          .admin-main-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
}
