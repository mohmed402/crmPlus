/**
 * Migration script to migrate existing users to Supabase Auth
 * 
 * This script:
 * 1. Reads existing users from the database
 * 2. Creates them in Supabase Auth
 * 3. Updates the users table with email and supabase_user_id
 * 
 * Usage: node scripts/migrate-users-to-supabase.js
 * 
 * Make sure to set these environment variables:
 * - DATABASE_URL
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (for creating users)
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

async function migrateUsers() {
  try {
    console.log('Starting user migration...');
    
    // Get all users from database
    const result = await pool.query('SELECT id, username, password, role FROM users');
    const users = result.rows;
    
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      try {
        // Generate email from username if not exists
        const email = user.email || `${user.username}@crmplus.local`;
        
        console.log(`Migrating user: ${user.username} (${email})`);
        
        // Create user in Supabase Auth using admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: user.password, // Supabase will hash it
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            username: user.username,
            role: user.role,
          },
        });
        
        if (authError) {
          // If user already exists, try to get them
          if (authError.message.includes('already registered')) {
            console.log(`  User ${email} already exists in Supabase, fetching...`);
            const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
            if (existingUser?.user) {
              await pool.query(
                'UPDATE users SET email = $1, supabase_user_id = $2 WHERE id = $3',
                [email, existingUser.user.id, user.id]
              );
              console.log(`  ✓ Updated user ${user.username} with existing Supabase user`);
              continue;
            }
          }
          throw authError;
        }
        
        if (!authData.user) {
          throw new Error('Failed to create user in Supabase');
        }
        
        // Update users table with email and supabase_user_id
        await pool.query(
          'UPDATE users SET email = $1, supabase_user_id = $2 WHERE id = $3',
          [email, authData.user.id, user.id]
        );
        
        console.log(`  ✓ Migrated user ${user.username} (ID: ${user.id})`);
      } catch (error) {
        console.error(`  ✗ Failed to migrate user ${user.username}:`, error.message);
      }
    }
    
    console.log('\nMigration completed!');
    console.log('\nNote: Users can now login with their email or username.');
    console.log('Default passwords remain the same.');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateUsers();

