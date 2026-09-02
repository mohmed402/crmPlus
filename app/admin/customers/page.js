'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { AuthGuard } from '../../components/AuthGuard';
import Link from 'next/link';
import Image from 'next/image';
import { formatMoney, toNumber } from '@/lib/money';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers/stats');
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-LY');
  };

  const fetchCustomerOrders = async (customer) => {
    setLoadingOrders(true);
    setSelectedCustomer(customer);
    try {
      const res = await fetch(`/api/customers/${customer.id}/orders`);
      const data = await res.json();
      if (res.ok) {
        setCustomerOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer orders:', error);
      setCustomerOrders([]);
    }
    setLoadingOrders(false);
  };

  const closeOrderHistory = () => {
    setSelectedCustomer(null);
    setCustomerOrders([]);
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

  const getStatusColor = (status) => {
    const colors = {
      'New': '#3b82f6',
      'Shipped': '#f59e0b',
      'Delivered': '#2caf76',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  });

  const totalStats = {
    totalCustomers: customers.length,
    totalOrders: customers.reduce((sum, c) => sum + (c.order_count || 0), 0),
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_revenue || 0), 0),
    totalProfit: customers.reduce((sum, c) => sum + (c.total_profit || 0), 0)
  };

  return (
    <AuthGuard requiredRole="owner">
      <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '700', color: '#18375C', marginBottom: '2rem' }}>
            إدارة العملاء
          </h1>

          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(1rem, 2vw, 1.5rem)',
            marginBottom: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #18375C'
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                إجمالي العملاء
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#18375C' }}>
                {totalStats.totalCustomers}
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #3b82f6'
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                إجمالي الطلبات
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {totalStats.totalOrders}
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #f59e0b'
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                إجمالي الإيرادات
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {totalStats.totalRevenue.toFixed(2)} LYD
              </div>
            </div>

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
                {totalStats.totalProfit.toFixed(2)} LYD
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1rem, 2vw, 1.5rem)',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <input
              type="text"
              placeholder="بحث عن عميل (الاسم، الهاتف، العنوان)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Customers Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد عملاء'}
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الاسم</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الهاتف</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>العنوان</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>وسائل التواصل</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>عدد الطلبات</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>إجمالي الإيرادات</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>إجمالي الربح</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>تاريخ التسجيل</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#18375C' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem', color: '#1f2937', fontWeight: '500' }}>
                          {customer.name}
                        </td>
                        <td style={{ padding: '1rem', color: '#1f2937' }}>
                          {customer.phone || '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', maxWidth: '200px' }}>
                          {customer.address || '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {customer.facebook && (
                              <a
                                href={customer.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center' }}
                              >
                                <Image
                                  src="/assets/icons/facebook.png"
                                  alt="Facebook"
                                  width={24}
                                  height={24}
                                  style={{ borderRadius: '4px' }}
                                />
                              </a>
                            )}
                            {customer.whatsapp && (
                              <a
                                href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center' }}
                              >
                                <Image
                                  src="/assets/icons/whatsapp.png"
                                  alt="WhatsApp"
                                  width={24}
                                  height={24}
                                  style={{ borderRadius: '4px' }}
                                />
                              </a>
                            )}
                            {!customer.facebook && !customer.whatsapp && '-'}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            backgroundColor: '#3b82f620',
                            color: '#3b82f6',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {customer.order_count || 0}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#f59e0b', fontWeight: '600' }}>
                          {(customer.total_revenue || 0).toFixed(2)} LYD
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            color: (customer.total_profit || 0) >= 0 ? '#2caf76' : '#ef4444',
                            fontWeight: 'bold'
                          }}>
                            {(customer.total_profit || 0).toFixed(2)} LYD
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          {formatDate(customer.created_at)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => fetchCustomerOrders(customer)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#18375C',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontFamily: 'Cairo',
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#0f2744'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#18375C'}
                          >
                            عرض الطلبات
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Order History Modal */}
        {selectedCustomer && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={closeOrderHistory}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: 'clamp(1rem, 2vw, 1.5rem)',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: '700', color: '#18375C', margin: 0 }}>
                  طلبات العميل: {selectedCustomer.name}
                </h2>
                <button
                  onClick={closeOrderHistory}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  إغلاق
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 'clamp(1rem, 2vw, 1.5rem)', overflowY: 'auto', flex: 1 }}>
                {loadingOrders ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</div>
                ) : customerOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    لا توجد طلبات لهذا العميل
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>رقم الطلب</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>المنتج</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الحالة</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الإيرادات</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الربح</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>التاريخ</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#18375C' }}>عرض</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((order) => (
                          <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '600', color: '#18375C' }}>
                              #{order.id}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#1f2937' }}>
                              {order.product_name}
                              {order.product_count > 1 && (
                                <span style={{ color: '#6b7280', fontSize: '0.875rem', marginRight: '0.5rem' }}>
                                  (+{order.product_count - 1} أخرى)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                backgroundColor: `${getStatusColor(order.status)}20`,
                                color: getStatusColor(order.status),
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                display: 'inline-block'
                              }}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#f59e0b', fontWeight: '600' }}>
                              {formatMoney(order.selling_price_lyd, { suffix: 'LYD' })}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                color: (toNumber(order.profit_lyd) ?? 0) >= 0 ? '#2caf76' : '#ef4444',
                                fontWeight: 'bold'
                              }}>
                                {formatMoney(order.profit_lyd, { suffix: 'LYD' })}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                              {formatDate(order.created_at)}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <Link
                                href={`/orders/${order.id}`}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  borderRadius: '6px',
                                  textDecoration: 'none',
                                  fontSize: '0.875rem',
                                  display: 'inline-block'
                                }}
                              >
                                عرض
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
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

