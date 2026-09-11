'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = 'http://localhost:3000/api/v1';

interface Department {
  id: string;
  name: string;
  description: string | null;
  _count: { doctors: number };
}

const deptIcons: Record<string, string> = {
  Cardiology: '❤️',
  Pediatrics: '👶',
  Orthopedics: '🦴',
  Dermatology: '🔬',
  'General Medicine': '🩺',
  Neurology: '🧠',
  ENT: '👂',
  Ophthalmology: '👁️',
  Gynecology: '🌸',
  Dental: '🦷',
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/departments?active=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDepartments(data.data);
        } else {
          setError('Failed to load departments');
        }
      })
      .catch(() => setError('Unable to connect to hospital server'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="page-content">
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        
        {/* Header with Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>Hospital Clinical Specialties</h1>
            <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-sm)', maxWidth: '540px' }}>
              Select a specialized outpatient department to view doctor credentials, consultation fees, and available appointment slots.
            </p>
          </div>

          <div style={{ minWidth: '260px', width: 'clamp(260px, 30vw, 360px)' }}>
            <input
              type="search"
              className="form-input"
              style={{ width: '100%' }}
              placeholder="🔍 Search specialties or symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="status-badge badge-danger" style={{ display: 'block', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid-responsive-cards">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-xl)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-gray-500)',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🔍</p>
            <h3>No departments matching "{search}"</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>Try searching for a different specialty.</p>
          </div>
        ) : (
          <div className="grid-responsive-cards">
            {filtered.map((dept) => (
              <Link
                key={dept.id}
                href={`/departments/${dept.id}`}
                className="feature-card"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div className="feature-icon-box" style={{ width: '2.75rem', height: '2.75rem', fontSize: '1.35rem', marginBottom: 0 }}>
                    {deptIcons[dept.name] || '🏥'}
                  </div>
                  <span className="dept-tag">
                    {dept._count.doctors} {dept._count.doctors === 1 ? 'Specialist' : 'Specialists'}
                  </span>
                </div>

                <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-900)' }}>
                  {dept.name}
                </h3>
                
                {dept.description && (
                  <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', flex: 1, color: 'var(--color-gray-600)' }}>
                    {dept.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary-700)' }}>
                  <span>View Doctors &amp; Slots</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
