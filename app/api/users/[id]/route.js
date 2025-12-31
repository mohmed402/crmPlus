import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getUserBySupabaseId } from '@/lib/auth';

// PUT - Update user
export async function PUT(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();
    const { username, email, role, password } = body;

    // Validate input
    if (!username || !email || !role) {
      return NextResponse.json({ error: 'Username, email, and role are required' }, { status: 400 });
    }

    if (!['owner', 'worker'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get user's supabase_user_id
    const { data: existingUser, error: getUserError } = await supabase
      .from('users')
      .select('supabase_user_id')
      .eq('id', id)
      .single();

    if (getUserError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user in Supabase Auth
    const authUpdateData = {
      email,
      user_metadata: {
        username,
        role,
      },
    };

    // Only update password if provided
    if (password && password.trim().length > 0) {
      authUpdateData.password = password;
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(
      existingUser.supabase_user_id,
      authUpdateData
    );

    if (authError) {
      console.error('Error updating user in Supabase Auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        username,
        email,
        role,
      })
      .eq('id', id)
      .select('id, username, email, role, created_at')
      .single();

    if (updateError) {
      console.error('Error updating user in database:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error in PUT /api/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
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

    const { id } = await params;

    // Prevent deleting yourself
    if (parseInt(id) === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get user's supabase_user_id
    const { data: existingUser, error: getUserError } = await supabase
      .from('users')
      .select('supabase_user_id')
      .eq('id', id)
      .single();

    if (getUserError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete from Supabase Auth first
    const { error: authError } = await supabase.auth.admin.deleteUser(
      existingUser.supabase_user_id
    );

    if (authError) {
      console.error('Error deleting user from Supabase Auth:', authError);
      // Continue with database deletion even if auth deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting user from database:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

