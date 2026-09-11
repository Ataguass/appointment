import { useState, useEffect } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

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
  patient: {
    id: string;
    name: string;
    user: {
      phone: string;
      email: string;
    };
  };
  queueToken?: {
    tokenNumber: number;
  } | null;
  payment?: {
    status: string;
    amount: string;
  } | null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedDate) queryParams.set('date', selectedDate);
      if (selectedDoctorId) queryParams.set('doctorId', selectedDoctorId);
      if (selectedStatus) queryParams.set('status', selectedStatus);

      const [apptsRes, docsRes] = await Promise.all([
        apiFetch<Appointment[]>(`/appointments?${queryParams.toString()}`),
        apiFetch<Doctor[]>('/doctors?active=true'),
      ]);

      setAppointments(apptsRes.data);
      setDoctors(docsRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedDoctorId, selectedStatus]);

  const handleCheckIn = async (id: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/appointments/${id}/check-in`, { method: 'POST' });
      await loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to check in patient');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
      case 'CONFIRMED':
        return <span className="status-badge" style={{ backgroundColor: 'var(--color-info-50)', color: 'var(--color-info-600)' }}>Booked</span>;
      case 'CHECKED_IN':
        return <span className="status-badge" style={{ backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-600)' }}>Checked In</span>;
      case 'IN_QUEUE':
        return <span className="status-badge" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}>In Queue</span>;
      case 'IN_CONSULTATION':
        return <span className="status-badge" style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-900)' }}>In Consultation</span>;
      case 'COMPLETED':
        return <span className="status-badge status-badge-active">Completed</span>;
      case 'CANCELLED':
        return <span className="status-badge" style={{ backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>Cancelled</span>;
      default:
        return <span className="status-badge status-badge-inactive">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Master schedule, patient check-ins, and consultation tracking</p>
        </div>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="data-table-container" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', backgroundColor: 'var(--color-gray-50)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Date</label>
            <input
              type="date"
              className="form-input"
              style={{ height: '36px' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Doctor</label>
            <select
              className="form-input"
              style={{ height: '36px', minWidth: '180px' }}
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Status</label>
            <select
              className="form-input"
              style={{ height: '36px', minWidth: '140px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="IN_QUEUE">In Queue</option>
              <option value="IN_CONSULTATION">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 'auto', height: '36px' }}
            onClick={() => {
              setSelectedDate(todayStr);
              setSelectedDoctorId('');
              setSelectedStatus('');
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="data-table-container">
        {loading ? (
          <div style={{ padding: 'var(--space-8)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" style={{ height: '50px', marginBottom: '8px' }} />
            ))}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '120px' }}>Time / Token</th>
                  <th style={{ minWidth: '140px' }}>Patient</th>
                  <th style={{ minWidth: '130px' }}>Doctor</th>
                  <th style={{ minWidth: '90px' }}>Type</th>
                  <th style={{ minWidth: '110px' }}>Status</th>
                  <th style={{ minWidth: '100px' }}>Payment</th>
                  <th style={{ minWidth: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-tertiary)' }}>
                      No appointments found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                          {formatTime(appt.scheduledStart)}
                        </div>
                        {appt.queueToken && (
                          <span className="dept-tag" style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-800)' }}>
                            Token #{appt.queueToken.tokenNumber}
                          </span>
                        )}
                      </td>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{appt.patient.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {appt.patient.user.phone}
                      </div>
                    </td>
                    <td>
                      <div>{appt.doctor.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {appt.doctor.specialization}
                      </div>
                    </td>
                    <td>
                      {appt.isWalkIn ? (
                        <span className="dept-tag" style={{ backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-600)' }}>
                          Walk-in
                        </span>
                      ) : (
                        <span className="dept-tag">Scheduled</span>
                      )}
                    </td>
                    <td>{getStatusBadge(appt.status)}</td>
                    <td>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        ₹{appt.doctor.consultationFee} ({appt.payment?.status || 'UNPAID'})
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {appt.status === 'BOOKED' && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading === appt.id}
                            onClick={() => handleCheckIn(appt.id)}
                          >
                            Check In
                          </button>
                        )}
                        {appt.status === 'IN_QUEUE' && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading === appt.id}
                            onClick={() => handleUpdateStatus(appt.id, 'IN_CONSULTATION')}
                          >
                            Call In
                          </button>
                        )}
                        {appt.status === 'IN_CONSULTATION' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: 'var(--color-success-600)' }}
                            disabled={actionLoading === appt.id}
                            onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
