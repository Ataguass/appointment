import { useState, useEffect, type FormEvent } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  consultationFee: string;
}

interface WalkInResult {
  id: string;
  tokenNumber: number;
  doctor: {
    name: string;
    specialization: string;
  };
  patient: {
    name: string;
  };
  scheduledStart: string;
}

export default function WalkInPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<WalkInResult | null>(null);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !patientName || !patientPhone) return;

    setSubmitting(true);
    setError('');
    setSuccessResult(null);

    try {
      const res = await apiFetch<WalkInResult>('/appointments/walk-in', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          patientName,
          patientPhone,
          patientEmail: patientEmail || undefined,
          reason: reason || undefined,
        }),
      });

      setSuccessResult(res.data);
      // Reset form fields
      setPatientName('');
      setPatientPhone('');
      setPatientEmail('');
      setReason('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to register walk-in patient');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Walk-in Registration</h1>
          <p className="page-subtitle">Instant queue token generation for walk-in OPD patients</p>
        </div>
        <div className="skeleton skeleton-card" style={{ height: '200px' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Walk-in Registration</h1>
        <p className="page-subtitle">Instant OPD check-in and queue token generation for walk-in patients</p>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Success Token Receipt Banner */}
      {successResult && (
        <div style={{
          backgroundColor: 'var(--color-primary-50)',
          border: '2px solid var(--color-primary-500)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
          textAlign: 'center',
          animation: 'slide-up 0.2s ease',
        }}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Queue Token Issued Successfully
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-800)', margin: 'var(--space-2) 0' }}>
            #{successResult.tokenNumber}
          </div>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>
            {successResult.patient.name}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Consulting with: <strong>{successResult.doctor.name}</strong> ({successResult.doctor.specialization})
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSuccessResult(null)}
            >
              + Register Next Patient
            </button>
          </div>
        </div>
      )}

      {/* Registration Form Card */}
      <div className="data-table-container" style={{ maxWidth: '600px', padding: 'var(--space-8)' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="walkin-doc">Select Doctor</label>
            <select
              id="walkin-doc"
              className="form-input"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialization}) — Fee: ₹{doc.consultationFee}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid" style={{ marginTop: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="patient-name">Patient Full Name</label>
              <input
                id="patient-name"
                className="form-input"
                required
                placeholder="e.g., Rajesh Kumar"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="patient-phone">Phone Number</label>
              <input
                id="patient-phone"
                className="form-input"
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label" htmlFor="patient-email">Email (optional)</label>
            <input
              id="patient-email"
              className="form-input"
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label" htmlFor="walkin-reason">Reason for Visit (optional)</label>
            <input
              id="walkin-reason"
              className="form-input"
              placeholder="e.g., Acute stomach ache, General checkup"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {selectedDoctor && (
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
              💳 Consultation Fee: <strong>₹{selectedDoctor.consultationFee}</strong> (Unpaid - Collect at counter)
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              id="submit-walkin-btn"
            >
              {submitting ? 'Issuing Token...' : '🎫 Issue Queue Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
