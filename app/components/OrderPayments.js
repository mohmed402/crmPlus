'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/money';

const METHOD_LABELS = {
  cash: 'نقداً',
  transfer: 'تحويل',
  other: 'أخرى'
};

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ar-LY');
}

export default function OrderPayments({
  orderId,
  payments = [],
  netPaid = 0,
  depositPaid = false,
  isOwner = false,
  onUpdate
}) {
  const [kind, setKind] = useState('payment');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: isOwner ? kind : 'payment',
          amount_lyd: amount,
          method,
          note,
          paid_at: paidAt ? new Date(paidAt).toISOString() : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل في حفظ الدفعة');
        setSaving(false);
        return;
      }
      setAmount('');
      setNote('');
      setPaidAt('');
      setKind('payment');
      await onUpdate();
    } catch (err) {
      setError('تعذر حفظ الدفعة');
    }
    setSaving(false);
  };

  const handleDelete = async (paymentId) => {
    if (!confirm('هل أنت متأكد من حذف قيد الدفع؟')) return;
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}/payments?id=${paymentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل في حذف القيد');
        return;
      }
      await onUpdate();
    } catch (err) {
      setError('تعذر حذف القيد');
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: 'clamp(1rem, 3vw, 2rem)',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: '2rem',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: '700', color: '#18375C', marginBottom: '1.5rem' }}>
        سجل الدفعات
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '2px solid #93c5fd'
        }}>
          <div style={{ color: '#1e40af', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem' }}>
            إجمالي المدفوع
          </div>
          <div style={{ color: '#1e40af', fontSize: '1.25rem', fontWeight: '700' }}>
            {formatMoney(netPaid, { suffix: 'LYD' })}
          </div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: depositPaid ? '#d1fae5' : '#fee2e2',
          borderRadius: '8px',
          border: depositPaid ? '2px solid #10b981' : '2px solid #ef4444'
        }}>
          <div style={{ color: depositPaid ? '#065f46' : '#991b1b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem' }}>
            حالة الدفعة
          </div>
          <div style={{ color: depositPaid ? '#065f46' : '#991b1b', fontSize: '1.05rem', fontWeight: '700' }}>
            {depositPaid ? 'يوجد مبلغ مدفوع' : 'لا يوجد دفع'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        alignItems: 'end'
      }}>
        {isOwner && (
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: '0.4rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>النوع</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              style={inputStyle}
            >
              <option value="payment">دفعة</option>
              <option value="refund">استرداد</option>
            </select>
          </label>
        )}
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: '0.4rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>المبلغ (LYD)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: '0.4rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>الطريقة</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={inputStyle}
          >
            <option value="cash">نقداً</option>
            <option value="transfer">تحويل</option>
            <option value="other">أخرى</option>
          </select>
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: '0.4rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>التاريخ</span>
          <input
            type="datetime-local"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: '0.4rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>ملاحظة</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={inputStyle}
          />
        </label>
        <button
          type="submit"
          disabled={saving || !amount}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: saving ? '#9ca3af' : '#18375C',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit'
          }}
        >
          {saving ? 'جاري الحفظ...' : (kind === 'refund' ? 'إضافة استرداد' : 'إضافة دفعة')}
        </button>
      </form>

      {error && (
        <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
          لا توجد دفعات مسجلة
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={thStyle}>النوع</th>
                <th style={thStyle}>المبلغ</th>
                <th style={thStyle}>الطريقة</th>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>بواسطة</th>
                <th style={thStyle}>ملاحظة</th>
                {isOwner && <th style={thStyle}>إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>
                    {payment.kind === 'refund' ? 'استرداد' : 'دفعة'}
                  </td>
                  <td style={{
                    ...tdStyle,
                    color: payment.kind === 'refund' ? '#991b1b' : '#065f46',
                    fontWeight: '700'
                  }}>
                    {payment.kind === 'refund' ? '-' : '+'}
                    {formatMoney(payment.amount_lyd, { suffix: 'LYD' })}
                  </td>
                  <td style={tdStyle}>{METHOD_LABELS[payment.method] || payment.method}</td>
                  <td style={tdStyle}>{formatDateTime(payment.paid_at)}</td>
                  <td style={tdStyle}>{payment.created_by_username || '-'}</td>
                  <td style={tdStyle}>{payment.note || '-'}</td>
                  {isOwner && (
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(payment.id)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        حذف
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontFamily: 'inherit'
};

const thStyle = {
  padding: '0.75rem',
  textAlign: 'right',
  color: '#18375C',
  fontWeight: '600'
};

const tdStyle = {
  padding: '0.75rem',
  color: '#1f2937'
};
