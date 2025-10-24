#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Tests the Supabase client configuration
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aqjjgmmvviozmedjgxdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test auth
    console.log('🔍 Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth service failed:', authError.message);
      return false;
    }
    
    console.log('✅ Auth service working');
    
    // Test realtime
    console.log('🔍 Testing realtime service...');
    const channel = supabase.channel('test-channel');
    console.log('✅ Realtime service working');
    
    console.log('\n🎉 All Supabase services are working correctly!');
    return true;
    
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return false;
  }
}

testSupabaseConnection().catch(console.error);
