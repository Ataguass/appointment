import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface DisplayDoctorQueue {
  doctorId: string;
  doctorName: string;
  specialization: string;
  currentToken: number | null;
  currentPatientName: string | null;
  nextTokens: {
    tokenNumber: number;
    patientName: string;
    estimatedWaitMinutes: number;
  }[];
  totalWaiting: number;
}

export default function LiveDisplayPage() {
  const [queues, setQueues] = useState<DisplayDoctorQueue[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch queue display data periodically
  useEffect(() => {
    async function fetchDisplayData() {
      try {
        const res = await apiFetch<DisplayDoctorQueue[]>('/queue/display');
        setQueues(res.data);
      } catch {
        // Silent retry
      }
    }

    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 3000); // 3-second live polling sync
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: '#ffffff',
      minHeight: '100vh',
      padding: 'var(--space-6)',
      fontFamily: 'var(--font-family)',
    }}>
      {/* Header Bar */}
      <div className="display-header-responsive" style={{
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: '#14b8a6',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}>
            🏥
          </div>
          <div>
            <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'var(--font-weight-bold)', letterSpacing: '-0.02em' }}>
              HospitalFlow OPD Live Queue
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#94a3b8' }}>
              Outpatient Department Waiting Room Display
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'var(--font-weight-bold)', fontFamily: 'monospace', color: '#2dd4bf' }}>
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: '#94a3b8' }}>
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Grid of Doctor Rooms */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 'var(--space-6)',
      }}>
        {queues.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: 'var(--space-16)', color: '#64748b' }}>
            No active OPD consultations at this moment.
          </div>
        ) : (
          queues.map((q) => (
            <div
              key={q.doctorId}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Doctor Header */}
              <div style={{
                padding: 'var(--space-4) var(--space-6)',
                backgroundColor: '#334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)' }}>
                    {q.doctorName}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {q.specialization}
                  </div>
                </div>
                <div style={{
                  padding: 'var(--space-1) var(--space-3)',
                  backgroundColor: 'rgba(20, 184, 166, 0.2)',
                  color: '#2dd4bf',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                }}>
                  {q.totalWaiting} Waiting
                </div>
              </div>

              {/* Now Serving Big Callout */}
              <div style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                backgroundColor: q.currentToken ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                borderBottom: '1px solid #334155',
              }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Now Serving
                </div>
                {q.currentToken ? (
                  <div>
                    <div style={{ fontSize: '4.5rem', fontWeight: 'var(--font-weight-bold)', color: '#2dd4bf', lineHeight: 1.1, margin: 'var(--space-2) 0' }}>
                      #{q.currentToken}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: '#e2e8f0', fontWeight: 'var(--font-weight-medium)' }}>
                      {q.currentPatientName}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--space-6) 0', color: '#64748b', fontSize: 'var(--font-size-lg)' }}>
                    Consultation in progress or paused
                  </div>
                )}
              </div>

              {/* Next In Line Tokens */}
              <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                  Next in Line
                </div>
                {q.nextTokens.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 'var(--font-size-sm)' }}>No patients in queue</div>
                ) : (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {q.nextTokens.map((next, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          padding: 'var(--space-2) var(--space-3)',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <span style={{ fontWeight: 'var(--font-weight-bold)', color: '#38bdf8' }}>
                          #{next.tokenNumber}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: '#cbd5e1' }}>
                          {next.patientName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
