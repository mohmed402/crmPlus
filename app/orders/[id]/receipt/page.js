'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import { AuthGuard } from '../../../components/AuthGuard';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        if (data.products) {
          setProducts(data.products);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('ar-LY', options);
  };

  const calculateTotal = () => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.selling_price_lyd) || 0;
      const quantity = parseInt(product.quantity) || 1;
      return total + (price * quantity);
    }, 0);
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

  const total = calculateTotal();

  return (
    <AuthGuard>
      <div style={{ direction: 'rtl', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: '800px', margin: '0 auto' }}>
          {/* Print Button - Hidden when printing */}
          <div style={{ marginBottom: '2rem', textAlign: 'left', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} className="no-print">
            <button
              onClick={handlePrint}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#18375C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              طباعة الإيصال
            </button>
            <button
              onClick={() => router.back()}
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
              رجوع
            </button>
          </div>

          {/* Receipt Content */}
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1.5rem, 4vw, 3rem)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            fontFamily: "'Cairo', sans-serif",
            maxWidth: '800px',
            margin: '0 auto'
          }} id="receipt">
            {/* Header with Logo */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <div>
                <Image 
                  src="/assets/logo.png" 
                  alt="CRMPlus Logo" 
                  width={120} 
                  height={60}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#18375C',
                  marginBottom: '0.5rem',
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  إيصال استلام
                </h1>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  Receipt
                </p>
              </div>
            </div>

            {/* Order Info */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'clamp(1rem, 2vw, 1.5rem)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.25rem',
                    fontFamily: "'Cairo', sans-serif"
                  }}>
                    رقم الطلب / Order ID
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#18375C',
                    fontFamily: "'Cairo', sans-serif"
                  }}>
                    #{order.id}
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.25rem',
                    fontFamily: "'Cairo', sans-serif"
                  }}>
                    التاريخ / Date
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#1f2937',
                    fontFamily: "'Cairo', sans-serif"
                  }}>
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{
                backgroundColor: '#f9fafb',
                padding: 'clamp(1rem, 2vw, 1.5rem)',
                borderRadius: '6px',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  fontWeight: '600',
                  color: '#18375C',
                  marginBottom: '1rem',
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  معلومات العميل / Customer Information
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      الاسم / Name
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#1f2937',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      {order.customer_name || '-'}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      الهاتف / Phone
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#1f2937',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      {order.phone || '-'}
                    </p>
                  </div>
                  {order.address && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.25rem',
                        fontFamily: "'Cairo', sans-serif"
                      }}>
                        العنوان / Address
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1f2937',
                        fontFamily: "'Cairo', sans-serif"
                      }}>
                        {order.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div style={{ marginBottom: '2rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <h2 style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                fontWeight: '600',
                color: '#18375C',
                marginBottom: '1rem',
                fontFamily: "'Cairo', sans-serif"
              }}>
                المنتجات / Products
              </h2>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: "'Cairo', sans-serif",
                minWidth: '500px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#18375C',
                      fontSize: '0.875rem',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      المنتج / Product
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#18375C',
                      fontSize: '0.875rem',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      الكمية / Qty
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#18375C',
                      fontSize: '0.875rem',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      السعر / Price
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#18375C',
                      fontSize: '0.875rem',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      الإجمالي / Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const price = parseFloat(product.selling_price_lyd) || 0;
                    const quantity = parseInt(product.quantity) || 1;
                    const itemTotal = price * quantity;
                    return (
                      <tr key={index} style={{
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          color: '#1f2937',
                          fontFamily: "'Cairo', sans-serif"
                        }}>
                          <div>
                            <div style={{
                              fontWeight: '500',
                              marginBottom: '0.25rem',
                              fontFamily: "'Cairo', sans-serif"
                            }}>
                              {product.product_name}
                            </div>
                            {product.size && (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                fontFamily: "'Cairo', sans-serif"
                              }}>
                                الحجم: {product.size}
                              </div>
                            )}
                            {product.product_code && (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                fontFamily: "'Cairo', sans-serif"
                              }}>
                                الكود: {product.product_code}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#1f2937',
                          fontFamily: "'Cairo', sans-serif"
                        }}>
                          {quantity}
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1f2937',
                          fontFamily: "'Cairo', sans-serif"
                        }}>
                          {price.toFixed(2)} LYD
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontWeight: '500',
                          color: '#1f2937',
                          fontFamily: "'Cairo', sans-serif"
                        }}>
                          {itemTotal.toFixed(2)} LYD
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '300px',
                padding: '1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#18375C',
                    fontFamily: "'Cairo', sans-serif"
                  }}>
                    الإجمالي / Total:
                  </span>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#18375C',
                    fontFamily: "'Cairo', sans-serif"
                  }}>
                    {total.toFixed(2)} LYD
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                marginBottom: '2rem',
                border: '1px solid #fde68a'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '0.5rem',
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  ملاحظات / Notes:
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#78350f',
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  {order.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div style={{
              paddingTop: '2rem',
              borderTop: '2px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
                fontFamily: "'Cairo', sans-serif"
              }}>
                شكراً لتعاملكم معنا / Thank you for your business
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                fontFamily: "'Cairo', sans-serif"
              }}>
                CRMPlus - نظام إدارة الطلبات
              </p>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              background-color: white !important;
            }
            .no-print {
              display: none !important;
            }
            #receipt {
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
            }
            nav {
              display: none !important;
            }
            div[style*="padding: 2rem"] {
              padding: 0 !important;
            }
            div[style*="maxWidth: 800px"] {
              max-width: 100% !important;
            }
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}

