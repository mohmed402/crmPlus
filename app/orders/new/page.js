'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import { AuthGuard } from '../../components/AuthGuard';

export default function NewOrderPage() {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: '',
    notes: '',
    status: 'New'
  });
  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    whatsapp: ''
  });
  const [editingSocialMedia, setEditingSocialMedia] = useState(null);
  const [products, setProducts] = useState([{ product_name: '', size: '', product_code: '', product_link: '', quantity: 1, selling_price_lyd: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerFound, setCustomerFound] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = async (e) => {
    const phone = e.target.value;
    setFormData({
      ...formData,
      phone: phone
    });

    // Search for customer by phone
    if (phone && phone.length >= 3) {
      setSearchingCustomer(true);
      try {
        const res = await fetch(`/api/customers/search?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (res.ok && data.customer) {
          setCustomerFound(data.customer);
          setFormData({
            ...formData,
            phone: phone,
            customer_name: data.customer.name,
            address: data.customer.address || ''
          });
          setSocialMedia({
            facebook: data.customer.facebook || '',
            whatsapp: data.customer.whatsapp || ''
          });
        } else {
          setCustomerFound(null);
        }
      } catch (error) {
        console.error('Failed to search customer:', error);
      }
      setSearchingCustomer(false);
    } else {
      setCustomerFound(null);
    }
  };

  const handleSocialMediaChange = (e) => {
    setSocialMedia({
      ...socialMedia,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate products
    const validProducts = products.filter(p => p.product_name.trim() !== '');
    if (validProducts.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products: validProducts,
          socialMedia: socialMedia
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      router.push('/orders');
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const addProduct = () => {
    setProducts([...products, { product_name: '', size: '', product_code: '', product_link: '', quantity: 1, selling_price_lyd: '' }]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  return (
    <AuthGuard>
      <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#18375C', marginBottom: '2rem' }}>
            إدخال طلب جديد
          </h1>

          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#18375C', marginBottom: '1rem' }}>
                معلومات العميل
              </h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  اسم العميل *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  الهاتف {searchingCustomer && <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>(جاري البحث...)</span>}
                  {customerFound && <span style={{ color: '#2caf76', fontSize: '0.875rem', marginRight: '0.5rem' }}>✓ تم العثور على العميل</span>}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="ابحث بالرقم أو أدخل رقم جديد"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: customerFound ? '2px solid #2caf76' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  العنوان
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
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

              {/* Social Media Section */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#18375C', marginBottom: '1rem' }}>
                  حسابات التواصل الاجتماعي (اختياري)
                </h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* Facebook */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {editingSocialMedia === 'facebook' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="url"
                          name="facebook"
                          value={socialMedia.facebook}
                          onChange={handleSocialMediaChange}
                          placeholder="https://facebook.com/..."
                          onBlur={() => setEditingSocialMedia(null)}
                          autoFocus
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            minWidth: '200px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditingSocialMedia(null)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSocialMedia('facebook')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: socialMedia.facebook ? '#1877f2' : '#f3f4f6',
                          color: socialMedia.facebook ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          fontFamily: 'inherit'
                        }}
                      >
                        <Image 
                          src="/assets/icons/facebook.png" 
                          alt="Facebook" 
                          width={20} 
                          height={20}
                          style={{ 
                            filter: socialMedia.facebook ? 'none' : 'grayscale(100%) opacity(0.6)',
                            objectFit: 'contain'
                          }}
                        />
                        {socialMedia.facebook ? 'Facebook' : 'إضافة Facebook'}
                      </button>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {editingSocialMedia === 'whatsapp' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="tel"
                          name="whatsapp"
                          value={socialMedia.whatsapp}
                          onChange={handleSocialMediaChange}
                          placeholder="رقم الواتساب"
                          onBlur={() => setEditingSocialMedia(null)}
                          autoFocus
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            minWidth: '200px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditingSocialMedia(null)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSocialMedia('whatsapp')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: socialMedia.whatsapp ? '#25d366' : '#f3f4f6',
                          color: socialMedia.whatsapp ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          fontFamily: 'inherit'
                        }}
                      >
                        <Image 
                          src="/assets/icons/whatsapp.png" 
                          alt="WhatsApp" 
                          width={30} 
                          height={20}
                          style={{ 
                            filter: socialMedia.whatsapp ? 'none' : 'grayscale(100%) opacity(0.6)',
                            objectFit: 'contain'
                          }}
                        />
                        {socialMedia.whatsapp ? 'WhatsApp' : 'إضافة WhatsApp'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#18375C' }}>
                  المنتجات
                </h2>
                <button
                  type="button"
                  onClick={addProduct}
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
              </div>

              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '6px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>اسم المنتج *</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الحجم</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>رمز المنتج</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>رابط المنتج</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الكمية</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>سعر البيع (LYD)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#18375C' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="text"
                            value={product.product_name}
                            onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontFamily: 'inherit'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="text"
                            value={product.size}
                            onChange={(e) => updateProduct(index, 'size', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontFamily: 'inherit'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="text"
                            value={product.product_code || ''}
                            onChange={(e) => updateProduct(index, 'product_code', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontFamily: 'inherit'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="url"
                            value={product.product_link || ''}
                            onChange={(e) => updateProduct(index, 'product_link', e.target.value)}
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
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontFamily: 'inherit'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.selling_price_lyd || ''}
                            onChange={(e) => updateProduct(index, 'selling_price_lyd', e.target.value)}
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
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: '500'
                              }}
                            >
                              حذف
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#18375C', marginBottom: '1rem' }}>
                معلومات إضافية
              </h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  ملاحظات
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  الحالة
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="New">جديد</option>
                  <option value="Shipped">تم الشحن</option>
                  <option value="Delivered">تم التسليم</option>
                  <option value="Cancelled">ملغي</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#9ca3af' : '#18375C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.2s, transform 0.1s',
                  boxShadow: loading ? 'none' : '0 2px 4px rgba(24, 55, 92, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#0f2340';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#18375C';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الطلب'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}

