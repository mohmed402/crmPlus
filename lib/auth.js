import { supabase } from './supabase';

/**
 * Authenticate user with Supabase Auth
 * Supports both email and username login
 * Returns user data and session info
 */
export async function authenticateUser(identifier, password) {
  try {
    // First, check if identifier is email or username
    let email = identifier;
    
    // If it's not an email (doesn't contain @), look up email from users table
    if (!identifier.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', identifier)
        .single();
      
      if (userError) {
        console.error('Error looking up user by username:', userError);
        return null;
      }
      
      if (!user || !user.email) {
        console.error(`User not found with username: ${identifier}`);
        return null;
      }
      email = user.email;
      console.log(`Found email for username ${identifier}: ${email}`);
    }
    
    console.log(`Attempting to sign in with email: ${email}`);
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase Auth error:', error.message);
      return null;
    }
    
    if (!data.user || !data.session) {
      console.error('No user or session returned from Supabase Auth');
      return null;
    }
    
    console.log(`Successfully authenticated with Supabase. User ID: ${data.user.id}`);
    
    // Get user role from users table (sync with Supabase auth)
    let { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, username, role, supabase_user_id')
      .eq('email', email)
      .single();
    
    // If user doesn't exist in database but exists in Supabase Auth, create them
    if (dbError && dbError.code === 'PGRST116') {
      console.log(`User not found in database, creating user record for: ${email}`);
      
      // Try to get username from Supabase user metadata or use email prefix
      const username = data.user.user_metadata?.username || email.split('@')[0];
      
      // Determine role based on email or metadata
      let role = data.user.user_metadata?.role;
      if (!role) {
        // Assign role based on email
        if (email === 'admin@crmplus.com' || email.startsWith('admin@') || username === 'admin') {
          role = 'owner';
        } else {
          role = 'worker';
        }
      }
      
      // Create user in database
      // Note: passwords are handled by Supabase Auth, not stored in our database
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email,
          username: username,
          role: role,
          supabase_user_id: data.user.id
        })
        .select('id, username, role, supabase_user_id')
        .single();
      
      if (createError) {
        console.error('Error creating user in database:', createError);
        return null;
      }
      
      dbUser = newUser;
      console.log(`Created new user in database. ID: ${dbUser.id}, Username: ${dbUser.username}, Role: ${dbUser.role}`);
    } else if (dbError) {
      console.error('Error looking up user in database:', dbError);
      return null;
    }
    
    if (!dbUser) {
      console.error(`User not found in database with email: ${email}`);
      return null;
    }
    
    // Update supabase_user_id if it's missing
    if (!dbUser.supabase_user_id) {
      console.log(`Updating supabase_user_id for user: ${dbUser.id}`);
      await supabase
        .from('users')
        .update({ supabase_user_id: data.user.id })
        .eq('id', dbUser.id);
    }
    
    console.log(`Successfully retrieved user from database. ID: ${dbUser.id}, Role: ${dbUser.role}`);
    
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: email,
      role: dbUser.role,
      supabaseUserId: data.user.id,
      session: data.session, // Include session for cookie setting
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get user by ID from database
 */
export async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting user by id:', error);
    return null;
  }
  
  return data;
}

/**
 * Get user by Supabase user ID
 */
export async function getUserBySupabaseId(supabaseUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role')
    .eq('supabase_user_id', supabaseUserId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting user by Supabase id:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a new user in Supabase Auth and sync with users table
 */
export async function createUser(email, password, username, role) {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
        },
      },
    });
    
    if (authError || !authData.user) {
      throw authError || new Error('Failed to create user');
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
      .select('id')
      .single();
    
    if (dbError) {
      throw dbError;
    }
    
    return {
      id: dbUser.id,
      username,
      email,
      role,
      supabaseUserId: authData.user.id,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get current session from Supabase
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    return null;
  }
  return session;
}

/**
 * Sign out from Supabase
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return !error;
}
