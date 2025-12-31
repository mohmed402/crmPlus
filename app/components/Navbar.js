'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav style={{
      backgroundColor: '#18375C',
      color: 'white',
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '0.5rem',
          '@media (max-width: 768px)': {
            display: 'block'
          }
        }}
        className="mobile-menu-btn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </>
          )}
        </svg>
      </button>

      <div style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)', alignItems: 'center' }} className="desktop-menu">
        <Link href="/orders" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none'
        }}>
          <Image 
            src="/assets/logo.png" 
            alt="CRMPlus Logo" 
            width={80} 
            height={50}
            style={{ objectFit: 'contain', backgroundColor: 'white', borderRadius: '10px' }}
          />
        </Link>
        <Link href="/orders" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'white', 
          textDecoration: 'none',
          fontWeight: pathname === '/orders' || pathname === '/orders/new' ? '700' : '400',
          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          transition: 'opacity 0.2s',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          backgroundColor: pathname === '/orders' || pathname === '/orders/new' ? 'rgba(255,255,255,0.15)' : 'transparent',
          whiteSpace: 'nowrap'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          صفحة الطلبات
        </Link>
        {user.role === 'owner' && (
          <>
            <Link href="/owner" style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white', 
              textDecoration: 'none',
              fontWeight: pathname === '/owner' ? '700' : '400',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              transition: 'opacity 0.2s',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: pathname === '/owner' ? 'rgba(255,255,255,0.15)' : 'transparent',
              whiteSpace: 'nowrap'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"></path>
              </svg>
              صفحة التقرير
            </Link>
            <Link href="/admin/customers" style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white', 
              textDecoration: 'none',
              fontWeight: pathname === '/admin/customers' ? '700' : '400',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              transition: 'opacity 0.2s',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: pathname === '/admin/customers' ? 'rgba(255,255,255,0.15)' : 'transparent',
              whiteSpace: 'nowrap'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              إدارة العملاء
            </Link>
            <Link href="/admin/users" style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white', 
              textDecoration: 'none',
              fontWeight: pathname === '/admin/users' ? '700' : '400',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              transition: 'opacity 0.2s',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: pathname === '/admin/users' ? 'rgba(255,255,255,0.15)' : 'transparent',
              whiteSpace: 'nowrap'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              إدارة المستخدمين
            </Link>
            <Link href="/expenses" style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white', 
              textDecoration: 'none',
              fontWeight: pathname === '/expenses' ? '700' : '400',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              transition: 'opacity 0.2s',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: pathname === '/expenses' ? 'rgba(255,255,255,0.15)' : 'transparent',
              whiteSpace: 'nowrap'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              المصروفات
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#18375C',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          padding: '1rem'
        }} className="mobile-menu">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link 
              href="/orders" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'white', 
                textDecoration: 'none',
                fontWeight: pathname === '/orders' || pathname === '/orders/new' ? '700' : '400',
                fontSize: '1rem',
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: pathname === '/orders' || pathname === '/orders/new' ? 'rgba(255,255,255,0.15)' : 'transparent'
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
              صفحة الطلبات
            </Link>
            {user.role === 'owner' && (
              <>
                <Link 
                  href="/owner" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: pathname === '/owner' ? '700' : '400',
                    fontSize: '1rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: pathname === '/owner' ? 'rgba(255,255,255,0.15)' : 'transparent'
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"></path>
                  </svg>
                  صفحة التقرير
                </Link>
                <Link 
                  href="/admin/customers" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: pathname === '/admin/customers' ? '700' : '400',
                    fontSize: '1rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: pathname === '/admin/customers' ? 'rgba(255,255,255,0.15)' : 'transparent'
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  إدارة العملاء
                </Link>
                <Link 
                  href="/admin/users" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: pathname === '/admin/users' ? '700' : '400',
                    fontSize: '1rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: pathname === '/admin/users' ? 'rgba(255,255,255,0.15)' : 'transparent'
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                  إدارة المستخدمين
                </Link>
                <Link 
                  href="/expenses" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: pathname === '/expenses' ? '700' : '400',
                    fontSize: '1rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: pathname === '/expenses' ? 'rgba(255,255,255,0.15)' : 'transparent'
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  المصروفات
                </Link>
              </>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{user.username} ({user.role === 'owner' ? 'مالك' : 'عامل'})</span>
              </div>
              <button 
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="desktop-user-menu">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>{user.username} ({user.role === 'owner' ? 'مالك' : 'عامل'})</span>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.25)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          تسجيل الخروج
        </button>
      </div>

      {/* CSS for responsive behavior */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .desktop-user-menu {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}

