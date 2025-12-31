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
        // Get user from database using Supabase user ID
        const dbUser = await getUserBySupabaseId(supabaseUser.id);
        if (dbUser) {
          return NextResponse.json({ 
            user: { 
              id: dbUser.id, 
              username: dbUser.username, 
              role: dbUser.role 
            } 
          });
        }
      }
    }
    
    // Fallback to cookie-based auth (backward compatibility)
    if (userId) {
      const { getUserById } = await import('@/lib/auth');
      const user = await getUserById(parseInt(userId));
      
      if (user) {
        return NextResponse.json({ 
          user: { 
            id: user.id, 
            username: user.username, 
            role: user.role 
          } 
        });
      }
    }
    
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null });
  }
}
