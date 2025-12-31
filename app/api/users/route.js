import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getUserBySupabaseId } from '@/lib/auth';

// GET all users
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const userId = cookieStore.get('user_id')?.value;

    if (!accessToken && !userId) {
      console.log('[/api/users GET] No authentication found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user - try by user_id first (simpler)
    let currentUser = null;
    if (userId) {
      const { getUserById } = await import('@/lib/auth');
      currentUser = await getUserById(parseInt(userId));
    }
    
    // If not found by userId, try by Supabase token
    if (!currentUser && accessToken) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
      
      const { data: { user: supabaseUser } } = await supabase.auth.getUser(accessToken);
      if (supabaseUser) {
        currentUser = await getUserBySupabaseId(supabaseUser.id);
      }
    }
    
    if (!currentUser || currentUser.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 });
    }

    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const userId = cookieStore.get('user_id')?.value;

    if (!accessToken && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user - try by user_id first (simpler)
    let currentUser = null;
    if (userId) {
      const { getUserById } = await import('@/lib/auth');
      currentUser = await getUserById(parseInt(userId));
    }
    
    // If not found by userId, try by Supabase token
    if (!currentUser && accessToken) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
      
      const { data: { user: supabaseUser } } = await supabase.auth.getUser(accessToken);
      if (supabaseUser) {
        currentUser = await getUserBySupabaseId(supabaseUser.id);
      }
    }
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (currentUser.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, username, role } = body;

    // Validate input
    if (!email || !password || !username || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['owner', 'worker'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username,
        role,
      },
    });

    if (authError) {
      console.error('Error creating user in Supabase Auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create user in users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        role,
        supabase_user_id: authData.user.id
      })
      .select('id, username, email, role, created_at')
      .single();

    if (dbError) {
      console.error('Error creating user in database:', dbError);
      // Cleanup: delete from Supabase Auth if database insert failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create user in database' }, { status: 500 });
    }

    return NextResponse.json({ user: dbUser }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

