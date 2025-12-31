/**
 * Script to sync existing Supabase Auth users to the users table
 * 
 * This script will:
 * 1. Get all users from Supabase Auth
 * 2. Check if they exist in the users table
 * 3. Create them in the users table if they don't exist
 * 
 * Usage: node scripts/sync-auth-users.js
 * 
 * Make sure to set these environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (required for admin operations)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function syncUsers() {
  try {
    console.log('Fetching users from Supabase Auth...');
    
    // Get all users from Supabase Auth (requires service role key)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users from Supabase Auth:', authError);
      process.exit(1);
    }
    
    if (!users || users.length === 0) {
      console.log('No users found in Supabase Auth');
      return;
    }
    
    console.log(`Found ${users.length} users in Supabase Auth\n`);
    
    for (const authUser of users) {
      const email = authUser.email;
      if (!email) {
        console.log(`Skipping user ${authUser.id} - no email`);
        continue;
      }
      
      // Check if user exists in database
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        console.log(`✓ User ${email} already exists in database (ID: ${existingUser.id})`);
        
        // Update supabase_user_id if missing
        if (!existingUser.supabase_user_id) {
          await supabase
            .from('users')
            .update({ supabase_user_id: authUser.id })
            .eq('id', existingUser.id);
          console.log(`  Updated supabase_user_id for ${email}`);
        }
        continue;
      }
      
      // Create user in database
      const username = authUser.user_metadata?.username || email.split('@')[0];
      const role = authUser.user_metadata?.role || 'worker';
      
      console.log(`Creating user: ${email} (username: ${username}, role: ${role})`);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email,
          username: username,
          role: role,
          supabase_user_id: authUser.id
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error(`  ✗ Error creating user ${email}:`, createError.message);
      } else {
        console.log(`  ✓ Created user ${email} (ID: ${newUser.id})`);
      }
    }
    
    console.log('\nSync completed!');
    
  } catch (error) {
    console.error('Sync error:', error);
    process.exit(1);
  }
}

syncUsers();

