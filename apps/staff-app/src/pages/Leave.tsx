import { useState, useEffect, type FormEvent } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface LeaveItem {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

interface HolidayItem {
  id: string;
  date: string;
  name: string;
  description: string | null;
}

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState<'leaves' | 'holidays'>('leaves');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);

  // Load initial doctors & holidays
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [docRes, holRes] = await Promise.all([
          apiFetch<Doctor[]>('/doctors?active=true'),
          apiFetch<HolidayItem[]>('/scheduling/holidays'),
        ]);
        setDoctors(docRes.data);
        setHolidays(holRes.data);
        if (docRes.data.length > 0) {
          setSelectedDoctorId(docRes.data[0].id);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Load doctor leaves when selected doctor changes
  useEffect(() => {
    if (!selectedDoctorId) return;

    async function loadLeaves() {
      try {
        const res = await apiFetch<LeaveItem[]>(`/scheduling/doctors/${selectedDoctorId}/leaves`);
        setLeaves(res.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load leaves');
      }
    }

    loadLeaves();
  }, [selectedDoctorId]);

  const handleCreateLeave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return;
    setSaving(true);
    setError('');

    try {
      await apiFetch(`/scheduling/doctors/${selectedDoctorId}/leaves`, {
        method: 'POST',
        body: JSON.stringify(leaveForm),
      });
      setShowLeaveModal(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      // Refresh leaves
      const res = await apiFetch<LeaveItem[]>(`/scheduling/doctors/${selectedDoctorId}/leaves`);
      setLeaves(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to apply leave');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave?')) return;
    try {
      await apiFetch(`/scheduling/leaves/${id}`, { method: 'DELETE' });
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete leave');
    }
  };

  const handleCreateHoliday = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiFetch('/scheduling/holidays', {
        method: 'POST',
        body: JSON.stringify(holidayForm),
      });
      setShowHolidayModal(false);
      setHolidayForm({ date: '', name: '', description: '' });
      const res = await apiFetch<HolidayItem[]>('/scheduling/holidays');
      setHolidays(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to remove this hospital holiday?')) return;
    try {
      await apiFetch(`/scheduling/holidays/${id}`, { method: 'DELETE' });
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete holiday');
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Leave & Holidays</h1>
          <p className="page-subtitle">Manage doctor absence and hospital non-consulting days</p>
        </div>
        <div className="skeleton skeleton-card" style={{ height: '180px' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Leave & Holidays</h1>
          <p className="page-subtitle">Manage doctor leaves and hospital-wide non-consulting holidays</p>
        </div>
        <div>
          {activeTab === 'leaves' ? (
            <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)} id="add-leave-btn">
              + Apply Doctor Leave
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowHolidayModal(true)} id="add-holiday-btn">
              + Add Hospital Holiday
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
        <button
          className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
          onClick={() => setActiveTab('leaves')}
        >
          🏖️ Doctor Leaves
        </button>
        <button
          className={`btn ${activeTab === 'holidays' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
          onClick={() => setActiveTab('holidays')}
        >
          🎉 Hospital Holidays
        </button>
      </div>

      {/* Leaves Tab Content */}
      {activeTab === 'leaves' && (
        <>
          <div style={{ marginBottom: 'var(--space-6)', maxWidth: '350px' }}>
            <label className="form-label" htmlFor="leave-doc-select">Doctor</label>
            <select
              id="leave-doc-select"
              className="form-input"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="data-table-container">
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '130px' }}>Start Date</th>
                    <th style={{ minWidth: '130px' }}>End Date</th>
                    <th style={{ minWidth: '160px' }}>Reason</th>
                    <th style={{ minWidth: '90px' }}>Actions</th>
                  </tr>
                </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                      No leaves on record for this doctor.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{formatDate(l.startDate)}</td>
                      <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{formatDate(l.endDate)}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{l.reason || 'Personal'}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger-600)' }}
                          onClick={() => handleDeleteLeave(l.id)}
                        >
                          Cancel Leave
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Holidays Tab Content */}
      {activeTab === 'holidays' && (
        <div className="data-table-container">
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '130px' }}>Holiday Date</th>
                  <th style={{ minWidth: '160px' }}>Name</th>
                  <th style={{ minWidth: '200px' }}>Description</th>
                  <th style={{ minWidth: '90px' }}>Actions</th>
                </tr>
              </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                    No hospital holidays defined.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{formatDate(h.date)}</td>
                    <td>{h.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{h.description || '—'}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger-600)' }}
                        onClick={() => handleDeleteHoliday(h.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="modal-backdrop" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Apply Doctor Leave</h2>
            <form onSubmit={handleCreateLeave}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Reason (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Medical Conference, Annual Leave"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Applying...' : 'Apply Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <div className="modal-backdrop" onClick={() => setShowHolidayModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Add Hospital Holiday</h2>
            <form onSubmit={handleCreateHoliday}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Holiday Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Diwali, Republic Day, New Year"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Description (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="OPD closed for national holiday"
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowHolidayModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
