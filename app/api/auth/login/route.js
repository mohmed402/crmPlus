import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    console.log(`Login attempt for: ${username}`);
    
    // Authenticate with Supabase Auth (this already signs in and returns session)
    const authResult = await authenticateUser(username, password);
    
    if (!authResult || !authResult.session) {
      console.error(`Authentication failed for: ${username}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log(`Authentication successful for user: ${authResult.username} (ID: ${authResult.id})`);
    
    const user = {
      id: authResult.id,
      username: authResult.username,
      role: authResult.role
    };
    const session = authResult.session;
    
    // Set session cookies
    const cookieStore = await cookies();
    
    // Set Supabase session tokens
    cookieStore.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    cookieStore.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    
    // Also set user info cookies for backward compatibility
    cookieStore.set('user_id', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    cookieStore.set('user_role', user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    console.log(`Cookies set for user ${user.username}:`, {
      user_id: user.id,
      user_role: user.role
    });
    
    return NextResponse.json({ 
      success: true,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
