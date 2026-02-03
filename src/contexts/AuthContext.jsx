import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase, supabasePublic } from '../services/supabase';
import { ADMIN_ROLES } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const toast = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have an existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          setSession(existingSession);
          // Fetch admin data
          await fetchAdminData(existingSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession) {
          await fetchAdminData(newSession.user.id);
        } else {
          setAdmin(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminData = async (userId) => {
    try {
      setLoading(true);
      
      // First check if user exists in admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .single();

      if (adminError) {
        // If not in admins table, check profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError || !profileData) {
          throw new Error('User not authorized as admin');
        }

        // Check if profile has admin role
        if (!profileData.role || !profileData.role.includes('ADMIN')) {
          throw new Error('User does not have admin privileges');
        }

        // Create admin object from profile
        const adminObj = {
          id: profileData.id,
          email: profileData.email,
          name: profileData.full_name || profileData.email,
          role: profileData.role || ADMIN_ROLES.VIEW_ONLY,
          status: profileData.status || 'active',
          avatar_url: profileData.avatar_url,
          created_at: profileData.created_at,
          last_login_at: profileData.last_login_at,
        };

        setAdmin(adminObj);
        updateLastLogin(profileData.id);
      } else {
        // Found in admins table
        setAdmin(adminData);
        updateLastLogin(adminData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Authentication Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      await supabase.auth.signOut();
      setLoading(false);
    }
  };

  const updateLastLogin = async (adminId) => {
    try {
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Login failed - no user data returned');
      }

      // Fetch admin data
      await fetchAdminData(authData.user.id);

      toast({
        title: 'Login successful',
        description: `Welcome back!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before logging in';
      }

      toast({
        title: 'Login failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAdmin(null);
      setSession(null);
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Reset failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    }
  };

  const value = {
    admin,
    session,
    loading,
    login,
    logout,
    resetPassword,
    updatePassword,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === ADMIN_ROLES.SUPER_ADMIN,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};