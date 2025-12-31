'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { AuthGuard } from '@/app/components/AuthGuard';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'worker',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
        console.log("here is the data", data);
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        setError('ليس لديك صلاحية للوصول إلى هذه الصفحة');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'worker',
      });
    }
    setShowModal(true);
    setError('');
    setSuccessMessage('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'worker',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      setSuccessMessage(editingUser ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح');
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.message || 'فشل في حفظ المستخدم');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccessMessage('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'فشل في حذف المستخدم');
    }
  };

  return (
    <AuthGuard requiredRole="owner">
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Navbar />
      <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#18375C' }}>
            إدارة المستخدمين
          </h1>
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#2caf76',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'background-color 0.2s',
              fontFamily: 'Cairo',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#234a78'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#18375C'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            إضافة مستخدم جديد
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #fcc',
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: '#efe',
            color: '#3a3',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #cfc',
          }}>
            {successMessage}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: '#666' }}>
            جاري التحميل...
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>المعرف</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>اسم المستخدم</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>الدور</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>تاريخ الإنشاء</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#495057' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                      لا توجد مستخدمين
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem', color: '#495057' }}>{user.id}</td>
                      <td style={{ padding: '1rem', color: '#495057', fontWeight: '500' }}>{user.username}</td>
                      <td style={{ padding: '1rem', color: '#495057' }}>{user.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          backgroundColor: user.role === 'owner' ? '#d4edda' : '#d1ecf1',
                          color: user.role === 'owner' ? '#155724' : '#0c5460',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}>
                          {user.role === 'owner' ? 'مالك' : 'عامل'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#6c757d', fontSize: '0.875rem' }}>
                        {new Date(user.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenModal(user)}
                            style={{
                              backgroundColor: '#18375C',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              transition: 'background-color 0.2s',
                              fontFamily: 'Cairo',
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#18375C'}
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              transition: 'background-color 0.2s',
                              fontFamily: 'Cairo',
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              color: '#18375C',
            }}>
              {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#495057',
                }}>
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#495057',
                }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#495057',
                }}>
                  كلمة المرور {editingUser && '(اتركه فارغاً إذا لم ترغب في التغيير)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#495057',
                }}>
                  الدور
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="worker">عامل</option>
                  <option value="owner">مالك</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    flex: '1 1 auto',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#18375C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    flex: '1 1 auto',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#234a78'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#18375C'}
                >
                  {editingUser ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

