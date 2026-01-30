import { createClient } from '@supabase/supabase-js';

// Use environment variables - Vite uses import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qzcyjycqckchhjkfntqb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Y3lqeWNxY2tjaGhqa2ZudHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDU1MTcsImV4cCI6MjA4NDE4MTUxN30.kPsTGMpJVqEJsRVVpQRQ2QbVyHC-EjpZ0h5v8dHBnME';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Y3lqeWNxY2tjaGhqa2ZudHFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYwNTUxNywiZXhwIjoyMDg0MTgxNTE3fQ.8TOX-VtPm7XEoKu7a0_A1jCUFWdNINVBzKPsRdq0B7E';

// Create Supabase client for web (different from React Native version)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For web, we don't need AsyncStorage - uses localStorage by default
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Create Admin client for backend/admin operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

window.supabase = supabase;