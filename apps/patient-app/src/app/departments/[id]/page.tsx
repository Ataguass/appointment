'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

const API_URL = 'http://localhost:3000/api/v1';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  consultationFee: string;
  slotDurationMins: number;
  photoUrl: string | null;
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  doctors: { doctor: Doctor }[];
}

export default function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/departments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDepartment(data.data);
        } else {
          setError('Department not found');
        }
      })
      .catch(() => setError('Unable to connect to hospital server'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
          <div className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)' }} />
          <div className="grid-responsive-cards">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-xl)' }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !department) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
          <Link href="/departments" style={{ fontSize: 'var(--font-size-sm)' }}>← Back to departments</Link>
          <div className="status-badge badge-danger" style={{ display: 'block', padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            {error || 'Department not found'}
          </div>
        </div>
      </main>
    );
  }

  const activeDoctors = department.doctors.filter((d) => d.doctor.isActive);

  return (
    <main className="page-content">
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        <Link href="/departments" style={{ fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
          ← Back to all departments
        </Link>

        {/* Department Banner */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 'var(--space-8)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>{department.name}</h1>
              {department.description && (
                <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', maxWidth: '600px', color: 'var(--color-gray-600)' }}>
                  {department.description}
                </p>
              )}
            </div>
            <span className="dept-tag" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-1) var(--space-3)' }}>
              {activeDoctors.length} {activeDoctors.length === 1 ? 'Doctor Available' : 'Doctors Available'}
            </span>
          </div>
        </div>

        {activeDoctors.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-16) var(--space-6)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-gray-500)',
          }}>
            <p style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>👨‍⚕️</p>
            <h3>No doctors currently assigned</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
              Please check back later or explore other clinical departments.
            </p>
          </div>
        ) : (
          <div className="grid-responsive-cards">
            {activeDoctors.map(({ doctor }) => (
              <div key={doctor.id} className="feature-card">
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <div style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: 'var(--color-primary-800)',
                    fontWeight: 'var(--font-weight-bold)',
                    flexShrink: 0,
                  }}>
                    {doctor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900)' }}>
                      Dr. {doctor.name}
                    </h3>
                    <p style={{ color: 'var(--color-primary-700)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                      {doctor.specialization}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-xs)',
                  marginBottom: 'var(--space-4)',
                }}>
                  <div>
                    <span style={{ color: 'var(--color-gray-500)' }}>Fee</span>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)', fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
                      ₹{doctor.consultationFee}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-gray-500)' }}>Slot Duration</span>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)', fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
                      {doctor.slotDurationMins}m
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Check Available Slots →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
