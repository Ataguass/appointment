import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <span className="hero-badge">🏥 HospitalFlow</span>
        <h1>Book Your Hospital Appointment in Under a Minute</h1>
        <p>
          Find the right doctor, see real-time availability, and skip the queue.
          Your health, your schedule.
        </p>
        <div className="hero-actions">
          <Link href="/departments" className="btn btn-primary btn-lg">
            Find a Doctor
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Browse Departments</h3>
          <p>
            Search by department or specialization to find the right doctor for
            your needs.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Real-Time Slots</h3>
          <p>
            See live availability and book a slot that fits your schedule — no
            phone calls needed.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Instant Booking</h3>
          <p>
            Book in 3 taps. Receive instant confirmation and reminders so you
            never miss an appointment.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Track Your Queue</h3>
          <p>
            See your real-time queue position and estimated wait time before
            arriving at the hospital.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔔</div>
          <h3>Smart Reminders</h3>
          <p>
            Get notified 24 hours and 2 hours before your appointment so you
            never forget.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔄</div>
          <h3>Easy Rescheduling</h3>
          <p>
            Plans changed? Reschedule or cancel online without calling the
            hospital.
          </p>
        </div>
      </section>
    </main>
  );
}
