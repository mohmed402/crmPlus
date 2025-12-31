'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthGuard({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        console.log('[AuthGuard] Auth response:', data);
        if (!data.user) {
          console.log('[AuthGuard] No user, redirecting to /login');
          router.push('/login');
          return;
        }
        
        if (requiredRole && data.user.role !== requiredRole) {
          console.log('[AuthGuard] User role mismatch. Required:', requiredRole, 'Got:', data.user.role);
          router.push('/orders');
          return;
        }
        
        console.log('[AuthGuard] User authenticated:', data.user);
        setUser(data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.log('[AuthGuard] Auth error:', error);
        router.push('/login');
      });
  }, [router, requiredRole]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}

