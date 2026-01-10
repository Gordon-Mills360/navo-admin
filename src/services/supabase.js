import { createClient } from '@supabase/supabase-js';

// Use the same Supabase URL and anon key from your project
const supabaseUrl = 'https://lwepbrvqvbrbpjylrjsx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXBicnZxdmJyYnBqeWxyanN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0ODA5OTcsImV4cCI6MjA4MzA1Njk5N30.BtZEH_qZkAmOnhABZ6JJJ04OVMVDfqcdaBeGZTPXhsk';

// Create Supabase client for web (different from React Native version)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For web, we don't need AsyncStorage - uses localStorage by default
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});