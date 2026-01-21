import { createClient } from '@supabase/supabase-js';

// Use the same Supabase URL and anon key from your project
const supabaseUrl = 'https://qzcyjycqckchhjkfntqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Y3lqeWNxY2tjaGhqa2ZudHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDU1MTcsImV4cCI6MjA4NDE4MTUxN30.kPsTGMpJVqEJsRVVpQRQ2QbVyHC-EjpZ0h5v8dHBnME';

// Create Supabase client for web (different from React Native version)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For web, we don't need AsyncStorage - uses localStorage by default
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});