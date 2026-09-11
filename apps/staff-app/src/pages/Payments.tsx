import { useState, useEffect, type FormEvent } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface PaymentItem {
  id: string;
  appointmentId: string;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  method: 'CASH' | 'CARD' | 'UPI' | 'OTHER' | null;
  transactionId: string | null;
  paidAt: string | null;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  specialization: string;
}

interface PaymentSummary {
  totalCollected: number;
  totalPending: number;
  totalWaived: number;
  totalTransactions: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalCollected: 0,
    totalPending: 0,
    totalWaived: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Collect Modal
  const [collectPaymentId, setCollectPaymentId] = useState<string | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(500);
  const [collectMethod, setCollectMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('UPI');
  const [collectTxnId, setCollectTxnId] = useState('');
  const [collecting, setCollecting] = useState(false);

  // Waive Modal
  const [waivePaymentId, setWaivePaymentId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState('');
  const [waiving, setWaiving] = useState(false);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await apiFetch<PaymentItem[]>(`/billing/payments${query}`);
      setPayments(res.data);
      if ((res as any).summary) {
        setSummary((res as any).summary);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const handleCollectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!collectPaymentId) return;
    setCollecting(true);

    try {
      await apiFetch('/billing/pay', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: collectPaymentId,
          amount: Number(collectAmount),
          method: collectMethod,
          transactionId: collectTxnId || undefined,
        }),
      });

      setCollectPaymentId(null);
      setCollectTxnId('');
      await loadPayments();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to collect payment');
    } finally {
      setCollecting(false);
    }
  };

  const handleWaiveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!waivePaymentId || !waiveReason.trim()) return;
    setWaiving(true);

    try {
      await apiFetch('/billing/waive', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: waivePaymentId,
          reason: waiveReason,
        }),
      });

      setWaivePaymentId(null);
      setWaiveReason('');
      await loadPayments();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to waive fee');
    } finally {
      setWaiving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Billing & Cashier Portal</h1>
        <p className="page-subtitle">Track OPD payments, collect consultation fees, and issue digital receipts</p>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Collected</div>
          <div className="stat-value" style={{ color: 'var(--color-success-600)' }}>
            ₹{summary.totalCollected.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Dues</div>
          <div className="stat-value" style={{ color: 'var(--color-warning-600)' }}>
            ₹{summary.totalPending.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fees Waived</div>
          <div className="stat-value" style={{ color: 'var(--color-text-secondary)' }}>
            ₹{summary.totalWaived.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Consultations</div>
          <div className="stat-value">{summary.totalTransactions}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="data-table-container" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', backgroundColor: 'var(--color-gray-50)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Payment Status</label>
            <select
              className="form-input"
              style={{ height: '36px', minWidth: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Transactions</option>
              <option value="UNPAID">Pending (Unpaid)</option>
              <option value="PAID">Paid</option>
              <option value="WAIVED">Waived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="data-table-container">
        {loading ? (
          <div style={{ padding: 'var(--space-8)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" style={{ height: '50px', marginBottom: '8px' }} />
            ))}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '140px' }}>Patient</th>
                  <th style={{ minWidth: '140px' }}>Doctor</th>
                  <th style={{ minWidth: '100px' }}>Fee Amount</th>
                  <th style={{ minWidth: '100px' }}>Status</th>
                  <th style={{ minWidth: '130px' }}>Method / Txn</th>
                  <th style={{ minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-tertiary)' }}>
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{p.patientName}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{p.patientPhone}</div>
                      </td>
                      <td>
                        <div>Dr. {p.doctorName}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{p.specialization}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-base)' }}>
                          ₹{p.amount}
                        </span>
                      </td>
                      <td>
                        {p.status === 'PAID' && <span className="status-badge status-badge-active">Paid</span>}
                        {p.status === 'UNPAID' && <span className="status-badge" style={{ backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-600)' }}>Pending</span>}
                        {p.status === 'WAIVED' && <span className="status-badge status-badge-inactive">Waived</span>}
                      </td>
                      <td>
                        {p.status === 'PAID' ? (
                          <div>
                            <span className="dept-tag">{p.method}</span>
                            {p.transactionId && (
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px', fontFamily: 'monospace' }}>
                                {p.transactionId.slice(0, 16)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {p.status === 'UNPAID' && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setCollectPaymentId(p.appointmentId);
                                  setCollectAmount(p.amount);
                                }}
                              >
                                💳 Collect
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setWaivePaymentId(p.appointmentId)}
                              >
                                Waive
                              </button>
                            </>
                          )}
                          {p.status === 'PAID' && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-600)', fontWeight: 'var(--font-weight-medium)' }}>
                              ✓ Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {collectPaymentId && (
        <div className="modal-backdrop" onClick={() => setCollectPaymentId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Collect Consultation Fee</h2>
            <form onSubmit={handleCollectSubmit}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Payment Method</label>
                <select
                  className="form-input"
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                >
                  <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Transaction ID / Reference (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., UPI Ref / Card Auth No."
                  value={collectTxnId}
                  onChange={(e) => setCollectTxnId(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCollectPaymentId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={collecting}>
                  {collecting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Fee Modal */}
      {waivePaymentId && (
        <div className="modal-backdrop" onClick={() => setWaivePaymentId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Waive Consultation Fee</h2>
            <form onSubmit={handleWaiveSubmit}>
              <div className="form-group">
                <label className="form-label">Reason for Waiver</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Hospital Staff Courtesy, Free Follow-up, Camp Patient"
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setWaivePaymentId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={waiving}>
                  {waiving ? 'Processing...' : 'Confirm Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
