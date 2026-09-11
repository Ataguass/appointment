import { useState, useEffect } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface QueuePatient {
  id: string;
  patient: {
    id: string;
    name: string;
    user: {
      phone: string;
    };
  };
  queueToken: {
    tokenNumber: number;
  };
  positionInQueue: number;
  estimatedWaitMinutes: number;
  scheduledStart: string;
}

interface DoctorQueueState {
  doctor: {
    id: string;
    name: string;
    specialization: string;
    slotDurationMins: number;
  };
  inConsultation: QueuePatient | null;
  waitingQueue: QueuePatient[];
  completedCount: number;
  noShowCount: number;
  totalQueueCount: number;
}

export default function QueuePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queueState, setQueueState] = useState<DoctorQueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Load active doctors
  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoading(true);
        const res = await apiFetch<Doctor[]>('/doctors?active=true');
        setDoctors(res.data);
        if (res.data.length > 0) {
          setSelectedDoctorId(res.data[0].id);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  // Poll doctor queue state
  useEffect(() => {
    if (!selectedDoctorId) return;

    async function loadQueue() {
      try {
        const res = await apiFetch<DoctorQueueState>(`/queue/doctors/${selectedDoctorId}`);
        setQueueState(res.data);
      } catch (err) {
        // Silent retry
      }
    }

    loadQueue();
    const interval = setInterval(loadQueue, 2500); // 2.5s live polling sync
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  const handleCallNext = async () => {
    if (!selectedDoctorId) return;
    setActionLoading(true);
    setError('');

    try {
      const res = await apiFetch<{ calledPatient: QueuePatient | null; queue: DoctorQueueState }>(
        `/queue/doctors/${selectedDoctorId}/next`,
        { method: 'POST' },
      );

      setQueueState(res.data.queue);
      if (res.data.calledPatient) {
        setNotification(`Called Token #${res.data.calledPatient.queueToken?.tokenNumber}: ${res.data.calledPatient.patient?.name}`);
      } else {
        setNotification('No more patients waiting in queue.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to advance queue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (appointmentId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/queue/appointments/${appointmentId}/skip`, { method: 'POST' });
      // Refresh
      const res = await apiFetch<DoctorQueueState>(`/queue/doctors/${selectedDoctorId}`);
      setQueueState(res.data);
      setNotification('Patient marked as No-Show.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to skip patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnounceDelay = async () => {
    if (!selectedDoctorId) return;
    try {
      await apiFetch('/queue/delay', {
        method: 'POST',
        body: JSON.stringify({ doctorId: selectedDoctorId, delayMinutes: 15, reason: 'Doctor attending emergency case' }),
      });
      alert('15-minute delay announcement broadcasted to waiting room and patients!');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to broadcast delay');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">OPD Queue Workspace</h1>
          <p className="page-subtitle">Live consultation management and token calling</p>
        </div>
        <div className="skeleton skeleton-card" style={{ height: '250px' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">OPD Queue Workspace</h1>
          <p className="page-subtitle">Live consultation desk, token calling, and wait-time management</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleAnnounceDelay}>
            📢 Announce 15m Delay
          </button>
        </div>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {notification && (
        <div className="login-alert login-alert-success" style={{ marginBottom: 'var(--space-4)' }}>
          {notification}
        </div>
      )}

      {/* Doctor Selector */}
      <div style={{ marginBottom: 'var(--space-6)', maxWidth: '350px' }}>
        <label className="form-label" htmlFor="queue-doc-select">Select Doctor Queue</label>
        <select
          id="queue-doc-select"
          className="form-input"
          value={selectedDoctorId}
          onChange={(e) => {
            setSelectedDoctorId(e.target.value);
            setNotification(null);
          }}
        >
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} ({doc.specialization})
            </option>
          ))}
        </select>
      </div>

      {/* Main Queue Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Active Consultation Card */}
        <div className="stat-card" style={{ border: '2px solid var(--color-primary-500)', backgroundColor: 'var(--color-primary-50)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Consultation
          </div>

          {queueState?.inConsultation ? (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-800)' }}>
                  #{queueState.inConsultation.queueToken.tokenNumber}
                </span>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>
                  {queueState.inConsultation.patient.name}
                </span>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                Phone: {queueState.inConsultation.patient.user.phone}
              </div>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-4) 0', color: 'var(--color-text-tertiary)' }}>
              No patient currently inside consultation room.
            </div>
          )}

          <div style={{ marginTop: 'var(--space-6)' }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}
              disabled={actionLoading || queueState?.waitingQueue.length === 0}
              onClick={handleCallNext}
              id="call-next-token-btn"
            >
              {actionLoading ? 'Advancing...' : '🔔 Call Next Patient'}
            </button>
          </div>
        </div>

        {/* Queue Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="stat-card">
            <div className="stat-label">Waiting in Queue</div>
            <div className="stat-value" style={{ color: 'var(--color-primary-600)' }}>
              {queueState?.waitingQueue.length ?? 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Consultations Done</div>
            <div className="stat-value" style={{ color: 'var(--color-success-600)' }}>
              {queueState?.completedCount ?? 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">No-Shows / Skipped</div>
            <div className="stat-value" style={{ color: 'var(--color-danger-600)' }}>
              {queueState?.noShowCount ?? 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Today</div>
            <div className="stat-value">
              {queueState?.totalQueueCount ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Waiting Queue Table */}
      <div className="data-table-container">
        <div style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-weight-semibold)', borderBottom: '1px solid var(--color-border)' }}>
          Patients in Waiting Line ({queueState?.waitingQueue.length ?? 0})
        </div>

        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '120px' }}>Queue Position</th>
                <th style={{ minWidth: '90px' }}>Token #</th>
                <th style={{ minWidth: '140px' }}>Patient Name</th>
                <th style={{ minWidth: '110px' }}>Phone</th>
                <th style={{ minWidth: '100px' }}>Est. Wait</th>
                <th style={{ minWidth: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {!queueState || queueState.waitingQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-tertiary)' }}>
                    Queue is empty! All checked-in patients have been served.
                  </td>
                </tr>
              ) : (
                queueState.waitingQueue.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)' }}>
                      #{item.positionInQueue}
                    </td>
                    <td>
                      <span className="token-badge">
                        #{item.queueToken.tokenNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      {item.patient.name}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                      {item.patient.user.phone}
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        ~{item.estimatedWaitMinutes} mins
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger-600)' }}
                        onClick={() => handleSkip(item.id)}
                      >
                        Skip No-Show
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
