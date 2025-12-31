'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { AuthGuard } from '../../components/AuthGuard';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#18375C', marginBottom: '2rem' }}>
            إدارة العملاء
          </h1>

          {/* Summary Cards */}
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
            padding: '1.5rem',
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
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

