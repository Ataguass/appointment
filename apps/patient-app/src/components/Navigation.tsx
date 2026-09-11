'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const navLinks = [
    { label: 'Home', href: '/', icon: '🏥' },
    { label: 'Departments', href: '/departments', icon: '🩺' },
    { label: 'My Appointments', href: '/appointments', icon: '🗓️' },
  ];

  return (
    <>
      {/* ─── Desktop Top Navigation Bar (>= 768px) ─── */}
      <header className="top-navbar">
        <div className="container top-navbar-inner">
          <Link href="/" className="top-navbar-brand">
            <div className="brand-icon-box">🏥</div>
            <span className="brand-name">HospitalFlow</span>
          </Link>

          <nav className="top-navbar-links">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`top-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="top-navbar-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
                  👤 {user.name || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-danger-600)' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Link href="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Mobile Header (< 768px) ─── */}
      <header className="mobile-top-header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}>
          <div className="brand-icon-box" style={{ width: '1.85rem', height: '1.85rem', fontSize: '1rem' }}>🏥</div>
          <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', fontSize: '1.1rem' }}>HospitalFlow</span>
        </Link>
        <div>
          {user ? (
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
              Sign Out
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm" style={{ fontSize: '0.8rem', padding: 'var(--space-1) var(--space-3)' }}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation (< 768px) ─── */}
      <nav className="bottom-nav">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
