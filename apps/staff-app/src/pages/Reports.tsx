import { useState, useEffect } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface RevenueReport {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalPaidConsultations: number;
  methodBreakdown: {
    CASH: number;
    UPI: number;
    CARD: number;
    OTHER: number;
  };
  doctorEarnings: {
    doctorName: string;
    specialization: string;
    total: number;
    count: number;
  }[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await apiFetch<RevenueReport>('/billing/reports/revenue');
        setReport(res.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load revenue report');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">OPD Revenue & Analytics</h1>
        </div>
        <div className="skeleton skeleton-card" style={{ height: '300px' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">OPD Revenue & Analytics</h1>
        <p className="page-subtitle">Hospital financial performance, consultation volume, and payment method distribution</p>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Key Metrics */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="stat-card">
              <div className="stat-label">Total Revenue (Last 7 Days)</div>
              <div className="stat-value" style={{ color: 'var(--color-success-600)' }}>
                ₹{report.totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Paid Consultations</div>
              <div className="stat-value" style={{ color: 'var(--color-primary-600)' }}>
                {report.totalPaidConsultations}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Fee / Patient</div>
              <div className="stat-value">
                ₹{report.totalPaidConsultations > 0 ? Math.round(report.totalRevenue / report.totalPaidConsultations) : 0}
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="data-table-container" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Revenue by Payment Channel</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)', fontWeight: 'var(--font-weight-bold)' }}>UPI Payments</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginTop: 'var(--space-1)' }}>
                  ₹{(report.methodBreakdown.UPI || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-success-50)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-700)', fontWeight: 'var(--font-weight-bold)' }}>Cash Counter</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginTop: 'var(--space-1)' }}>
                  ₹{(report.methodBreakdown.CASH || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-info-50)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-info-700)', fontWeight: 'var(--font-weight-bold)' }}>Card POS</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginTop: 'var(--space-1)' }}>
                  ₹{(report.methodBreakdown.CARD || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', fontWeight: 'var(--font-weight-bold)' }}>Other</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginTop: 'var(--space-1)' }}>
                  ₹{(report.methodBreakdown.OTHER || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Doctor-wise Earnings Breakdown */}
          <div className="data-table-container">
            <div style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-weight-semibold)', borderBottom: '1px solid var(--color-border)' }}>
              Doctor-wise Revenue Breakdown
            </div>
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '160px' }}>Doctor Name</th>
                    <th style={{ minWidth: '160px' }}>Department / Specialization</th>
                    <th style={{ minWidth: '140px' }}>Consultations Completed</th>
                    <th style={{ minWidth: '140px' }}>Total Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {report.doctorEarnings.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                        No consultation revenue recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    report.doctorEarnings.map((d, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>Dr. {d.doctorName}</td>
                        <td>{d.specialization}</td>
                        <td>{d.count} patients</td>
                        <td style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success-600)' }}>
                          ₹{d.total.toLocaleString('en-IN')}
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
    </div>
  );
}
