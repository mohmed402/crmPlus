'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { AuthGuard } from '../../components/AuthGuard';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [finance, setFinance] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ product_name: '', size: '', product_code: '', product_link: '', quantity: 1, selling_price_lyd: '' });
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchOrder();
  }, [params.id]);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
  };

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setFormData(data.order);
        if (data.products) {
          setProducts(data.products);
        }
        if (data.finance) {
          setFinance(data.finance);
        }
        if (data.expenses) {
          setExpenses(data.expenses);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (redirectToOrders = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchOrder();
        setEditing(false);
        if (redirectToOrders) {
          router.push('/orders');
        }
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
    setSaving(false);
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...order, status: newStatus }),
      });

      if (res.ok) {
        await fetchOrder();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
      case 'Shipped':
        return { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' };
      case 'Delivered':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      case 'Cancelled':
        return { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#9ca3af' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'New':
        return 'جديد';
      case 'Shipped':
        return 'تم الشحن';
      case 'Delivered':
        return 'تم التسليم';
      case 'Cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
          <Navbar />
          <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
        </div>
      </AuthGuard>
    );
  }

  if (!order) {
    return (
      <AuthGuard>
        <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
          <Navbar />
          <div style={{ padding: '2rem', textAlign: 'center' }}>الطلب غير موجود</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '700', color: '#18375C' }}>
              الطلب #{order.id}
            </h1>
            {!editing && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => router.push(`/orders/${params.id}/receipt`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1rem',
                    backgroundColor: '#2caf76',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontFamily: 'inherit',
                    transition: 'background-color 0.2s, transform 0.1s',
                    boxShadow: '0 2px 4px rgba(44, 175, 118, 0.2)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#239a5f';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2caf76';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  طباعة الإيصال
                </button>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: '#18375C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontFamily: 'inherit',
                    transition: 'background-color 0.2s, transform 0.1s',
                    boxShadow: '0 2px 4px rgba(24, 55, 92, 0.2)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0f2340';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#18375C';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  تعديل
                </button>
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1rem, 3vw, 2rem)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '2rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: '700', color: '#18375C', marginBottom: '2rem' }}>
              معلومات الطلب
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(1rem, 2vw, 2rem)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  اسم العميل
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#18375C'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                ) : (
                  <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '1.05rem',
                    fontWeight: '500'
                  }}>
                    {order.customer_name}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  الهاتف
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#18375C'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                ) : (
                  <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '1.05rem',
                    fontWeight: '500'
                  }}>
                    {order.phone || '-'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  حالة الدفعة المقدمة
                </label>
                {editing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem' }}>
                    <input
                      type="checkbox"
                      name="deposit_paid"
                      checked={formData.deposit_paid || false}
                      onChange={(e) => setFormData({ ...formData, deposit_paid: e.target.checked })}
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        cursor: 'pointer',
                        accentColor: '#18375C'
                      }}
                    />
                    <span style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>
                      تم دفع الدفعة المقدمة
                    </span>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: order.deposit_paid ? '#d1fae5' : '#fee2e2', 
                    borderRadius: '8px',
                    color: order.deposit_paid ? '#065f46' : '#991b1b',
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    border: order.deposit_paid ? '2px solid #10b981' : '2px solid #ef4444',
                    textAlign: 'center'
                  }}>
                    {order.deposit_paid ? '✓ تم الدفع' : '✗ لم يتم الدفع'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  المبلغ المدفوع (LYD)
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="amount_paid"
                    value={formData.amount_paid || 0}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#18375C'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                ) : (
                  <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '1.05rem',
                    fontWeight: '500'
                  }}>
                    {order.amount_paid ? `${parseFloat(order.amount_paid).toFixed(2)} LYD` : '0.00 LYD'}
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  العنوان
                </label>
                {editing ? (
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#18375C'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                ) : (
                  <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '1.05rem',
                    fontWeight: '500'
                  }}>
                    {order.address || '-'}
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  الحالة
                </label>
                {editing ? (
                  <select
                    name="status"
                    value={formData.status || 'New'}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="New">جديد</option>
                    <option value="Shipped">تم الشحن</option>
                    <option value="Delivered">تم التسليم</option>
                    <option value="Cancelled">ملغي</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.625rem 1.25rem',
                      backgroundColor: getStatusColor(order.status).bg,
                      color: getStatusColor(order.status).color,
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      border: `2px solid ${getStatusColor(order.status).border}`
                    }}>
                      {getStatusLabel(order.status)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {order.status !== 'New' && (
                        <button
                          onClick={() => handleQuickStatusChange('New')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            border: '2px solid #3b82f6',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#bfdbfe';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#dbeafe';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          جديد
                        </button>
                      )}
                      {order.status !== 'Shipped' && (
                        <button
                          onClick={() => handleQuickStatusChange('Shipped')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: '2px solid #f59e0b',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#fde68a';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#fef3c7';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          تم الشحن
                        </button>
                      )}
                      {order.status !== 'Delivered' && (
                        <button
                          onClick={() => handleQuickStatusChange('Delivered')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            border: '2px solid #10b981',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#a7f3d0';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#d1fae5';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          تم التسليم
                        </button>
                      )}
                      {order.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleQuickStatusChange('Cancelled')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: '2px solid #ef4444',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#fecaca';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#fee2e2';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          ملغي
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  ملاحظات
                </label>
                {editing ? (
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#18375C'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                ) : (
                  <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '1.05rem',
                    minHeight: '4rem',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {order.notes || '-'}
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(order);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    flex: '1 1 auto',
                    minWidth: '120px'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: saving ? '#9ca3af' : '#18375C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontFamily: 'inherit',
                    transition: 'background-color 0.2s, transform 0.1s',
                    boxShadow: saving ? 'none' : '0 2px 4px rgba(24, 55, 92, 0.2)',
                    flex: '1 1 auto',
                    minWidth: '120px'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#0f2340';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#18375C';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: saving ? '#9ca3af' : '#2caf76',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontFamily: 'inherit',
                    transition: 'background-color 0.2s, transform 0.1s',
                    boxShadow: saving ? 'none' : '0 2px 4px rgba(44, 175, 118, 0.2)',
                    flex: '1 1 auto',
                    minWidth: '120px'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#259862';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#2caf76';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ والعودة'}
                </button>
              </div>
            )}
          </div>

          {/* Products Section */}
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1rem, 3vw, 2rem)',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: '600', color: '#18375C' }}>
                المنتجات
              </h2>
              {!editing && (
                <button
                  onClick={() => setAddingProduct(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2caf76',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#239a5f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2caf76'}
                >
                  إضافة منتج
                </button>
              )}
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                لا توجد منتجات
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>اسم المنتج</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الحجم</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>رمز المنتج</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>رابط المنتج</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الكمية</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>سعر البيع (LYD)</th>
                      {!editing && (
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الإجراءات</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        editing={editing}
                        editingProduct={editingProduct}
                        setEditingProduct={setEditingProduct}
                        onUpdate={fetchOrder}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {addingProduct && (
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#18375C', marginBottom: '1rem' }}>
                  إضافة منتج جديد
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                      اسم المنتج *
                    </label>
                    <input
                      type="text"
                      value={newProduct.product_name}
                      onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                      الحجم
                    </label>
                    <input
                      type="text"
                      value={newProduct.size}
                      onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                      رمز المنتج
                    </label>
                    <input
                      type="text"
                      value={newProduct.product_code}
                      onChange={(e) => setNewProduct({ ...newProduct, product_code: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                      رابط المنتج
                    </label>
                    <input
                      type="url"
                      value={newProduct.product_link}
                      onChange={(e) => setNewProduct({ ...newProduct, product_link: e.target.value })}
                      placeholder="https://..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setAddingProduct(false);
                      setNewProduct({ product_name: '', size: '', product_code: '', product_link: '', quantity: 1, selling_price_lyd: '' });
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontFamily: 'inherit'
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={async () => {
                      if (!newProduct.product_name) return;
                      setAddingProduct(false);
                      try {
                        const res = await fetch(`/api/orders/${params.id}/products`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newProduct),
                        });
                        if (res.ok) {
                          await fetchOrder();
                          setNewProduct({ product_name: '', size: '', product_code: '', product_link: '', quantity: 1, selling_price_lyd: '' });
                        }
                      } catch (error) {
                        console.error('Failed to add product:', error);
                      }
                    }}
                    disabled={!newProduct.product_name}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: !newProduct.product_name ? '#9ca3af' : '#2caf76',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      cursor: !newProduct.product_name ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontFamily: 'inherit',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    إضافة
                  </button>
                </div>
              </div>
            )}
          </div>

          {user?.role === 'owner' && (
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <OwnerFinanceSection 
                orderId={order.id} 
                order={order}
                finance={finance} 
                expenses={expenses}
                onUpdate={fetchOrder}
              />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function OwnerFinanceSection({ orderId, order, finance, expenses, onUpdate }) {
  const [financeData, setFinanceData] = useState({
    cost_try: finance?.cost_try || '',
    fx_try_to_lyd: finance?.fx_try_to_lyd || '',
    shipping_lyd: finance?.shipping_lyd || '',
    selling_price_lyd: finance?.selling_price_lyd || '',
    owner_notes: finance?.owner_notes || ''
  });
  const [editingFinance, setEditingFinance] = useState(!finance);
  const [savingFinance, setSavingFinance] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount_lyd: '' });
  const [addingExpense, setAddingExpense] = useState(false);
  const [latestRate, setLatestRate] = useState(null);

  useEffect(() => {
    fetchLatestRate();
  }, []);

  const fetchLatestRate = async () => {
    try {
      const res = await fetch('/api/exchange-rates?latest=true');
      const data = await res.json();
      if (data.rate) {
        setLatestRate(data.rate.fx_try_to_lyd);
      }
    } catch (error) {
      console.error('Failed to fetch latest rate:', error);
    }
  };

  const handleFinanceChange = (e) => {
    setFinanceData({
      ...financeData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveFinance = async () => {
    setSavingFinance(true);
    try {
      const res = await fetch(`/api/finance/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(financeData),
      });

      if (res.ok) {
        await onUpdate();
        setEditingFinance(false);
      }
    } catch (error) {
      console.error('Failed to save finance:', error);
    }
    setSavingFinance(false);
  };

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount_lyd) return;
    
    setAddingExpense(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          title: newExpense.title,
          amount_lyd: parseFloat(newExpense.amount_lyd)
        }),
      });

      if (res.ok) {
        await onUpdate();
        setNewExpense({ title: '', amount_lyd: '' });
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
    setAddingExpense(false);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('هل أنت متأكد من حذف هذه المصروفات؟')) return;
    
    try {
      const res = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const costLyd = financeData.cost_try && financeData.fx_try_to_lyd
    ? parseFloat(financeData.cost_try) * parseFloat(financeData.fx_try_to_lyd)
    : finance?.cost_lyd || null;

  const expensesTotal = expenses.reduce((sum, exp) => sum + (exp.amount_lyd || 0), 0);
  const totalCostLyd = costLyd && financeData.shipping_lyd
    ? costLyd + parseFloat(financeData.shipping_lyd) + expensesTotal
    : finance?.cost_lyd && finance?.shipping_lyd
    ? finance.cost_lyd + finance.shipping_lyd + expensesTotal
    : null;

  const profitLyd = financeData.selling_price_lyd && totalCostLyd
    ? parseFloat(financeData.selling_price_lyd) - totalCostLyd
    : finance?.profit_lyd || null;

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#18375C', margin: 0 }}>
        المعلومات المالية (للمالك فقط)
      </h2>
      {!editingFinance && finance && (
        <button
          onClick={() => setEditingFinance(true)}
          style={{
              padding: '0.625rem 1.25rem',
            backgroundColor: '#18375C',
            color: 'white',
            border: 'none',
              borderRadius: '8px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(24, 55, 92, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0f2340';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#18375C';
              e.target.style.transform = 'translateY(0)';
            }}
        >
          تعديل المعلومات المالية
        </button>
      )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            التكلفة بالليرة التركية (TRY)
          </label>
          {editingFinance ? (
            <input
              type="number"
              name="cost_try"
              value={financeData.cost_try}
              onChange={handleFinanceChange}
              step="0.01"
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#18375C'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          ) : (
            <div style={{ 
              padding: '0.875rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              color: '#1f2937',
              fontSize: '1.05rem',
              fontWeight: '500'
            }}>
              {finance?.cost_try ? `${finance.cost_try} TRY` : '-'}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            سعر الصرف (TRY → LYD)
          </label>
          {editingFinance ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="number"
                name="fx_try_to_lyd"
                value={financeData.fx_try_to_lyd}
                onChange={handleFinanceChange}
                step="0.0001"
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#18375C'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {latestRate && (
                <button
                  type="button"
                  onClick={() => setFinanceData({ ...financeData, fx_try_to_lyd: latestRate })}
                  style={{
                    padding: '0.875rem 1rem',
                    backgroundColor: '#f3f4f6',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    color: '#374151',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e5e7eb';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  استخدام آخر سعر
                </button>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '0.875rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              color: '#1f2937',
              fontSize: '1.05rem',
              fontWeight: '500'
            }}>
              {finance?.fx_try_to_lyd || '-'}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            التكلفة بالدينار الليبي (LYD)
          </label>
          <div style={{ 
            padding: '0.875rem', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px',
            color: '#92400e',
            fontSize: '1.05rem',
            fontWeight: '600',
            border: '2px solid #fde68a'
          }}>
            {costLyd ? `${costLyd.toFixed(2)} LYD` : '-'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            الشحن (LYD)
          </label>
          {editingFinance ? (
            <input
              type="number"
              name="shipping_lyd"
              value={financeData.shipping_lyd}
              onChange={handleFinanceChange}
              step="0.01"
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#18375C'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          ) : (
            <div style={{ 
              padding: '0.875rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              color: '#1f2937',
              fontSize: '1.05rem',
              fontWeight: '500'
            }}>
              {finance?.shipping_lyd ? `${finance.shipping_lyd} LYD` : '-'}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            سعر البيع (LYD)
          </label>
          {editingFinance ? (
            <input
              type="number"
              name="selling_price_lyd"
              value={financeData.selling_price_lyd}
              onChange={handleFinanceChange}
              step="0.01"
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#18375C'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          ) : (
            <div style={{ 
              padding: '0.875rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              color: '#1f2937',
              fontSize: '1.05rem',
              fontWeight: '500'
            }}>
              {finance?.selling_price_lyd ? `${finance.selling_price_lyd} LYD` : '-'}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            إجمالي التكلفة (LYD)
          </label>
          <div style={{ 
            padding: '0.875rem', 
            backgroundColor: '#fee2e2', 
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '1.05rem',
            fontWeight: '600',
            border: '2px solid #fecaca'
          }}>
            {totalCostLyd ? `${totalCostLyd.toFixed(2)} LYD` : '-'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            الربح (LYD)
          </label>
          <div style={{ 
            padding: '0.875rem', 
            backgroundColor: profitLyd >= 0 ? '#d1fae5' : '#fee2e2',
            color: profitLyd >= 0 ? '#065f46' : '#991b1b',
            border: profitLyd >= 0 ? '2px solid #10b981' : '2px solid #ef4444',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>{profitLyd >= 0 ? '↑' : '↓'}</span>
            {profitLyd !== null ? `${profitLyd.toFixed(2)} LYD` : '-'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            المبلغ المدفوع (LYD)
          </label>
          <div style={{ 
            padding: '0.875rem', 
            backgroundColor: '#dbeafe',
            borderRadius: '8px',
            color: '#1e40af',
            fontSize: '1.05rem',
            fontWeight: '600',
            border: '2px solid #93c5fd'
          }}>
            {order?.amount_paid ? `${parseFloat(order.amount_paid).toFixed(2)} LYD` : '0.00 LYD'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            المبلغ المتبقي (LYD)
          </label>
          <div style={{ 
            padding: '0.875rem', 
            backgroundColor: (() => {
              const remaining = (finance?.selling_price_lyd || 0) - (order?.amount_paid || 0);
              return remaining <= 0 ? '#d1fae5' : '#fef3c7';
            })(),
            borderRadius: '8px',
            color: (() => {
              const remaining = (finance?.selling_price_lyd || 0) - (order?.amount_paid || 0);
              return remaining <= 0 ? '#065f46' : '#92400e';
            })(),
            fontSize: '1.25rem',
            fontWeight: '700',
            border: (() => {
              const remaining = (finance?.selling_price_lyd || 0) - (order?.amount_paid || 0);
              return remaining <= 0 ? '2px solid #10b981' : '2px solid #fde68a';
            })(),
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {(() => {
              const sellingPrice = parseFloat(finance?.selling_price_lyd) || 0;
              const amountPaid = parseFloat(order?.amount_paid) || 0;
              const remaining = sellingPrice - amountPaid;
              return remaining <= 0 ? (
                <>
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                  تم الدفع بالكامل
                </>
              ) : (
                `${remaining.toFixed(2)} LYD`
              );
            })()}
          </div>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
            ملاحظات المالك
          </label>
          {editingFinance ? (
            <textarea
              name="owner_notes"
              value={financeData.owner_notes}
              onChange={handleFinanceChange}
              rows="3"
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                outline: 'none',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#18375C'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          ) : (
            <div style={{ 
              padding: '0.875rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              color: '#1f2937',
              fontSize: '1.05rem',
              minHeight: '4rem',
              whiteSpace: 'pre-wrap'
            }}>
              {finance?.owner_notes || '-'}
            </div>
          )}
        </div>
      </div>

      {editingFinance && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
          <button
            onClick={() => {
              setEditingFinance(false);
              setFinanceData({
                cost_try: finance?.cost_try || '',
                fx_try_to_lyd: finance?.fx_try_to_lyd || '',
                shipping_lyd: finance?.shipping_lyd || '',
                selling_price_lyd: finance?.selling_price_lyd || '',
                owner_notes: finance?.owner_notes || ''
              });
            }}
            style={{
              padding: '0.875rem 1.75rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSaveFinance}
            disabled={savingFinance}
            style={{
              padding: '0.875rem 1.75rem',
              backgroundColor: savingFinance ? '#9ca3af' : '#18375C',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: savingFinance ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: savingFinance ? 'none' : '0 4px 6px rgba(24, 55, 92, 0.25)'
            }}
            onMouseEnter={(e) => {
              if (!savingFinance) {
                e.target.style.backgroundColor = '#0f2340';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 8px rgba(24, 55, 92, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!savingFinance) {
                e.target.style.backgroundColor = '#18375C';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(24, 55, 92, 0.25)';
              }
            }}
          >
            {savingFinance ? 'جاري الحفظ...' : 'حفظ المعلومات المالية'}
          </button>
        </div>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#18375C', marginBottom: '1rem' }}>
          المصروفات الإضافية
        </h3>

        {expenses.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>العنوان</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>المبلغ (LYD)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', color: '#1f2937' }}>{expense.title}</td>
                    <td style={{ padding: '0.75rem', color: '#1f2937' }}>{expense.amount_lyd} LYD</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px', fontWeight: '500' }}>
              إجمالي المصروفات: {expensesTotal.toFixed(2)} LYD
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="عنوان المصروفات (مثل: التغليف، الشحن...)"
            value={newExpense.title}
            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <input
            type="number"
            placeholder="المبلغ (LYD)"
            value={newExpense.amount_lyd}
            onChange={(e) => setNewExpense({ ...newExpense, amount_lyd: e.target.value })}
            step="0.01"
            style={{
              width: '150px',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handleAddExpense}
            disabled={addingExpense || !newExpense.title || !newExpense.amount_lyd}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: addingExpense || !newExpense.title || !newExpense.amount_lyd ? '#9ca3af' : '#2caf76',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: addingExpense || !newExpense.title || !newExpense.amount_lyd ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontFamily: 'inherit',
              transition: 'background-color 0.2s, transform 0.1s',
              boxShadow: (addingExpense || !newExpense.title || !newExpense.amount_lyd) ? 'none' : '0 2px 4px rgba(44, 175, 118, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!addingExpense && newExpense.title && newExpense.amount_lyd) {
                e.target.style.backgroundColor = '#239a5f';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!addingExpense && newExpense.title && newExpense.amount_lyd) {
                e.target.style.backgroundColor = '#2caf76';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {addingExpense ? 'جاري الإضافة...' : 'إضافة مصروفات'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, editing, editingProduct, setEditingProduct, onUpdate }) {
  const [productData, setProductData] = useState(product);
  const [saving, setSaving] = useState(false);
  const orderId = product.order_id;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, ...productData }),
      });
      if (res.ok) {
        await onUpdate();
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Failed to update product:', error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/products?id=${product.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const isEditing = editingProduct === product.id;

  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '1rem', color: '#1f2937' }}>
        {isEditing ? (
          <input
            type="text"
            value={productData.product_name}
            onChange={(e) => setProductData({ ...productData, product_name: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          product.product_name
        )}
      </td>
      <td style={{ padding: '1rem', color: '#6b7280' }}>
        {isEditing ? (
          <input
            type="text"
            value={productData.size || ''}
            onChange={(e) => setProductData({ ...productData, size: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          product.size || '-'
        )}
      </td>
      <td style={{ padding: '1rem', color: '#6b7280' }}>
        {isEditing ? (
          <input
            type="text"
            value={productData.product_code || ''}
            onChange={(e) => setProductData({ ...productData, product_code: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          product.product_code || '-'
        )}
      </td>
      <td style={{ padding: '1rem', color: '#6b7280' }}>
        {isEditing ? (
          <input
            type="url"
            value={productData.product_link || ''}
            onChange={(e) => setProductData({ ...productData, product_link: e.target.value })}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          product.product_link ? (
            <a href={product.product_link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              رابط المنتج
            </a>
          ) : '-'
        )}
      </td>
      <td style={{ padding: '1rem', color: '#1f2937' }}>
        {isEditing ? (
          <input
            type="number"
            min="1"
            value={productData.quantity}
            onChange={(e) => setProductData({ ...productData, quantity: parseInt(e.target.value) || 1 })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          product.quantity || 1
        )}
      </td>
      <td style={{ padding: '1rem', color: '#1f2937' }}>
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            min="0"
            value={productData.selling_price_lyd || ''}
            onChange={(e) => setProductData({ ...productData, selling_price_lyd: e.target.value })}
            placeholder="0.00"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          product.selling_price_lyd ? `${product.selling_price_lyd} LYD` : '-'
        )}
      </td>
      {!editing && (
        <td style={{ padding: '1rem' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSave}
                disabled={saving || !productData.product_name}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: saving || !productData.product_name ? '#9ca3af' : '#18375C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: saving || !productData.product_name ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: '500'
                }}
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductData(product);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: '500'
                }}
              >
                إلغاء
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setEditingProduct(product.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#18375C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0f2340'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#18375C'}
              >
                تعديل
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                حذف
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}

