import { useState } from 'react';
import DepartmentsPage from './Departments';
import DoctorsPage from './Doctors';
import SchedulesPage from './Schedules';
import LeavePage from './Leave';
import AppointmentsPage from './Appointments';
import WalkInPage from './WalkIn';
import QueuePage from './Queue';
import LiveDisplayPage from './LiveDisplay';
import ConsultationsPage from './Consultations';
import PaymentsPage from './Payments';
import ReportsPage from './Reports';





interface DashboardShellProps {
  user: {
    id: string;
    email: string;
    role: string;
    accessToken: string;
  };
  onLogout: () => void;
}


// Role-specific navigation items (§3, §9)
const navItemsByRole: Record<string, { label: string; icon: string; page: string }[]> = {
  ADMIN: [
    { label: 'Command Center', icon: '📊', page: 'dashboard' },
    { label: 'OPD Queue', icon: '📋', page: 'queue' },
    { label: 'Consultations', icon: '🩺', page: 'consultations' },
    { label: 'Appointments', icon: '🗓️', page: 'appointments' },
    { label: 'Billing & Cashier', icon: '💰', page: 'payments' },
    { label: 'Revenue Reports', icon: '📈', page: 'reports' },
    { label: 'Waiting Room TV', icon: '📺', page: 'display' },
    { label: 'Doctors', icon: '👨‍⚕️', page: 'doctors' },
    { label: 'Departments', icon: '🏥', page: 'departments' },
    { label: 'Schedules', icon: '📅', page: 'schedules' },
    { label: 'Leave', icon: '🏖️', page: 'leave' },
  ],
  DOCTOR: [
    { label: 'Consultation Desk', icon: '🩺', page: 'consultations' },
    { label: "Today's Queue", icon: '📋', page: 'queue' },
    { label: 'Appointments', icon: '🗓️', page: 'appointments' },
    { label: 'Schedule', icon: '📅', page: 'schedules' },
    { label: 'Leave', icon: '🏖️', page: 'leave' },
  ],

  RECEPTIONIST: [
    { label: 'Queue Desk', icon: '📋', page: 'queue' },
    { label: 'Walk-in Token', icon: '🚶', page: 'walkin' },
    { label: 'Appointments', icon: '🗓️', page: 'appointments' },
    { label: 'Billing Desk', icon: '💰', page: 'payments' },
    { label: 'Waiting Room TV', icon: '📺', page: 'display' },
    { label: 'Schedules', icon: '📅', page: 'schedules' },
  ],

  BILLING: [
    { label: 'Cashier & Payments', icon: '💰', page: 'payments' },
    { label: 'Revenue Analytics', icon: '📊', page: 'reports' },
    { label: 'Appointments', icon: '🗓️', page: 'appointments' },
  ],

};

const roleTitles: Record<string, string> = {
  ADMIN: 'Hospital Command Center',
  DOCTOR: 'Doctor Dashboard',
  RECEPTIONIST: 'Reception Desk',
  BILLING: 'Billing Portal',
};

const roleSubtitles: Record<string, string> = {
  ADMIN: "Overview of today's OPD operations across all departments.",
  DOCTOR: 'Your daily queue, schedule, and patient consultations.',
  RECEPTIONIST: 'Book, check in, and manage patient appointments.',
  BILLING: 'Track payments and generate receipts.',
};

export default function DashboardShell({ user, onLogout }: DashboardShellProps) {
  const navItems = navItemsByRole[user.role] || [];
  const initial = user.email.charAt(0).toUpperCase();
  const [activePage, setActivePage] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    onLogout();
  };

  const handleNavClick = (page: string) => {
    setActivePage(page);
    setIsDrawerOpen(false);
  };

  const currentItem = navItems.find((item) => item.page === activePage);

  const renderPage = () => {
    switch (activePage) {
      case 'departments':
        return <DepartmentsPage />;
      case 'doctors':
        return <DoctorsPage />;
      case 'schedules':
        return <SchedulesPage />;
      case 'leave':
        return <LeavePage />;
      case 'queue':
        return <QueuePage />;
      case 'display':
        return <LiveDisplayPage />;
      case 'consultations':
        return <ConsultationsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'walkin':
        return <WalkInPage />;
      case 'booking':
      case 'checkin':
      case 'appointments':
        return <AppointmentsPage />;

      default:
        return (
          <>
            <div className="page-header">
              <h1 className="page-title">{roleTitles[user.role] || 'Dashboard'}</h1>
              <p className="page-subtitle">{roleSubtitles[user.role] || ''}</p>
            </div>

            {/* Stat cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Appointments Today</div>
                <div className="stat-value">—</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Checked In</div>
                <div className="stat-value">—</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value">—</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">No-Shows</div>
                <div className="stat-value">—</div>
              </div>
            </div>

            <div style={{
              padding: 'var(--space-12)',
              textAlign: 'center',
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--font-size-sm)'
            }}>
              Remaining dashboard content will be built in Phases 3–6. <br />
              Logged in as <strong>{user.role}</strong>.
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Topbar (<1024px) */}
      <header className="staff-mobile-topbar">
        <button
          className="staff-hamburger-btn"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          aria-label="Toggle navigation drawer"
          id="mobile-drawer-toggle"
        >
          <span className="staff-hamburger-line" />
          <span className="staff-hamburger-line" />
          <span className="staff-hamburger-line" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '1.25rem' }}>🏥</span>
          <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)' }}>
            {currentItem ? currentItem.label : 'HospitalFlow'}
          </span>
        </div>

        <div className="sidebar-avatar" style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.75rem' }}>
          {initial}
        </div>
      </header>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="sidebar-drawer-overlay"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Desktop Fixed, Mobile Slide-in Drawer) */}
      <aside className={`sidebar ${isDrawerOpen ? 'drawer-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏥</div>
          <span className="sidebar-logo-text">HospitalFlow</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.page}
              className={`sidebar-nav-item ${activePage === item.page ? 'active' : ''}`}
              onClick={() => handleNavClick(item.page)}
              id={`nav-${item.page}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.email}</div>
              <div className="sidebar-user-role">{user.role.toLowerCase()}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            id="logout-btn"
            style={{ marginTop: 'var(--space-3)', width: '100%', color: 'var(--color-gray-400)' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
