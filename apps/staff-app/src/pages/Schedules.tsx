import { useState, useEffect } from 'react';
import { apiFetch, ApiError } from '../lib/api';

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface ScheduleItem {
  dayOfWeek: typeof DAYS_OF_WEEK[number];
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface BreakItem {
  id?: string;
  dayOfWeek: typeof DAYS_OF_WEEK[number];
  startTime: string;
  endTime: string;
  label?: string;
}

export default function SchedulesPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Schedules state for all 7 days
  const [schedules, setSchedules] = useState<Record<string, ScheduleItem>>({});
  // Breaks state
  const [breaks, setBreaks] = useState<BreakItem[]>([]);
  const [newBreak, setNewBreak] = useState<BreakItem>({
    dayOfWeek: 'MONDAY',
    startTime: '13:00',
    endTime: '14:00',
    label: 'Lunch Break',
  });

  // Load doctors on mount
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
        setMessage({
          type: 'error',
          text: err instanceof ApiError ? err.message : 'Failed to load doctors',
        });
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  // Load schedule and breaks when selected doctor changes
  useEffect(() => {
    if (!selectedDoctorId) return;

    async function loadDoctorData() {
      try {
        const [schedRes, breakRes] = await Promise.all([
          apiFetch<ScheduleItem[]>(`/scheduling/doctors/${selectedDoctorId}/schedules`),
          apiFetch<BreakItem[]>(`/scheduling/doctors/${selectedDoctorId}/breaks`),
        ]);

        // Map schedules to all 7 days with defaults
        const schedMap: Record<string, ScheduleItem> = {};
        for (const day of DAYS_OF_WEEK) {
          const found = schedRes.data.find((s) => s.dayOfWeek === day);
          schedMap[day] = found || {
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isActive: day !== 'SATURDAY' && day !== 'SUNDAY',
          };
        }
        setSchedules(schedMap);
        setBreaks(breakRes.data);
        setMessage(null);
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof ApiError ? err.message : 'Failed to load schedule data',
        });
      }
    }

    loadDoctorData();
  }, [selectedDoctorId]);

  const handleScheduleChange = (
    day: string,
    field: keyof ScheduleItem,
    value: string | boolean,
  ) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctorId) return;
    setSaving(true);
    setMessage(null);

    try {
      const schedulePayload = Object.values(schedules);
      await apiFetch(`/scheduling/doctors/${selectedDoctorId}/schedules`, {
        method: 'PUT',
        body: JSON.stringify({ schedules: schedulePayload }),
      });

      await apiFetch(`/scheduling/doctors/${selectedDoctorId}/breaks`, {
        method: 'PUT',
        body: JSON.stringify({ breaks }),
      });

      setMessage({ type: 'success', text: 'Schedule & Breaks saved successfully!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Failed to save schedule',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBreak = () => {
    if (!newBreak.startTime || !newBreak.endTime) return;
    setBreaks((prev) => [...prev, { ...newBreak }]);
  };

  const handleRemoveBreak = (index: number) => {
    setBreaks((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Doctor Schedules</h1>
          <p className="page-subtitle">Configure weekly working hours and breaks</p>
        </div>
        <div className="skeleton skeleton-card" style={{ height: '200px' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Doctor Schedules</h1>
          <p className="page-subtitle">Configure weekly working hours, consulting shifts, and breaks</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSaveSchedule}
          disabled={saving || !selectedDoctorId}
          id="save-schedule-btn"
        >
          {saving ? 'Saving...' : '💾 Save Schedule'}
        </button>
      </div>

      {message && (
        <div
          className={`login-alert ${message.type === 'error' ? 'login-alert-error' : 'login-alert-success'}`}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {message.text}
        </div>
      )}

      {/* Doctor Selector */}
      <div style={{ marginBottom: 'var(--space-6)', maxWidth: '350px' }}>
        <label className="form-label" htmlFor="doctor-select">Select Doctor</label>
        <select
          id="doctor-select"
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

      {/* Weekly Schedule Grid */}
      <div className="data-table-container" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-weight-semibold)', borderBottom: '1px solid var(--color-border)' }}>
          Weekly Working Hours
        </div>
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '70px' }}>Active</th>
                <th style={{ minWidth: '120px' }}>Day</th>
                <th style={{ minWidth: '120px' }}>Start Time</th>
                <th style={{ minWidth: '120px' }}>End Time</th>
              </tr>
            </thead>
          <tbody>
            {DAYS_OF_WEEK.map((day) => {
              const item = schedules[day];
              if (!item) return null;

              return (
                <tr key={day} style={{ opacity: item.isActive ? 1 : 0.5 }}>
                  <td style={{ width: '60px' }}>
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => handleScheduleChange(day, 'isActive', e.target.checked)}
                      style={{ accentColor: 'var(--color-primary-600)', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-input"
                      style={{ width: '130px', height: '36px' }}
                      value={item.startTime}
                      disabled={!item.isActive}
                      onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-input"
                      style={{ width: '130px', height: '36px' }}
                      value={item.endTime}
                      disabled={!item.isActive}
                      onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

      {/* Breaks Management Section */}
      <div className="data-table-container">
        <div style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-weight-semibold)', borderBottom: '1px solid var(--color-border)' }}>
          Consultation Breaks (e.g., Lunch, Tea)
        </div>

        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-gray-50)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div>
              <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Day</label>
              <select
                className="form-input"
                style={{ height: '36px' }}
                value={newBreak.dayOfWeek}
                onChange={(e) => setNewBreak({ ...newBreak, dayOfWeek: e.target.value as typeof DAYS_OF_WEEK[number] })}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>From</label>
              <input
                type="time"
                className="form-input"
                style={{ width: '120px', height: '36px' }}
                value={newBreak.startTime}
                onChange={(e) => setNewBreak({ ...newBreak, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>To</label>
              <input
                type="time"
                className="form-input"
                style={{ width: '120px', height: '36px' }}
                value={newBreak.endTime}
                onChange={(e) => setNewBreak({ ...newBreak, endTime: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Label</label>
              <input
                type="text"
                className="form-input"
                style={{ height: '36px', width: '150px' }}
                placeholder="Lunch break"
                value={newBreak.label || ''}
                onChange={(e) => setNewBreak({ ...newBreak, label: e.target.value })}
              />
            </div>
            <button type="button" className="btn btn-secondary btn-sm" style={{ height: '36px' }} onClick={handleAddBreak}>
              + Add Break
            </button>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '130px' }}>Day</th>
                <th style={{ minWidth: '100px' }}>Start Time</th>
                <th style={{ minWidth: '100px' }}>End Time</th>
                <th style={{ minWidth: '150px' }}>Label</th>
                <th style={{ minWidth: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {breaks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                    No break intervals configured. Doctor is available for the entire working shift.
                  </td>
                </tr>
              ) : (
                breaks.map((b, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      {b.dayOfWeek.charAt(0) + b.dayOfWeek.slice(1).toLowerCase()}
                    </td>
                    <td>{b.startTime}</td>
                    <td>{b.endTime}</td>
                    <td>{b.label || 'Break'}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger-600)' }}
                        onClick={() => handleRemoveBreak(idx)}
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
    </div>
  );
}
