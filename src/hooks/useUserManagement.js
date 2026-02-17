import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAdminAuth } from './useAdminAuth';
import { supabase } from '../services/supabase';
import { ADMIN_ACTIONS, DRIVER_STATES, PASSENGER_STATES } from '../utils/constants';

export const useUserManagement = () => {
  const { showSuccess, showError } = useNotifications();
  const { logAdminAction } = useAdminAuth();
  const [loading, setLoading] = useState(false);

  // DRIVER MANAGEMENT
  const approveDriver = useCallback(async (driverId, verificationData) => {
    setLoading(true);
    try {
      // Update driver verification status
      const { error: verificationError } = await supabase
        .from('driver_documents')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: verificationData.adminId,
        })
        .eq('driver_id', driverId)
        .eq('status', 'pending');

      if (verificationError) throw verificationError;

      // Update driver status to approved
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ status: DRIVER_STATES.APPROVED })
        .eq('id', driverId);

      if (driverError) throw driverError;

      // Log state change
      await supabase.from('driver_state_logs').insert({
        driver_id: driverId,
        old_state: DRIVER_STATES.PENDING_APPROVAL,
        new_state: DRIVER_STATES.APPROVED,
        changed_by_admin: verificationData.adminId,
        reason: 'Admin approval',
      });

      // Send notification to driver (via your notification service)
      await supabase.from('admin_notifications').insert({
        title: 'Driver Account Approved',
        message: 'Your driver account has been approved. You can now start accepting rides.',
        notification_type: 'system',
        target_audience: 'specific_users',
        target_user_ids: [driverId],
        delivery_method: 'push',
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.APPROVE_DRIVER,
        'drivers',
        driverId,
        verificationData
      );

      showSuccess('Driver approved successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to approve driver: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const rejectDriver = useCallback(async (driverId, reason, adminId) => {
    setLoading(true);
    try {
      // Update driver verification status
      const { error: verificationError } = await supabase
        .from('driver_documents')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          verified_by: adminId,
          verified_at: new Date().toISOString(),
        })
        .eq('driver_id', driverId)
        .eq('status', 'pending');

      if (verificationError) throw verificationError;

      // Update driver status to rejected
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ status: DRIVER_STATES.REJECTED })
        .eq('id', driverId);

      if (driverError) throw driverError;

      // Log state change
      await supabase.from('driver_state_logs').insert({
        driver_id: driverId,
        old_state: DRIVER_STATES.PENDING_APPROVAL,
        new_state: DRIVER_STATES.REJECTED,
        changed_by_admin: adminId,
        reason: reason,
      });

      // Send notification to driver
      await supabase.from('admin_notifications').insert({
        title: 'Driver Account Rejected',
        message: `Your driver account has been rejected. Reason: ${reason}`,
        notification_type: 'system',
        target_audience: 'specific_users',
        target_user_ids: [driverId],
        delivery_method: 'push',
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.REJECT_DRIVER,
        'drivers',
        driverId,
        { reason }
      );

      showSuccess('Driver rejected successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to reject driver: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const suspendDriver = useCallback(async (driverId, reason, adminId) => {
    setLoading(true);
    try {
      // Get current driver state
      const { data: driver, error: fetchError } = await supabase
        .from('drivers')
        .select('status')
        .eq('id', driverId)
        .single();

      if (fetchError) throw fetchError;

      // Update driver status to suspended
      const { error: updateError } = await supabase
        .from('drivers')
        .update({ status: DRIVER_STATES.SUSPENDED })
        .eq('id', driverId);

      if (updateError) throw updateError;

      // Log state change
      await supabase.from('driver_state_logs').insert({
        driver_id: driverId,
        old_state: driver.status,
        new_state: DRIVER_STATES.SUSPENDED,
        changed_by_admin: adminId,
        reason: reason,
      });

      // Send notification to driver
      await supabase.from('admin_notifications').insert({
        title: 'Account Suspended',
        message: `Your driver account has been suspended. Reason: ${reason}`,
        notification_type: 'alert',
        target_audience: 'specific_users',
        target_user_ids: [driverId],
        delivery_method: 'all',
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.SUSPEND_USER,
        'drivers',
        driverId,
        { reason, previous_state: driver.status }
      );

      showSuccess('Driver suspended successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to suspend driver: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const reinstateDriver = useCallback(async (driverId, reason, adminId) => {
    setLoading(true);
    try {
      // Update driver status to offline (available but not online)
      const { error } = await supabase
        .from('drivers')
        .update({ status: DRIVER_STATES.OFFLINE })
        .eq('id', driverId);

      if (error) throw error;

      // Log state change
      await supabase.from('driver_state_logs').insert({
        driver_id: driverId,
        old_state: DRIVER_STATES.SUSPENDED,
        new_state: DRIVER_STATES.OFFLINE,
        changed_by_admin: adminId,
        reason: reason,
      });

      // Send notification to driver
      await supabase.from('admin_notifications').insert({
        title: 'Account Reinstated',
        message: 'Your driver account has been reinstated. You can now go online.',
        notification_type: 'system',
        target_audience: 'specific_users',
        target_user_ids: [driverId],
        delivery_method: 'push',
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.REINSTATE_USER,
        'drivers',
        driverId,
        { reason }
      );

      showSuccess('Driver reinstated successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to reinstate driver: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  // PASSENGER MANAGEMENT
  const suspendPassenger = useCallback(async (passengerId, reason, adminId) => {
    setLoading(true);
    try {
      // Get current passenger state
      const { data: passenger, error: fetchError } = await supabase
        .from('passengers')
        .select('status')
        .eq('id', passengerId)
        .single();

      if (fetchError) throw fetchError;

      // Update passenger status to suspended
      const { error: updateError } = await supabase
        .from('passengers')
        .update({ status: PASSENGER_STATES.SUSPENDED })
        .eq('id', passengerId);

      if (updateError) throw updateError;

      // Log state change
      await supabase.from('passenger_state_logs').insert({
        passenger_id: passengerId,
        old_state: passenger.status,
        new_state: PASSENGER_STATES.SUSPENDED,
        changed_by_admin: adminId,
        reason: reason,
      });

      // Send notification to passenger
      await supabase.from('admin_notifications').insert({
        title: 'Account Suspended',
        message: `Your passenger account has been suspended. Reason: ${reason}`,
        notification_type: 'alert',
        target_audience: 'specific_users',
        target_user_ids: [passengerId],
        delivery_method: 'all',
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.SUSPEND_USER,
        'passengers',
        passengerId,
        { reason, previous_state: passenger.status }
      );

      showSuccess('Passenger suspended successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to suspend passenger: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const reinstatePassenger = useCallback(async (passengerId, reason, adminId) => {
    setLoading(true);
    try {
      // Update passenger status to active
      const { error } = await supabase
        .from('passengers')
        .update({ status: PASSENGER_STATES.ACTIVE })
        .eq('id', passengerId);

      if (error) throw error;

      // Log state change
      await supabase.from('passenger_state_logs').insert({
        passenger_id: passengerId,
        old_state: PASSENGER_STATES.SUSPENDED,
        new_state: PASSENGER_STATES.ACTIVE,
        changed_by_admin: adminId,
        reason: reason,
      });

      // Send notification to passenger
      await supabase.from('admin_notifications').insert({
        title: 'Account Reinstated',
        message: 'Your passenger account has been reinstated.',
        notification_type: 'system',
        target_audience: 'specific_users',
        target_user_ids: [passengerId],
        delivery_method: 'push',
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.REINSTATE_USER,
        'passengers',
        passengerId,
        { reason }
      );

      showSuccess('Passenger reinstated successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to reinstate passenger: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const banUser = useCallback(async (userId, userType, reason, adminId) => {
    setLoading(true);
    try {
      const table = userType === 'driver' ? 'drivers' : 'passengers';
      const state = userType === 'driver' ? DRIVER_STATES.BANNED : PASSENGER_STATES.BANNED;

      // Update user status to banned
      const { error } = await supabase
        .from(table)
        .update({ status: state })
        .eq('id', userId);

      if (error) throw error;

      // Send notification to user
      await supabase.from('admin_notifications').insert({
        title: 'Account Banned',
        message: `Your account has been permanently banned. Reason: ${reason}`,
        notification_type: 'alert',
        target_audience: 'specific_users',
        target_user_ids: [userId],
        delivery_method: 'all',
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.BAN_USER,
        userType === 'driver' ? 'drivers' : 'passengers',
        userId,
        { reason }
      );

      showSuccess(`${userType} banned successfully`);
      return { success: true };
    } catch (error) {
      showError(`Failed to ban ${userType}: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  return {
    // Driver functions
    approveDriver,
    rejectDriver,
    suspendDriver,
    reinstateDriver,
    
    // Passenger functions
    suspendPassenger,
    reinstatePassenger,
    banUser,
    
    loading,
  };
};