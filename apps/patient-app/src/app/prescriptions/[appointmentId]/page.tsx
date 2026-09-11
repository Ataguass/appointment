'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

const API_URL = 'http://localhost:3000/api/v1';

interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ConsultationData {
  appointmentId: string;
  scheduledStart: string;
  status: string;
  doctor: {
    name: string;
    specialization: string;
  };
  patient: {
    name: string;
    dateOfBirth: string | null;
    gender: string | null;
  };
  note: {
    diagnosis: string | null;
    prescription: string | null;
    notes: string | null;
    createdAt: string;
  } | null;
}

export default function PatientPrescriptionPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const [data, setData] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${API_URL}/consultations/appointment/${appointmentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          setData(resJson.data);
        } else {
          setError(resJson.error?.message || 'Prescription not found');
        }
      })
      .catch(() => setError('Unable to connect to hospital server'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-xl)' }} />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <Link href="/appointments" style={{ fontSize: 'var(--font-size-sm)' }}>← Back to appointments</Link>
          <div className="auth-alert auth-alert-error" style={{ marginTop: 'var(--space-4)' }}>
            {error || 'Prescription not found'}
          </div>
        </div>
      </main>
    );
  }

  // Parse structured prescription if JSON
  let medications: MedicineItem[] = [];
  if (data.note?.prescription) {
    try {
      medications = JSON.parse(data.note.prescription);
    } catch {
      // Not JSON, formatted text fallback
    }
  }

  return (
    <main className="page-content">
      <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <Link href="/appointments" style={{ fontSize: 'var(--font-size-sm)' }}>
            ← Back to my appointments
          </Link>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => window.print()}
          >
            🖨️ Print Prescription
          </button>
        </div>

        {/* Digital Prescription Paper Card */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '750px',
          margin: '0 auto',
        }}>
          {/* Hospital Letterhead Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--color-primary-600)',
            paddingBottom: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.75rem' }}>🏥</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)' }}>
                  HospitalFlow Clinic
                </span>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                Outpatient Department • Official Clinical Prescription
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900)' }}>
                Dr. {data.doctor.name}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-medium)' }}>
                {data.doctor.specialization}
              </div>
            </div>
          </div>

          {/* Patient Details Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--color-gray-50)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--font-size-sm)',
          }}>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Patient: </span>
              <strong>{data.patient.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Date: </span>
              <strong>{new Date(data.scheduledStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Status: </span>
              <strong style={{ color: 'var(--color-success-600)' }}>{data.status}</strong>
            </div>
          </div>

          {/* Clinical Diagnosis */}
          {data.note?.diagnosis && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Diagnosis
              </div>
              <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary-800)', marginTop: 'var(--space-1)' }}>
                {data.note.diagnosis}
              </div>
            </div>
          )}

          {/* Prescription (Rx) */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', marginBottom: 'var(--space-3)' }}>
              <span>℞</span>
              <span>Medications</span>
            </div>

            {medications.length > 0 ? (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '130px' }}>Medicine</th>
                      <th style={{ minWidth: '80px' }}>Dosage</th>
                      <th style={{ minWidth: '90px' }}>Frequency</th>
                      <th style={{ minWidth: '90px' }}>Duration</th>
                      <th style={{ minWidth: '140px' }}>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 'var(--font-weight-bold)' }}>{m.name}</td>
                        <td>{m.dosage}</td>
                        <td><span className="dept-tag">{m.frequency}</span></td>
                        <td>{m.duration}</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : data.note?.prescription ? (
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-gray-800)' }}>{data.note.prescription}</p>
            ) : (
              <p style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>No medications prescribed.</p>
            )}
          </div>

          {/* Doctor Advice / Notes */}
          {data.note?.notes && (
            <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-gray-200)', paddingTop: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                Advice & Follow-up Instructions
              </div>
              <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)', lineHeight: 'var(--line-height-relaxed)' }}>
                {data.note.notes}
              </p>
            </div>
          )}

          {/* Footer Signature */}
          <div style={{ marginTop: 'var(--space-12)', textAlign: 'right', borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
              Dr. {data.doctor.name}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              Digitally Verified Prescription • HospitalFlow
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
