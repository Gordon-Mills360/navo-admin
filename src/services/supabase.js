import { createClient } from '@supabase/supabase-js';

// Use environment variables - Vite uses import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Create SINGLE Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
    debug: import.meta.env.DEV
  },
  global: {
    headers: {
      'x-application-name': 'navo-admin-panel',
      'x-client-info': 'supabase-js/2.90.1'
    },
    fetch: (...args) => {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds
      
      return fetch(...args, { 
        signal: controller.signal,
        timeout: 30000 // 30 seconds
      }).finally(() => clearTimeout(timeoutId));
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 5, // Reduced from 10
      timeout: 15000, // Add 15-second WebSocket timeout
      heartbeatIntervalMs: 30000 // Add WebSocket heartbeat
    }
  }
});

// For admin operations that need service role, create a separate client ONLY when needed
let serviceRoleClient = null;
export const getAdminClient = () => {
  if (!supabaseServiceKey) {
    console.warn('Service role key not available. Using regular client.');
    return supabase;
  }
  
  if (!serviceRoleClient) {
    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'x-application-name': 'navo-admin-service',
          'x-client-info': 'supabase-js/2.90.1-service'
        }
      }
    });
  }
  return serviceRoleClient;
};

// Helper to check if we're connected
export const checkConnection = async () => {
  try {
    // Use a simple ping query that doesn't require authentication
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" - not a connection error
      throw error;
    }
    
    return { connected: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Supabase connection error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Return more detailed error information
    return { 
      connected: false, 
      error: {
        message: error.message || 'Connection failed',
        code: error.code || 'UNKNOWN',
        timestamp: new Date().toISOString()
      }
    };
  }
};

// Connection health monitor (optional)
let connectionCheckInterval = null;

export const startConnectionMonitor = (interval = 60000) => { // 1 minute
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  connectionCheckInterval = setInterval(async () => {
    const status = await checkConnection();
    if (!status.connected && import.meta.env.DEV) {
      console.warn('Supabase connection lost:', status.error);
    }
  }, interval);
  
  return () => {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
  };
};

export const stopConnectionMonitor = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

// Initialize connection on import (non-blocking)
setTimeout(() => {
  checkConnection().then(result => {
    if (result.connected) {
      console.info('✅ Supabase connected successfully');
    } else {
      console.warn('⚠️ Supabase connection issue:', result.error?.message || 'Unknown error');
    }
  }).catch(err => {
    console.error('❌ Supabase connection check failed:', err);
  });
}, 1000);

// Export for convenience
export default supabase;