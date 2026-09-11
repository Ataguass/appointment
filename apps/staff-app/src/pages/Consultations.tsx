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
  scheduledStart: string;
  reason: string | null;
  patient: {
    id: string;
    name: string;
    user: {
      phone: string;
    };
  };
  queueToken?: {
    tokenNumber: number;
  } | null;
}

interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PatientPastVisit {
  appointmentId: string;
  date: string;
  doctor: {
    name: string;
    specialization: string;
  };
  reason: string | null;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
}

export default function ConsultationsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medications, setMedications] = useState<MedicineItem[]>([
    { name: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' },
  ]);

  // Past History
  const [activeTab, setActiveTab] = useState<'rx' | 'history'>('rx');
  const [patientHistory, setPatientHistory] = useState<PatientPastVisit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
        setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to load doctors' });
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  // Load today's queue/appointments for selected doctor
  useEffect(() => {
    if (!selectedDoctorId) return;

    async function loadAppointments() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await apiFetch<Appointment[]>(`/appointments?doctorId=${selectedDoctorId}&date=${todayStr}`);
        setAppointments(res.data);

        // Auto-select patient in consultation or first in queue
        const inConsult = res.data.find((a) => a.status === 'IN_CONSULTATION');
        const firstInQueue = res.data.find((a) => a.status === 'IN_QUEUE');
        const target = inConsult || firstInQueue || res.data[0];

        if (target) {
          setSelectedApptId(target.id);
        } else {
          setSelectedApptId('');
        }
      } catch {
        // Silent retry
      }
    }

    loadAppointments();
  }, [selectedDoctorId]);

  // Load patient past history when selected appointment changes
  const selectedAppt = appointments.find((a) => a.id === selectedApptId);

  useEffect(() => {
    if (!selectedAppt?.patient?.id) return;

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        const res = await apiFetch<{ history: PatientPastVisit[] }>(
          `/consultations/patient/${selectedAppt?.patient?.id}/history`,
        );
        setPatientHistory(res.data.history);
      } catch {
        // Silent
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [selectedAppt?.patient?.id]);

  const handleAddMedicine = () => {
    setMedications((prev) => [
      ...prev,
      { name: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof MedicineItem, value: string) => {
    setMedications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveConsultation = async () => {
    if (!selectedApptId) return;
    setSaving(true);
    setMessage(null);

    try {
      const activeMedications = medications.filter((m) => m.name.trim().length > 0);
      const prescriptionJson = activeMedications.length > 0 ? JSON.stringify(activeMedications) : undefined;

      await apiFetch('/consultations', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: selectedApptId,
          diagnosis: diagnosis || undefined,
          notes: clinicalNotes || undefined,
          prescription: prescriptionJson,
          completeAppointment: true,
        }),
      });

      setMessage({ type: 'success', text: 'Consultation completed and prescription saved successfully!' });
      // Reset form
      setDiagnosis('');
      setClinicalNotes('');
      setMedications([{ name: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' }]);

      // Refresh appointments
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await apiFetch<Appointment[]>(`/appointments?doctorId=${selectedDoctorId}&date=${todayStr}`);
      setAppointments(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to save consultation' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Doctor Consultation Desk</h1>
        </div>
        <div className="skeleton skeleton-card" style={{ height: '300px' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header consultation-sticky-bar">
        <div>
          <h1 className="page-title">Doctor Consultation Desk</h1>
          <p className="page-subtitle">Clinical examination notes, digital prescriptions, and medical history</p>
        </div>
        {selectedAppt && (
          <button
            className="btn btn-primary"
            style={{ backgroundColor: 'var(--color-success-600)' }}
            disabled={saving}
            onClick={handleSaveConsultation}
            id="save-consultation-btn"
          >
            {saving ? 'Saving...' : '✓ Complete Consultation'}
          </button>
        )}
      </div>

      {message && (
        <div
          className={`login-alert ${message.type === 'error' ? 'login-alert-error' : 'login-alert-success'}`}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {message.text}
        </div>
      )}

      {/* Doctor & Patient Selector Bar */}
      <div className="data-table-container" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', backgroundColor: 'var(--color-gray-50)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Doctor</label>
            <select
              className="form-input"
              style={{ height: '36px', minWidth: '200px' }}
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Consulting Patient</label>
            <select
              className="form-input"
              style={{ height: '36px', minWidth: '260px' }}
              value={selectedApptId}
              onChange={(e) => setSelectedApptId(e.target.value)}
            >
              {appointments.length === 0 ? (
                <option value="">No patients scheduled today</option>
              ) : (
                appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.queueToken ? `Token #${a.queueToken.tokenNumber} — ` : ''}{a.patient.name} ({a.status})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {!selectedAppt ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-16)',
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-tertiary)',
        }}>
          Please select a patient from today's schedule above to begin consultation.
        </div>
      ) : (
        <div>
          {/* Active Patient Summary Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            padding: 'var(--space-4) var(--space-6)',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-6)',
          }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                {selectedAppt.patient.name}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Phone: {selectedAppt.patient.user.phone} • Chief Complaint: <strong>{selectedAppt.reason || 'General Consultation'}</strong>
              </div>
            </div>
            <div>
              {selectedAppt.queueToken && (
                <span className="token-badge" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-4)' }}>
                  Token #{selectedAppt.queueToken.tokenNumber}
                </span>
              )}
            </div>
          </div>

          {/* Tab Selection: Rx vs Patient History */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
            <button
              className={`btn ${activeTab === 'rx' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('rx')}
            >
              📝 Clinical Note & Prescription
            </button>
            <button
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('history')}
            >
              📚 Medical History ({patientHistory.length} visits)
            </button>
          </div>

          {/* Rx Tab Content */}
          {activeTab === 'rx' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Diagnosis */}
              <div className="data-table-container" style={{ padding: 'var(--space-6)' }}>
                <label className="form-label" style={{ fontWeight: 'var(--font-weight-bold)' }}>Clinical Diagnosis</label>
                <input
                  className="form-input"
                  placeholder="e.g., Acute Viral Bronchitis, Essential Hypertension"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Prescription Medications Builder */}
              <div className="data-table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Prescription (Rx)</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddMedicine}>
                    + Add Medication
                  </button>
                </div>

                <div className="table-responsive-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '160px' }}>Medicine Name</th>
                        <th style={{ minWidth: '90px' }}>Dosage</th>
                        <th style={{ minWidth: '110px' }}>Frequency</th>
                        <th style={{ minWidth: '90px' }}>Duration</th>
                        <th style={{ minWidth: '160px' }}>Instructions</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {medications.map((med, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              style={{ height: '36px' }}
                              placeholder="e.g., Paracetamol"
                              value={med.name}
                              onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              style={{ height: '36px', width: '90px' }}
                              placeholder="650mg"
                              value={med.dosage}
                              onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="form-input"
                              style={{ height: '36px', width: '100px' }}
                              value={med.frequency}
                              onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                            >
                              <option value="1-0-1">1-0-1</option>
                              <option value="1-0-0">1-0-0</option>
                              <option value="0-1-0">0-1-0</option>
                              <option value="0-0-1">0-0-1</option>
                              <option value="1-1-1">1-1-1</option>
                              <option value="SOS">SOS (As needed)</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              style={{ height: '36px', width: '90px' }}
                              placeholder="5 days"
                              value={med.duration}
                              onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              style={{ height: '36px' }}
                              placeholder="After meals"
                              value={med.instructions}
                              onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                            />
                          </td>
                          <td>
                            {medications.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--color-danger-600)' }}
                                onClick={() => handleRemoveMedicine(idx)}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctor Advice & Clinical Notes */}
              <div className="data-table-container" style={{ padding: 'var(--space-6)' }}>
                <label className="form-label" style={{ fontWeight: 'var(--font-weight-bold)' }}>Doctor Advice / Follow-up Notes</label>
                <textarea
                  className="form-input"
                  style={{ width: '100%', height: '90px', resize: 'vertical' }}
                  placeholder="e.g., Drink plenty of fluids, rest for 3 days. Follow up after 5 days if fever persists."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Medical History Tab Content */}
          {activeTab === 'history' && (
            <div className="data-table-container" style={{ padding: 'var(--space-6)' }}>
              {historyLoading ? (
                <div className="skeleton skeleton-card" style={{ height: '150px' }} />
              ) : patientHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-tertiary)' }}>
                  No prior consultation records found for this patient.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {patientHistory.map((h, i) => (
                    <div key={i} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-gray-50)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>
                            {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — Dr. {h.doctor.name} ({h.doctor.specialization})
                          </div>
                          {h.diagnosis && (
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-700)', marginTop: 'var(--space-1)', fontWeight: 'var(--font-weight-medium)' }}>
                              Diagnosis: {h.diagnosis}
                            </div>
                          )}
                        </div>
                      </div>

                      {h.notes && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                          Notes: {h.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
