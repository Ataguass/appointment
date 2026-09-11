import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-content">
      {/* ─── Hero Section ─── */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <span className="hero-pulse-dot" />
            <span>OPD Counters Active • Live Queue Tracking</span>
          </div>

          <h1>
            Book Your Doctor Consultation <br />
            <span className="text-gradient">Without Waiting in Long Queues</span>
          </h1>

          <p>
            Find top hospital specialists, check live available slots, track your OPD queue token in real-time, and access digital prescriptions instantly.
          </p>

          <div className="hero-actions">
            <Link href="/departments" className="btn btn-primary btn-lg">
              🩺 Find a Doctor
            </Link>
            <Link href="/appointments" className="btn btn-secondary btn-lg">
              🗓️ My Appointments
            </Link>
          </div>

          {/* Floating Trust Metrics */}
          <div className="stats-floating-bar">
            <div className="stat-item">
              <div className="stat-item-number">100%</div>
              <div className="stat-item-label">Verified Doctors</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-number">0s</div>
              <div className="stat-item-label">Double Booking Risk</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-number">&lt; 15m</div>
              <div className="stat-item-label">Average Wait Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-number">Instant</div>
              <div className="stat-item-label">Digital Rx & Receipts</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>Smart Outpatient Care, Engineered for Speed</h2>
          <p style={{ marginTop: 'var(--space-2)' }}>HospitalFlow eliminates waiting room congestion with end-to-end digital coordination.</p>
        </div>

        <div className="grid-responsive-cards">
          <div className="feature-card">
            <div className="feature-icon-box">🏥</div>
            <h3>Multi-Specialty Departments</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>
              From Cardiology to Pediatrics and Orthopedics, explore doctor credentials, consultation fees, and OPD timings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">⏱️</div>
            <h3>Real-Time Slot Engine</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>
              Live availability generated on the fly. Holidays, breaks, and doctor leaves are excluded automatically with zero double-booking.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">📱</div>
            <h3>Live Queue Tracker</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>
              Watch your exact queue token, patients ahead counter, and dynamic estimated wait time directly on your phone.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">💊</div>
            <h3>Digital Prescriptions</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>
              Access doctor notes, structured medication dosages, and follow-up advice the moment your consultation concludes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">🧾</div>
            <h3>Instant Tax Invoices</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>
              View and download official GST payment receipts for cashless claims and medical reimbursements with one click.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">📅</div>
            <h3>1-Click Calendar Sync</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>
              Add appointments directly to Google Calendar or download standard Apple & Outlook .ics calendar invitations with 30-minute alerts.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Security & Compliance Trust Bar ─── */}
      <section style={{ backgroundColor: 'var(--color-white)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-8) 0' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', gap: 'var(--space-6)', textAlign: 'center' }}>
          <div>
            <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)' }}>🔒 256-Bit SSL</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: '2px' }}>Encrypted Patient Records</div>
          </div>
          <div>
            <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)' }}>⚡ High Concurrency</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: '2px' }}>Zero Double-Booking Guarantee</div>
          </div>
          <div>
            <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)' }}>🩺 Standardized Rx</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: '2px' }}>Verified Doctor Signatures</div>
          </div>
        </div>
      </section>
    </main>
  );
}
