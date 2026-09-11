'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

const API_URL = 'http://localhost:3000/api/v1';

interface LiveQueueData {
  appointmentId: string;
  hasToken: boolean;
  myToken?: number;
  doctor?: {
    name: string;
    specialization: string;
  };
  status?: string;
  currentTokenBeingSeen?: number | null;
  tokensAhead?: number;
  estimatedWaitMinutes?: number;
  isCurrentlyServing?: boolean;
  isCompleted?: boolean;
  isSkipped?: boolean;
  message?: string;
}

export default function PatientLiveQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [queueData, setQueueData] = useState<LiveQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLiveQueue = async () => {
    try {
      const res = await fetch(`${API_URL}/queue/live/${id}`);
      const json = await res.json();
      if (json.success) {
        setQueueData(json.data);
      } else {
        setError(json.error?.message || 'Failed to load queue status');
      }
    } catch {
      setError('Unable to connect to hospital queue server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveQueue();
    const interval = setInterval(fetchLiveQueue, 2500); // 2.5s live polling sync
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="skeleton" style={{ height: '380px', borderRadius: 'var(--radius-2xl)' }} />
        </div>
      </main>
    );
  }

  if (error || !queueData) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <Link href="/appointments" style={{ fontSize: 'var(--font-size-sm)' }}>← Back to appointments</Link>
          <div className="status-badge badge-danger" style={{ display: 'block', padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            {error || 'Queue status not found'}
          </div>
        </div>
      </main>
    );
  }

  if (!queueData.hasToken) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <Link href="/appointments" style={{ fontSize: 'var(--font-size-sm)' }}>← Back to appointments</Link>
          <div style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-10) var(--space-6)',
            backgroundColor: 'var(--color-warning-50)',
            borderRadius: 'var(--radius-2xl)',
            border: '1.5px solid var(--color-warning-500)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '2.5rem' }}>🏥</p>
            <h2 style={{ color: 'var(--color-warning-600)', margin: 'var(--space-2) 0' }}>Check-In Required</h2>
            <p style={{ color: 'var(--color-gray-600)', maxWidth: '480px', margin: '0 auto', fontSize: 'var(--font-size-sm)' }}>
              {queueData.message || 'Please check in at the reception desk upon arriving at the hospital to receive your OPD token.'}
            </p>
            <Link href="/appointments" className="btn btn-secondary" style={{ marginTop: 'var(--space-5)' }}>
              View Appointment Details
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content">
      <div className="container" style={{ paddingTop: 'var(--space-6)', maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <Link href="/appointments" style={{ fontSize: 'var(--font-size-sm)' }}>
            ← Back to my appointments
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-success-700)', fontWeight: 'var(--font-weight-medium)' }}>
            <span className="hero-pulse-dot" />
            <span>Live Stream Connected</span>
          </div>
        </div>

        {/* Live Queue Card */}
        <div style={{
          backgroundColor: queueData.isCurrentlyServing ? 'var(--color-success-50)' : 'var(--color-white)',
          border: `2px solid ${queueData.isCurrentlyServing ? 'var(--color-success-500)' : 'var(--color-primary-200)'}`,
          borderRadius: 'var(--radius-2xl)',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          boxShadow: 'var(--shadow-xl)',
          textAlign: 'center',
          transition: 'all var(--transition-normal)',
        }}>
          {queueData.isCurrentlyServing ? (
            <div>
              <span style={{ fontSize: '3rem' }}>🔔</span>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success-700)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-2)' }}>
                It's Your Turn! Please proceed inside
              </div>
              <div style={{ fontSize: 'clamp(4rem, 12vw, 6rem)', fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-success-600)', margin: 'var(--space-1) 0', letterSpacing: '-0.03em' }}>
                #{queueData.myToken}
              </div>
              <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>
                Dr. {queueData.doctor?.name} is ready to examine you
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginTop: 'var(--space-1)' }}>
                {queueData.doctor?.specialization}
              </p>
            </div>
          ) : queueData.isCompleted ? (
            <div>
              <span style={{ fontSize: '3rem' }}>✅</span>
              <h2 style={{ color: 'var(--color-success-700)', margin: 'var(--space-2) 0' }}>Consultation Completed</h2>
              <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
                Thank you for consulting Dr. {queueData.doctor?.name}. Your prescription and receipt are ready.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href={`/prescriptions/${id}`} className="btn btn-primary">
                  📄 View Prescription
                </Link>
                <Link href={`/receipts/${id}`} className="btn btn-secondary">
                  🧾 Payment Receipt
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Live OPD Token
              </div>
              <div style={{ fontSize: 'clamp(4rem, 12vw, 5.5rem)', fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-primary-600)', lineHeight: 1.1, margin: 'var(--space-2) 0', letterSpacing: '-0.03em' }}>
                #{queueData.myToken}
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-900)', fontWeight: 'var(--font-weight-bold)' }}>
                Dr. {queueData.doctor?.name}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginTop: '2px' }}>
                {queueData.doctor?.specialization}
              </div>

              {/* Status Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-8)',
              }}>
                <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-semibold)' }}>
                    Currently In OPD
                  </div>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-gray-900)', marginTop: 'var(--space-1)' }}>
                    {queueData.currentTokenBeingSeen ? `#${queueData.currentTokenBeingSeen}` : '—'}
                  </div>
                </div>

                <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-primary-50)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-primary-200)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-semibold)' }}>
                    Est. Wait Time
                  </div>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-primary-700)', marginTop: 'var(--space-1)' }}>
                    ~{queueData.estimatedWaitMinutes}m
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-700)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}>
                <span>👥</span>
                <span>
                  <strong>{queueData.tokensAhead}</strong> {queueData.tokensAhead === 1 ? 'patient' : 'patients'} ahead of you in line.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
