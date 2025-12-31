// Supabase client configuration
// This provides a server-side Supabase client for use in API routes and server components

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
}

// Create a single Supabase client for use in server-side code (API routes, server components)
// Uses service role key if available (bypasses RLS), otherwise uses anon key
// For client-side usage, create a separate client in a client component
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: false, // Don't persist session on server
    autoRefreshToken: false, // Don't auto-refresh on server
  },
});

if (supabaseServiceRoleKey) {
  console.log('✅ Using Supabase service role key (bypasses RLS)');
} else {
  console.warn('⚠️  Using anon key - RLS policies must be configured for database operations to work');
}

// Helper function to create a Supabase client with service role key (for admin operations)
// Use this only in secure server-side contexts, never expose the service role key to the client
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service role client');
  }
  
  return createClient(supabaseUrl || '', serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Example usage for real-time subscriptions (client-side only):
// const subscription = supabase
//   .channel('orders')
//   .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
//     console.log('Change received!', payload);
//   })
//   .subscribe();
