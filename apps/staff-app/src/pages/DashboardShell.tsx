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
const navItemsByRole: Record<string, { label: string; icon: string }[]> = {
  ADMIN: [
    { label: 'Command Center', icon: '📊' },
    { label: 'Doctors', icon: '👨‍⚕️' },
    { label: 'Departments', icon: '🏥' },
    { label: 'Schedules', icon: '📅' },
    { label: 'Leave', icon: '🏖️' },
    { label: 'Staff', icon: '👥' },
    { label: 'Settings', icon: '⚙️' },
  ],
  DOCTOR: [
    { label: 'Today\'s Queue', icon: '📋' },
    { label: 'Schedule', icon: '📅' },
    { label: 'Patients', icon: '👥' },
    { label: 'Calendar', icon: '🗓️' },
    { label: 'Settings', icon: '⚙️' },
  ],
  RECEPTIONIST: [
    { label: 'Queue', icon: '📋' },
    { label: 'New Booking', icon: '➕' },
    { label: 'Walk-in', icon: '🚶' },
    { label: 'Check-in', icon: '✅' },
    { label: 'Patients', icon: '👥' },
    { label: 'Schedules', icon: '📅' },
  ],
  BILLING: [
    { label: 'Payments', icon: '💰' },
    { label: 'Receipts', icon: '🧾' },
    { label: 'Reports', icon: '📊' },
  ],
};

const roleTitles: Record<string, string> = {
  ADMIN: 'Hospital Command Center',
  DOCTOR: 'Doctor Dashboard',
  RECEPTIONIST: 'Reception Desk',
  BILLING: 'Billing Portal',
};

const roleSubtitles: Record<string, string> = {
  ADMIN: 'Overview of today\'s OPD operations across all departments.',
  DOCTOR: 'Your daily queue, schedule, and patient consultations.',
  RECEPTIONIST: 'Book, check in, and manage patient appointments.',
  BILLING: 'Track payments and generate receipts.',
};

export default function DashboardShell({ user, onLogout }: DashboardShellProps) {
  const navItems = navItemsByRole[user.role] || [];
  const initial = user.email.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    onLogout();
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation (§3) */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏥</div>
          <span className="sidebar-logo-text">HospitalFlow</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              className={`sidebar-nav-item ${idx === 0 ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
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
        <div className="page-header">
          <h1 className="page-title">{roleTitles[user.role] || 'Dashboard'}</h1>
          <p className="page-subtitle">{roleSubtitles[user.role] || ''}</p>
        </div>

        {/* Placeholder stat cards */}
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
          Dashboard content will be built in Phases 2–6. <br />
          Logged in as <strong>{user.role}</strong>.
        </div>
      </main>
    </div>
  );
}
