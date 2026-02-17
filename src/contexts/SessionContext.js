import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';
import { useToast } from '@chakra-ui/react';

const SessionContext = createContext({});

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSessions, setUserSessions] = useState([]);
  
  const { user } = useAuth(); // Restored - fix AuthContext instead of bypassing
  
  const toast = useToast();
  
  // Use refs to track state without causing re-renders
  const currentSessionIdRef = useRef(null);
  const visibilityTimeoutRef = useRef(null);
  const isUnmountingRef = useRef(false);

  // Track admin session
  const trackSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userAgent = navigator.userAgent;
      
      // Get IP address with timeout
      let ipAddress = 'unknown';
      const ipTimeout = setTimeout(() => {
        ipAddress = 'timeout';
      }, 3000);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        ipAddress = data.ip || 'unknown';
      } catch (ipError) {
        if (ipError.name !== 'AbortError') {
          console.warn('Could not fetch IP address:', ipError);
        }
        ipAddress = 'unknown';
      } finally {
        clearTimeout(ipTimeout);
      }

      const { data, error } = await supabase
        .from('admin_sessions')
        .insert({
          admin_id: user.id,
          user_agent: userAgent,
          ip_address: ipAddress,
          login_time: new Date().toISOString(),
          is_active: true,
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        currentSessionIdRef.current = data.id;
        localStorage.setItem('current_session_id', data.id);
        setSession(data);
      }
    } catch (error) {
      console.error('Error tracking session:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update session activity
  const updateSessionActivity = useCallback(async () => {
    const sessionId = currentSessionIdRef.current;
    if (!sessionId || !user?.id) return;

    try {
      await supabase
        .from('admin_sessions')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('admin_id', user.id)
        .eq('is_active', true);
    } catch (error) {
      // Silent fail - don't disrupt user experience
    }
  }, [user]);

  // End current session
  const endSession = useCallback(async (isLogout = false) => {
    const sessionId = currentSessionIdRef.current || localStorage.getItem('current_session_id');
    if (!sessionId || !user?.id) return;

    try {
      await supabase
        .from('admin_sessions')
        .update({
          logout_time: new Date().toISOString(),
          is_active: false,
          logout_type: isLogout ? 'manual' : 'timeout'
        })
        .eq('id', sessionId)
        .eq('admin_id', user.id);

      currentSessionIdRef.current = null;
      localStorage.removeItem('current_session_id');
      setSession(null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [user]);

  // Get user sessions
  const fetchUserSessions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('admin_id', user.id)
        .order('login_time', { ascending: false })
        .limit(10);

      if (!error) {
        setUserSessions(data || []);
      }
    } catch (error) {
      console.error('Error fetching user sessions:', error);
    }
  }, [user]);

  // Get active sessions count
  const getActiveSessions = useCallback(async () => {
    if (!user?.id) return 0;

    try {
      const { count, error } = await supabase
        .from('admin_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', user.id)
        .eq('is_active', true);

      return error ? 0 : count;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return 0;
    }
  }, [user]);

  // Force logout from all devices
  const forceLogoutAll = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('admin_sessions')
        .update({
          logout_time: new Date().toISOString(),
          is_active: false,
          logout_type: 'forced'
        })
        .eq('admin_id', user.id)
        .eq('is_active', true);

      // End current session too
      await endSession(true);

      toast({
        title: 'Logged out from all devices',
        description: 'All active sessions have been terminated',
        status: 'success',
        duration: 3000,
      });

      await fetchUserSessions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout from all devices',
        status: 'error',
        duration: 3000,
      });
    }
  }, [user, toast, fetchUserSessions, endSession]);

  // Initialize session tracking
  useEffect(() => {
    if (user?.id) {
      trackSession();
      fetchUserSessions();
    } else {
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      isUnmountingRef.current = true;
      if (user?.id) {
        endSession();
      }
    };
  }, [user, trackSession, endSession, fetchUserSessions]);

  // Handle page visibility and activity tracking (FIXED)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - clear any pending activity updates
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
      } else {
        // Page is visible again - update activity
        if (!isUnmountingRef.current && user?.id) {
          updateSessionActivity();
        }
      }
    };

    // Track user activity (mousemove, keypress, click)
    const handleUserActivity = () => {
      if (!isUnmountingRef.current && user?.id) {
        // Debounce activity updates to avoid too many requests
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        
        visibilityTimeoutRef.current = setTimeout(() => {
          updateSessionActivity();
        }, 30000); // Update every 30 seconds of activity
      }
    };

    // Periodic activity update (every 5 minutes)
    const activityInterval = setInterval(() => {
      if (!isUnmountingRef.current && user?.id && !document.hidden) {
        updateSessionActivity();
      }
    }, 300000); // 5 minutes

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('click', handleUserActivity);

    return () => {
      isUnmountingRef.current = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('keypress', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
      
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      
      clearInterval(activityInterval);
    };
  }, [user, updateSessionActivity]);

  // Auto-logout inactive sessions (optional - 8 hours)
  useEffect(() => {
    if (!user?.id) return;

    const checkInactiveSessions = setInterval(async () => {
      try {
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
        
        await supabase
          .from('admin_sessions')
          .update({
            logout_time: new Date().toISOString(),
            is_active: false,
            logout_type: 'inactivity'
          })
          .eq('admin_id', user.id)
          .eq('is_active', true)
          .lt('last_activity', eightHoursAgo);
      } catch (error) {
        // Silent fail
      }
    }, 3600000); // Check every hour

    return () => clearInterval(checkInactiveSessions);
  }, [user]);

  const value = {
    session,
    loading,
    userSessions,
    trackSession,
    endSession,
    fetchUserSessions,
    getActiveSessions,
    forceLogoutAll,
    currentSessionId: currentSessionIdRef.current,
    updateSessionActivity
  };

  return React.createElement(
    SessionContext.Provider,
    { value: value },
    children
  );
};

export default SessionContext;