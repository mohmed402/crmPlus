import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getUserBySupabaseId } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const userId = cookieStore.get('user_id')?.value;
    
    console.log('[/api/auth/me] Checking authentication...', {
      hasAccessToken: !!accessToken,
      hasUserId: !!userId
    });
    
    // Try to get user from Supabase session first
    if (accessToken) {
      const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      
      // Set the session
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);
      
      if (!error && supabaseUser) {
        console.log('[/api/auth/me] Supabase user found:', supabaseUser.id);
        // Get user from database using Supabase user ID
        const dbUser = await getUserBySupabaseId(supabaseUser.id);
        if (dbUser) {
          console.log('[/api/auth/me] DB user found:', { id: dbUser.id, username: dbUser.username, role: dbUser.role });
          return NextResponse.json({ 
            user: { 
              id: dbUser.id, 
              username: dbUser.username, 
              role: dbUser.role 
            } 
          });
        } else {
          console.log('[/api/auth/me] No DB user found for Supabase ID:', supabaseUser.id);
        }
      } else {
        console.log('[/api/auth/me] Supabase auth error or no user:', error?.message);
      }
    }
    
    // Fallback to cookie-based auth (backward compatibility)
    if (userId) {
      console.log('[/api/auth/me] Trying fallback auth with user_id:', userId);
      const { getUserById } = await import('@/lib/auth');
      const user = await getUserById(parseInt(userId));
      
      if (user) {
        console.log('[/api/auth/me] Fallback user found:', { id: user.id, username: user.username, role: user.role });
        return NextResponse.json({ 
          user: { 
            id: user.id, 
            username: user.username, 
            role: user.role 
          } 
        });
      } else {
        console.log('[/api/auth/me] No user found with id:', userId);
      }
    }
    
    console.log('[/api/auth/me] No authentication found, returning null');
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null });
  }
}
