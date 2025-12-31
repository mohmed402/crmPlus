'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import Link from 'next/link';

export default function OwnerPage() {
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // all, week, month
  const [statusFilter, setStatusFilter] = useState('all'); // all, Delivered

  useEffect(() => {
    fetchOrders();
    fetchReports();
  }, [dateFilter, statusFilter]);

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

  const fetchReports = async () => {
    try {
      const filters = {};
      
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters.startDate = monthAgo.toISOString().split('T')[0];
      }
      
      if (statusFilter === 'Delivered') {
        filters.status = 'Delivered';
      }
      
      const queryParams = new URLSearchParams(filters);
      const res = await fetch(`/api/reports?${queryParams}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-LY');
  };

  return (
    <AuthGuard requiredRole="owner">
      <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#18375C', marginBottom: '2rem' }}>
            صفحة التقرير
          </h1>

          {/* Reports Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #2caf76'
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                إجمالي الربح
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2caf76' }}>
                {reports ? `${reports.totalProfit.toFixed(2)} LYD` : '0.00 LYD'}
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #ef4444'
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                إجمالي المصروفات
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                {reports ? `${reports.totalExpenses.toFixed(2)} LYD` : '0.00 LYD'}
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #18375C'
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                صافي الربح
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: reports && reports.netProfit >= 0 ? '#2caf76' : '#ef4444'
              }}>
                {reports ? `${reports.netProfit.toFixed(2)} LYD` : '0.00 LYD'}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <label style={{ color: '#374151', fontWeight: '500' }}>الفترة:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="all">الكل</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
            </select>

            <label style={{ color: '#374151', fontWeight: '500', marginLeft: '1rem' }}>الحالة:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="all">الكل</option>
              <option value="Delivered">تم التسليم فقط</option>
            </select>
          </div>

          {/* Orders List with Finance Info */}
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
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>العميل</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>المنتج</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>التكلفة (LYD)</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>سعر البيع (LYD)</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الربح (LYD)</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الحالة</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <OrderRowWithFinance key={order.id} order={order} formatDate={formatDate} />
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

function OrderRowWithFinance({ order, formatDate }) {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinance();
  }, [order.id]);

  const fetchFinance = async () => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const data = await res.json();
      if (res.ok && data.finance) {
        setFinance(data.finance);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch finance:', error);
      setLoading(false);
    }
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
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '1rem', color: '#1f2937' }}>#{order.id}</td>
      <td style={{ padding: '1rem', color: '#1f2937' }}>{order.customer_name}</td>
      <td style={{ padding: '1rem', color: '#1f2937' }}>
        {order.product_name}
        {order.product_count > 1 && (
          <span style={{ color: '#6b7280', fontSize: '0.875rem', marginRight: '0.5rem' }}>
            (+{order.product_count - 1} أخرى)
          </span>
        )}
      </td>
      <td style={{ padding: '1rem', color: '#6b7280' }}>
        {loading ? '-' : finance?.cost_lyd ? `${finance.cost_lyd.toFixed(2)}` : '-'}
      </td>
      <td style={{ padding: '1rem', color: '#6b7280' }}>
        {loading ? '-' : finance?.selling_price_lyd ? `${finance.selling_price_lyd.toFixed(2)}` : '-'}
      </td>
      <td style={{ padding: '1rem' }}>
        {loading ? '-' : finance && finance.profit_lyd !== null && finance.profit_lyd !== undefined ? (
          <span style={{
            color: finance.profit_lyd >= 0 ? '#2caf76' : '#ef4444',
            fontWeight: 'bold'
          }}>
            {finance.profit_lyd.toFixed(2)}
          </span>
        ) : '-'}
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
  );
}

