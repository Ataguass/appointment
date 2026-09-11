'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = 'http://localhost:3000/api/v1';

interface Appointment {
  id: string;
  status: string;
  isWalkIn: boolean;
  scheduledStart: string;
  scheduledEnd: string;
  reason: string | null;
  cancelReason: string | null;
  doctor: {
    id: string;
    name: string;
    specialization: string;
    consultationFee: string;
  };
  queueToken?: {
    tokenNumber: number;
  } | null;
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  // Cancel Modal
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAppointments = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login?redirect=/appointments';
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data);
      } else {
        setError(json.error?.message || 'Failed to load appointments');
      }
    } catch {
      setError('Unable to connect to hospital server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancelAppointment = async () => {
    if (!cancellingId || !cancelReason.trim()) return;
    const token = localStorage.getItem('accessToken');
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/appointments/${cancellingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (json.success) {
        setCancellingId(null);
        setCancelReason('');
        await loadAppointments();
      } else {
        alert(json.error?.message || 'Failed to cancel appointment');
      }
    } catch {
      alert('Unable to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  const isUpcoming = (status: string) => {
    return ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION'].includes(status);
  };

  const isPast = (status: string) => {
    return ['COMPLETED', 'NO_SHOW'].includes(status);
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === 'upcoming') return isUpcoming(appt.status);
    if (activeTab === 'past') return isPast(appt.status);
    if (activeTab === 'cancelled') return appt.status === 'CANCELLED';
    return true;
  });

  const upcomingCount = appointments.filter(a => isUpcoming(a.status)).length;
  const pastCount = appointments.filter(a => isPast(a.status)).length;
  const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'IN_CONSULTATION':
      case 'IN_QUEUE':
        return 'status-badge-active';
      case 'CONFIRMED':
      case 'BOOKED':
        return 'badge-primary';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  return (
    <main className="page-content">
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>My Appointments</h1>
            <p style={{ marginTop: '2px', fontSize: 'var(--font-size-sm)' }}>
              Manage your upcoming hospital visits, download calendar invites, and view clinical records.
            </p>
          </div>
          <Link href="/departments" className="btn btn-primary">
            + Book New Appointment
          </Link>
        </div>

        {error && (
          <div className="status-badge badge-danger" style={{ display: 'block', padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {/* Segmented Control Tabs */}
        <div className="segmented-tabs">
          <button
            className={`segmented-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span>Upcoming</span>
            <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', backgroundColor: activeTab === 'upcoming' ? 'var(--color-primary-100)' : 'var(--color-gray-200)', color: activeTab === 'upcoming' ? 'var(--color-primary-800)' : 'var(--color-gray-700)', fontWeight: 'bold' }}>
              {upcomingCount}
            </span>
          </button>
          <button
            className={`segmented-tab ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            <span>Past Visits</span>
            <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', backgroundColor: activeTab === 'past' ? 'var(--color-primary-100)' : 'var(--color-gray-200)', color: activeTab === 'past' ? 'var(--color-primary-800)' : 'var(--color-gray-700)', fontWeight: 'bold' }}>
              {pastCount}
            </span>
          </button>
          <button
            className={`segmented-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <span>Cancelled</span>
            <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', backgroundColor: activeTab === 'cancelled' ? 'var(--color-primary-100)' : 'var(--color-gray-200)', color: activeTab === 'cancelled' ? 'var(--color-primary-800)' : 'var(--color-gray-700)', fontWeight: 'bold' }}>
              {cancelledCount}
            </span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-2xl)' }} />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-16) var(--space-6)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--color-border)',
          }}>
            <p style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>📋</p>
            <h3 style={{ color: 'var(--color-gray-800)' }}>
              No {activeTab} appointments found
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
              {activeTab === 'upcoming' ? 'Browse our multi-specialty hospital departments to book your visit.' : 'Your appointment records will show up here.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link href="/departments" className="btn btn-primary" style={{ marginTop: 'var(--space-5)' }}>
                Find a Doctor
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {filteredAppointments.map((appt) => (
              <div key={appt.id} className="appointment-card">
                
                {/* Card Top: Doctor Info & Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      color: 'var(--color-primary-800)',
                      fontWeight: 'var(--font-weight-bold)',
                      flexShrink: 0,
                    }}>
                      {appt.doctor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900)' }}>
                        Dr. {appt.doctor.name}
                      </h3>
                      <p style={{ color: 'var(--color-primary-700)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        {appt.doctor.specialization}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                    {appt.queueToken && (
                      <Link
                        href={`/queue/${appt.id}`}
                        className="token-badge"
                        title="Click to track live queue status"
                      >
                        <span className="hero-pulse-dot" style={{ width: '6px', height: '6px' }} />
                        <span>Token #{appt.queueToken.tokenNumber}</span>
                      </Link>
                    )}

                    <span className={`status-badge ${getStatusBadgeClass(appt.status)}`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Date, Time, Fee Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gray-700)',
                }}>
                  <div>
                    <span style={{ color: 'var(--color-gray-500)' }}>Date</span>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', marginTop: '2px' }}>{formatDate(appt.scheduledStart)}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-gray-500)' }}>Time Slot</span>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', marginTop: '2px' }}>{formatTime(appt.scheduledStart)} - {formatTime(appt.scheduledEnd)}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-gray-500)' }}>Consultation Fee</span>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)', marginTop: '2px' }}>₹{appt.doctor.consultationFee}</div>
                  </div>
                </div>

                {appt.reason && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                    <strong>Reason for Visit:</strong> {appt.reason}
                  </p>
                )}

                {appt.cancelReason && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-600)' }}>
                    <strong>Cancellation Reason:</strong> {appt.cancelReason}
                  </p>
                )}

                {/* Card Bottom: Responsive Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--space-3)', alignItems: 'center' }}>
                  {isUpcoming(appt.status) && (
                    <>
                      {appt.queueToken && (
                        <Link
                          href={`/queue/${appt.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          🔴 Track Live Queue
                        </Link>
                      )}
                      <a
                        href={`http://localhost:3000/api/v1/calendar/appointment/${appt.id}/ics`}
                        className="btn btn-secondary btn-sm"
                        download
                      >
                        📅 Add to Calendar
                      </a>
                      <Link
                        href={`/doctors/${appt.doctor.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Reschedule
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger-600)', marginLeft: 'auto' }}
                        onClick={() => setCancellingId(appt.id)}
                      >
                        Cancel Visit
                      </button>
                    </>
                  )}

                  {appt.status === 'COMPLETED' && (
                    <>
                      <Link
                        href={`/prescriptions/${appt.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        📄 View Prescription & Notes
                      </Link>
                      <Link
                        href={`/receipts/${appt.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        🧾 Tax Receipt
                      </Link>
                      <Link
                        href={`/doctors/${appt.doctor.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 'auto' }}
                      >
                        Book Follow-up →
                      </Link>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        {cancellingId && (
          <div className="modal-backdrop" onClick={() => setCancellingId(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: 'var(--space-2)' }}>Cancel Appointment</h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginBottom: 'var(--space-4)' }}>
                Your time slot will be released immediately for other patients in need.
              </p>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label">Please tell us the reason for cancellation</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'vertical' }}
                  required
                  placeholder="e.g., Personal emergency, feeling better, scheduling conflict..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCancellingId(null)}
                  disabled={actionLoading}
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'var(--color-danger-600)', borderColor: 'var(--color-danger-600)' }}
                  onClick={handleCancelAppointment}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
