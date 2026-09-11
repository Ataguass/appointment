'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

const API_URL = 'http://localhost:3000/api/v1';

interface ReceiptData {
  receiptNumber: string;
  appointmentId: string;
  date: string;
  amount: number;
  status: string;
  method: string | null;
  transactionId: string | null;
  doctor: {
    name: string;
    specialization: string;
  };
  patient: {
    name: string;
    user: {
      phone: string;
      email: string;
    };
  };
  hospitalDetails: {
    name: string;
    taxId: string;
    address: string;
  };
}

export default function PatientReceiptPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/billing/receipt/${appointmentId}`)
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          setReceipt(resJson.data);
        } else {
          setError(resJson.error?.message || 'Receipt not found');
        }
      })
      .catch(() => setError('Unable to connect to billing server'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="skeleton" style={{ height: '350px', borderRadius: 'var(--radius-xl)' }} />
        </div>
      </main>
    );
  }

  if (error || !receipt) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <Link href="/appointments" style={{ fontSize: 'var(--font-size-sm)' }}>← Back to appointments</Link>
          <div className="auth-alert auth-alert-error" style={{ marginTop: 'var(--space-4)' }}>
            {error || 'Receipt not found'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content">
      <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <Link href="/appointments" style={{ fontSize: 'var(--font-size-sm)' }}>
            ← Back to my appointments
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            🖨️ Print Tax Receipt
          </button>
        </div>

        {/* Official Receipt Card */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '650px',
          margin: '0 auto',
        }}>
          {/* Header */}
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
                  {receipt.hospitalDetails.name}
                </span>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                {receipt.hospitalDetails.address} • GST: {receipt.hospitalDetails.taxId}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="status-badge status-badge-active" style={{ fontSize: 'var(--font-size-sm)' }}>
                {receipt.status}
              </span>
              <div style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                {receipt.receiptNumber}
              </div>
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--color-gray-50)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--font-size-sm)',
          }}>
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Billed To:</div>
              <div style={{ fontWeight: 'var(--font-weight-bold)', marginTop: '2px' }}>{receipt.patient.name}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{receipt.patient.user.phone}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Payment Date:</div>
              <div style={{ fontWeight: 'var(--font-weight-bold)', marginTop: '2px' }}>
                {new Date(receipt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Mode: {receipt.method || 'CASH'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="data-table-container" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '150px' }}>Service Description</th>
                  <th style={{ minWidth: '160px' }}>Doctor</th>
                  <th style={{ textAlign: 'right', minWidth: '90px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 'var(--font-weight-medium)' }}>OPD Consultation</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Specialist Outpatient Care</div>
                  </td>
                  <td>Dr. {receipt.doctor.name} ({receipt.doctor.specialization})</td>
                  <td style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>₹{receipt.amount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)' }}>
            <div style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', padding: 'var(--space-1) 0' }}>
                <span>Subtotal:</span>
                <span>₹{receipt.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', padding: 'var(--space-1) 0' }}>
                <span>GST (0% - Healthcare):</span>
                <span>₹0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', borderTop: '2px solid var(--color-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <span>Total Paid:</span>
                <span style={{ color: 'var(--color-success-600)' }}>₹{receipt.amount}</span>
              </div>
            </div>
          </div>

          {/* Transaction Footer */}
          {receipt.transactionId && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', fontFamily: 'monospace', textAlign: 'center', borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--space-4)' }}>
              Payment Ref / Txn ID: {receipt.transactionId}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
