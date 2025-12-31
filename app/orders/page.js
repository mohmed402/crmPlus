'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-LY');
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': '#3b82f6',
      'Shipped': '#f59e0b',
      'Delivered': '#2caf76',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'New': 'جديد',
      'Shipped': 'تم الشحن',
      'Delivered': 'تم التسليم',
      'Cancelled': 'ملغي'
    };
    return labels[status] || status;
  };

  return (
    <AuthGuard>
      <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#18375C' }}>
              صفحة الطلبات
            </h1>
            <Link href="/orders/new">
              <button style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#18375C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontFamily: 'inherit',
                transition: 'background-color 0.2s, transform 0.1s',
                boxShadow: '0 2px 4px rgba(24, 55, 92, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0f2340';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#18375C';
                e.target.style.transform = 'translateY(0)';
              }}>
                إدخال طلب جديد
              </button>
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              لا توجد طلبات
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>رقم الطلب</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>التاريخ</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>العميل</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الهاتف</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>المنتج</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الحالة</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem', color: '#1f2937' }}>#{order.id}</td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>{formatDate(order.created_at)}</td>
                      <td style={{ padding: '1rem', color: '#1f2937' }}>{order.customer_name}</td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>{order.phone || '-'}</td>
                      <td style={{ padding: '1rem', color: '#1f2937' }}>
                        {order.product_name}
                        {order.product_count > 1 && (
                          <span style={{ color: '#6b7280', fontSize: '0.875rem', marginRight: '0.5rem' }}>
                            (+{order.product_count - 1} أخرى)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          backgroundColor: getStatusColor(order.status) + '20',
                          color: getStatusColor(order.status),
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Link href={`/orders/${order.id}`}>
                          <button style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#18375C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            fontWeight: '500',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#0f2340'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#18375C'}>
                            عرض / تعديل
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

