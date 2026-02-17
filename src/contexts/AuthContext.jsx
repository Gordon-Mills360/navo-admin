import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../services/supabase';

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

  // Function to fetch admin profile from database
  const fetchAdminProfile = async (userId) => {
    try {
      const { data: adminProfile, error } = await supabase
        .from('admins')
        .select('id, email, role, status, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        return null;
      }

      // Check if admin is active
      if (adminProfile.status !== 'active') {
        console.warn(`Admin ${adminProfile.email} is not active (status: ${adminProfile.status})`);
        return null;
      }

      return adminProfile;
    } catch (error) {
      console.error('Exception in fetchAdminProfile:', error);
      return null;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user?.id) {
          if (mounted) {
            setSession(existingSession);
            
            // Fetch admin profile from database
            const adminProfile = await fetchAdminProfile(existingSession.user.id);
            
            if (adminProfile) {
              // Use the actual role from database
              const adminObj = {
                id: adminProfile.id,
                email: adminProfile.email,
                role: adminProfile.role, // THIS IS CRITICAL - use DB role
                status: adminProfile.status,
                createdAt: adminProfile.created_at
              };
              setAdmin(adminObj);
              console.log('Admin initialized with role:', adminProfile.role);
            } else {
              // Not in admins table or inactive - sign out
              console.log('User not found in admins table or inactive');
              await supabase.auth.signOut();
              setAdmin(null);
            }
          }
        } else {
          if (mounted) {
            setSession(null);
            setAdmin(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setAdmin(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user?.id) {
          // Fetch admin profile from database
          const adminProfile = await fetchAdminProfile(newSession.user.id);
          
          if (adminProfile) {
            // Use the actual role from database
            const adminObj = {
              id: adminProfile.id,
              email: adminProfile.email,
              role: adminProfile.role, // THIS IS CRITICAL - use DB role
              status: adminProfile.status,
              createdAt: adminProfile.created_at
            };
            setAdmin(adminObj);
            console.log('Auth state changed, admin role:', adminProfile.role);
          } else {
            // Not in admins table or inactive
            console.log('User not authorized or inactive');
            await supabase.auth.signOut();
            setAdmin(null);
          }
        } else {
          setAdmin(null);
        }
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [toast]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Step 1: Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address');
        }
        throw authError;
      }

      if (!authData?.user?.id) {
        throw new Error('Login failed - no user data returned');
      }

      // Step 2: Fetch admin profile from database
      const adminProfile = await fetchAdminProfile(authData.user.id);
      
      if (!adminProfile) {
        // User authenticated but not in admins table or inactive
        await supabase.auth.signOut();
        throw new Error('Access denied. You are not authorized as an admin.');
      }

      // Step 3: Set admin with actual role from database
      const adminObj = {
        id: adminProfile.id,
        email: adminProfile.email,
        role: adminProfile.role, // ACTUAL ROLE FROM DATABASE
        status: adminProfile.status,
        createdAt: adminProfile.created_at
      };
      setAdmin(adminObj);

      toast({
        title: 'Login successful',
        description: `Welcome ${adminProfile.role.replace('_', ' ')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return { success: true, role: adminProfile.role };
    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any partial auth state
      setAdmin(null);
      
      const errorMessage = error.message.includes('not authorized')
        ? 'Access denied. You are not authorized to access the admin panel.'
        : error.message;

      toast({
        title: 'Authentication Error',
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
      await supabase.auth.signOut();
      
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
      // Still clear local state
      setAdmin(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
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
      
      const errorMessage = error.message.includes('rate limit')
        ? 'Too many attempts. Please try again later.'
        : errorMessage;

      toast({
        title: 'Reset failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
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
        description: error.message || 'Failed to update password',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, error: error.message };
    }
  };

  // Helper function to check specific roles
  const hasRole = (requiredRole) => {
    if (!admin) return false;
    return admin.role === requiredRole;
  };

  const value = {
    admin,
    session,
    loading,
    login,
    logout,
    resetPassword,
    updatePassword,
    hasRole,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === 'super_admin',
    isFinanceAdmin: admin?.role === 'finance_admin',
    isOperationsAdmin: admin?.role === 'operations_admin',
    isSupportAdmin: admin?.role === 'support_admin',
    isAnalyticsAdmin: admin?.role === 'analytics_admin',
    isComplianceAdmin: admin?.role === 'compliance_admin',
    // Backward compatibility
    isAdmin: !!admin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};