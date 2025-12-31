'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [addingExpense, setAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: ''
  });
  const [newExpense, setNewExpense] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'LYD',
    exchange_rate: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: ''
  });
  const [latestRates, setLatestRates] = useState({ try: null, usd: null });

  useEffect(() => {
    fetchUser();
    fetchExpenses();
    fetchLatestRates();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user?.role !== 'owner') {
      router.push('/orders');
    }
    setUser(data.user);
  };

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category) params.append('category', filters.category);

      const res = await fetch(`/api/general-expenses?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
    setLoading(false);
  };

  const fetchLatestRates = async () => {
    try {
      const res = await fetch('/api/exchange-rates?latest=true');
      const data = await res.json();
      if (data.rate) {
        setLatestRates({
          try: data.rate.fx_try_to_lyd,
          usd: data.rate.fx_usd_to_lyd || null
        });
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      alert('يرجى ملء العنوان والمبلغ');
      return;
    }

    if (newExpense.currency !== 'LYD' && !newExpense.exchange_rate) {
      alert('يرجى إدخال سعر الصرف');
      return;
    }

    try {
      const res = await fetch('/api/general-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });

      if (res.ok) {
        await fetchExpenses();
        setAddingExpense(false);
        setNewExpense({
          title: '',
          description: '',
          amount: '',
          currency: 'LYD',
          exchange_rate: '',
          expense_date: new Date().toISOString().split('T')[0],
          category: ''
        });
      } else {
        const data = await res.json();
        alert(data.error || 'فشل إضافة المصروف');
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('فشل إضافة المصروف');
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense.title || !editingExpense.amount) {
      alert('يرجى ملء العنوان والمبلغ');
      return;
    }

    if (editingExpense.currency !== 'LYD' && !editingExpense.exchange_rate) {
      alert('يرجى إدخال سعر الصرف');
      return;
    }

    try {
      const res = await fetch(`/api/general-expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingExpense)
      });

      if (res.ok) {
        await fetchExpenses();
        setEditingExpense(null);
      } else {
        const data = await res.json();
        alert(data.error || 'فشل تحديث المصروف');
      }
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('فشل تحديث المصروف');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;

    try {
      const res = await fetch(`/api/general-expenses?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const calculateAmountLyd = (amount, currency, exchangeRate) => {
    if (currency === 'LYD') {
      return parseFloat(amount) || 0;
    }
    return (parseFloat(amount) || 0) * (parseFloat(exchangeRate) || 0);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount_lyd) || 0), 0);

  const categories = ['إعلانات', 'رواتب', 'شحن', 'تغليف', 'عمولات', 'خدمات إنترنت', 'إيجار', 'أخرى'];

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

  return (
    <AuthGuard>
      <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '700', color: '#18375C' }}>
              المصروفات العامة
            </h1>
            <button
              onClick={() => setAddingExpense(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2caf76',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(44, 175, 118, 0.2)',
                fontFamily: 'Cairo'
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
              + إضافة مصروف
            </button>
          </div>

          {/* Total Summary */}
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1rem, 3vw, 2rem)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '2rem',
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '0.5rem' }}>إجمالي المصروفات</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ef4444' }}>
              {totalExpenses.toFixed(2)} <span style={{ fontSize: '1.5rem', color: '#6b7280' }}>LYD</span>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1rem, 3vw, 2rem)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '2rem',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#18375C', marginBottom: '1rem' }}>
              تصفية النتائج
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                  التصنيف
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">الكل</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={fetchExpenses}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#18375C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontFamily: 'Cairo'
                  }}
                >
                  بحث
                </button>
              </div>
            </div>
          </div>

          {/* Add/Edit Expense Form */}
          {(addingExpense || editingExpense) && (
            <div style={{
              backgroundColor: 'white',
              padding: 'clamp(1rem, 3vw, 2rem)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: '2rem',
              border: '2px solid #18375C'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#18375C', marginBottom: '1.5rem' }}>
                {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={editingExpense ? editingExpense.title : newExpense.title}
                    onChange={(e) => editingExpense 
                      ? setEditingExpense({ ...editingExpense, title: e.target.value })
                      : setNewExpense({ ...newExpense, title: e.target.value })
                    }
                    placeholder="مثال: إيجار المكتب، فاتورة كهرباء..."
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    الوصف (اختياري)
                  </label>
                  <textarea
                    value={editingExpense ? editingExpense.description : newExpense.description}
                    onChange={(e) => editingExpense 
                      ? setEditingExpense({ ...editingExpense, description: e.target.value })
                      : setNewExpense({ ...newExpense, description: e.target.value })
                    }
                    rows="2"
                    placeholder="تفاصيل إضافية..."
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingExpense ? editingExpense.amount : newExpense.amount}
                    onChange={(e) => editingExpense 
                      ? setEditingExpense({ ...editingExpense, amount: e.target.value })
                      : setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    العملة *
                  </label>
                  <select
                    value={editingExpense ? editingExpense.currency : newExpense.currency}
                    onChange={(e) => {
                      const currency = e.target.value;
                      if (editingExpense) {
                        setEditingExpense({ 
                          ...editingExpense, 
                          currency,
                          exchange_rate: currency === 'LYD' ? '' : editingExpense.exchange_rate
                        });
                      } else {
                        setNewExpense({ 
                          ...newExpense, 
                          currency,
                          exchange_rate: currency === 'LYD' ? '' : newExpense.exchange_rate
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="LYD">LYD (دينار ليبي)</option>
                    <option value="TRY">TRY (ليرة تركية)</option>
                    <option value="USD">USD (دولار أمريكي)</option>
                  </select>
                </div>

                {((editingExpense && editingExpense.currency !== 'LYD') || (!editingExpense && newExpense.currency !== 'LYD')) && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                      سعر الصرف → LYD *
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="0.0001"
                        value={editingExpense ? editingExpense.exchange_rate : newExpense.exchange_rate}
                        onChange={(e) => editingExpense 
                          ? setEditingExpense({ ...editingExpense, exchange_rate: e.target.value })
                          : setNewExpense({ ...newExpense, exchange_rate: e.target.value })
                        }
                        placeholder="0.0000"
                        style={{
                          flex: 1,
                          padding: '0.875rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      />
                      {((editingExpense && editingExpense.currency === 'TRY' && latestRates.try) || 
                        (!editingExpense && newExpense.currency === 'TRY' && latestRates.try)) && (
                        <button
                          type="button"
                          onClick={() => editingExpense 
                            ? setEditingExpense({ ...editingExpense, exchange_rate: latestRates.try })
                            : setNewExpense({ ...newExpense, exchange_rate: latestRates.try })
                          }
                          style={{
                            padding: '0.875rem',
                            backgroundColor: '#f3f4f6',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Cairo'
                          }}
                        >
                          آخر سعر
                        </button>
                      )}
                    </div>
                    {((editingExpense && editingExpense.currency !== 'LYD' && editingExpense.amount && editingExpense.exchange_rate) ||
                      (!editingExpense && newExpense.currency !== 'LYD' && newExpense.amount && newExpense.exchange_rate)) && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        = {calculateAmountLyd(
                          editingExpense ? editingExpense.amount : newExpense.amount,
                          editingExpense ? editingExpense.currency : newExpense.currency,
                          editingExpense ? editingExpense.exchange_rate : newExpense.exchange_rate
                        ).toFixed(2)} LYD
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    value={editingExpense ? editingExpense.expense_date : newExpense.expense_date}
                    onChange={(e) => editingExpense 
                      ? setEditingExpense({ ...editingExpense, expense_date: e.target.value })
                      : setNewExpense({ ...newExpense, expense_date: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    التصنيف (اختياري)
                  </label>
                  <select
                    value={editingExpense ? editingExpense.category : newExpense.category}
                    onChange={(e) => editingExpense 
                      ? setEditingExpense({ ...editingExpense, category: e.target.value })
                      : setNewExpense({ ...newExpense, category: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      fontFamily: 'Cairo'
                    }}
                  >
                    <option value="">اختر تصنيف...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setAddingExpense(false);
                    setEditingExpense(null);
                    setNewExpense({
                      title: '',
                      description: '',
                      amount: '',
                      currency: 'LYD',
                      exchange_rate: '',
                      expense_date: new Date().toISOString().split('T')[0],
                      category: ''
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
                    flex: '1 1 auto',
                    minWidth: '120px',
                    fontFamily: 'Cairo'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#18375C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    boxShadow: '0 4px 6px rgba(24, 55, 92, 0.25)',
                    flex: '1 1 auto',
                    minWidth: '120px',
                    fontFamily: 'Cairo'

                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0f2340';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#18375C';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {editingExpense ? 'حفظ التغييرات' : 'إضافة المصروف'}
                </button>
              </div>
            </div>
          )}

          {/* Expenses List */}
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1rem, 3vw, 2rem)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: '600', color: '#18375C', marginBottom: '1.5rem' }}>
              قائمة المصروفات ({expenses.length})
            </h2>

            {expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <div style={{ fontSize: '1.125rem' }}>لا توجد مصروفات</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>ابدأ بإضافة مصروف جديد</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>التاريخ</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>العنوان</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الوصف</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>المبلغ الأصلي</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>المبلغ (LYD)</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>التصنيف</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>
                          {new Date(expense.expense_date).toLocaleDateString('ar-LY')}
                        </td>
                        <td style={{ padding: '1rem', color: '#1f2937', fontWeight: '500' }}>
                          {expense.title}
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          {expense.description || '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#1f2937' }}>
                          {expense.amount} {expense.currency}
                          {expense.currency !== 'LYD' && expense.exchange_rate && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              @ {expense.exchange_rate}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#ef4444', fontWeight: '600' }}>
                          {parseFloat(expense.amount_lyd).toFixed(2)} LYD
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {expense.category && (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              borderRadius: '6px',
                              fontSize: '0.875rem'
                            }}>
                              {expense.category}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => setEditingExpense(expense)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#18375C',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontFamily: 'Cairo'
                              }}
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontFamily: 'Cairo'
                              }}
                            >
                              حذف
                            </button>
                          </div>
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
    </AuthGuard>
  );
}

