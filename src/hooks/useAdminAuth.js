import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../services/supabase';
import { ADMIN_ACTIONS } from '../utils/constants';

export const useAdminAuth = () => {
  const { admin, isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);

  const logAdminAction = useCallback(async (action, resourceType, resourceId, details = {}) => {
    try {
      await supabase.from('admin_actions_log').insert({
        admin_id: admin?.id,
        admin_email: admin?.email,
        admin_role: admin?.role,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: JSON.stringify(details),
        ip_address: '127.0.0.1', // In production, get from request
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }, [admin]);

  const createAdmin = useCallback(async (adminData) => {
    if (!isSuperAdmin) {
      showError('Only Super Admin can create new admins');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Then create admin record
      const { error: adminError } = await supabase.from('admins').insert({
        id: authData.user.id,
        email: adminData.email,
        password_hash: authData.user.encrypted_password,
        name: adminData.name,
        role: adminData.role,
        status: 'active',
        force_password_reset: true,
        created_by: admin.id,
      });

      if (adminError) throw adminError;

      // Log the action
      await logAdminAction(
        ADMIN_ACTIONS.CREATE_ADMIN,
        'admin_users',
        authData.user.id,
        { role: adminData.role }
      );

      showSuccess(`Admin ${adminData.email} created successfully`);
      return { success: true };
    } catch (error) {
      showError(`Failed to create admin: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [admin, isSuperAdmin, logAdminAction, showError, showSuccess]);

  const updateAdmin = useCallback(async (adminId, updates) => {
    if (!isSuperAdmin) {
      showError('Only Super Admin can update admins');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', adminId);

      if (error) throw error;

      await logAdminAction(
        ADMIN_ACTIONS.UPDATE_ADMIN,
        'admin_users',
        adminId,
        updates
      );

      showSuccess('Admin updated successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to update admin: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, logAdminAction, showError, showSuccess]);

  const suspendAdmin = useCallback(async (adminId, reason) => {
    if (!isSuperAdmin) {
      showError('Only Super Admin can suspend admins');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admins')
        .update({ 
          status: 'suspended',
          force_password_reset: true 
        })
        .eq('id', adminId);

      if (error) throw error;

      await logAdminAction(
        ADMIN_ACTIONS.SUSPEND_ADMIN,
        'admin_users',
        adminId,
        { reason }
      );

      showSuccess('Admin suspended successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to suspend admin: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, logAdminAction, showError, showSuccess]);

  const resetAdminPassword = useCallback(async (adminId) => {
    if (!isSuperAdmin) {
      showError('Only Super Admin can reset passwords');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);
    try {
      const { data: adminData, error: fetchError } = await supabase
        .from('admins')
        .select('email')
        .eq('id', adminId)
        .single();

      if (fetchError) throw fetchError;

      // Generate random password
      const newPassword = Math.random().toString(36).slice(-8);
      
      // Update via auth admin API
      const { error: authError } = await supabase.auth.admin.updateUserById(
        adminId,
        { password: newPassword }
      );

      if (authError) throw authError;

      // Force password reset on next login
      await supabase
        .from('admins')
        .update({ force_password_reset: true })
        .eq('id', adminId);

      await logAdminAction(
        ADMIN_ACTIONS.RESET_ADMIN_PASSWORD,
        'admin_users',
        adminId,
        {}
      );

      showSuccess(`Password reset for ${adminData.email}. New password: ${newPassword}`);
      return { success: true, newPassword };
    } catch (error) {
      showError(`Failed to reset password: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, logAdminAction, showError, showSuccess]);

  return {
    createAdmin,
    updateAdmin,
    suspendAdmin,
    resetAdminPassword,
    logAdminAction,
    loading,
    admin,
    isSuperAdmin,
  };
};