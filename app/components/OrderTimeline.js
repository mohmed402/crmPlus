'use client';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ar-LY');
}

const EVENT_COLORS = {
  status_changed: '#3b82f6',
  payment_added: '#10b981',
  payment_refunded: '#f59e0b',
  payment_deleted: '#ef4444',
  product_added: '#6366f1',
  product_updated: '#6366f1',
  product_deleted: '#ef4444',
  order_created: '#18375C',
  order_updated: '#6b7280',
  finance_updated: '#0f766e',
  expense_added: '#b45309',
  expense_deleted: '#b45309'
};

export default function OrderTimeline({ events = [] }) {
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
        سجل الطلب
      </h2>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
          لا توجد أحداث بعد
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                borderRight: `4px solid ${EVENT_COLORS[event.event_type] || '#9ca3af'}`
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#18375C', marginBottom: '0.25rem' }}>
                  {event.summary}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {formatDateTime(event.created_at)}
                  {event.actor_username ? ` • ${event.actor_username}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
