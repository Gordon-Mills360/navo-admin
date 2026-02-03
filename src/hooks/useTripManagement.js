import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAdminAuth } from './useAdminAuth';
import { supabase } from '../services/supabase';
import { ADMIN_ACTIONS, TRIP_STATES, DRIVER_STATES, PASSENGER_STATES } from '../utils/constants';

export const useTripManagement = () => {
  const { showSuccess, showError } = useNotifications();
  const { logAdminAction } = useAdminAuth();
  const [loading, setLoading] = useState(false);

  const forceCancelTrip = useCallback(async (tripId, reason, adminId) => {
    setLoading(true);
    try {
      // Get trip details
      const { data: trip, error: fetchError } = await supabase
        .from('trips')
        .select('*, driver_id, passenger_id, status')
        .eq('id', tripId)
        .single();

      if (fetchError) throw fetchError;

      // Update trip status
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          status: TRIP_STATES.CANCELLED_BY_ADMIN,
          cancellation_reason: reason,
          cancelled_by_admin: adminId,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (updateError) throw updateError;

      // Log state change
      await supabase.from('trip_state_logs').insert({
        trip_id: tripId,
        old_state: trip.status,
        new_state: TRIP_STATES.CANCELLED_BY_ADMIN,
        changed_by_admin: adminId,
        reason: reason,
      });

      // Update driver state if driver was assigned
      if (trip.driver_id && trip.status !== 'cancelled') {
        await supabase
          .from('drivers')
          .update({ status: DRIVER_STATES.ONLINE })
          .eq('id', trip.driver_id);

        // Log driver state change
        await supabase.from('driver_state_logs').insert({
          driver_id: trip.driver_id,
          old_state: DRIVER_STATES.ON_TRIP,
          new_state: DRIVER_STATES.ONLINE,
          changed_by_admin: adminId,
          reason: `Trip ${tripId} force cancelled by admin`,
        });
      }

      // Update passenger state
      if (trip.passenger_id) {
        await supabase
          .from('passengers')
          .update({ status: PASSENGER_STATES.IDLE })
          .eq('id', trip.passenger_id);

        // Log passenger state change
        await supabase.from('passenger_state_logs').insert({
          passenger_id: trip.passenger_id,
          old_state: PASSENGER_STATES.ON_TRIP,
          new_state: PASSENGER_STATES.IDLE,
          changed_by_admin: adminId,
          reason: `Trip ${tripId} force cancelled by admin`,
        });
      }

      // Send notifications
      const notifications = [];
      if (trip.driver_id) {
        notifications.push(
          supabase.from('admin_notifications').insert({
            title: 'Trip Cancelled by Admin',
            message: `Trip ${tripId} has been cancelled by admin. Reason: ${reason}`,
            notification_type: 'alert',
            target_audience: 'specific_users',
            target_user_ids: [trip.driver_id],
            delivery_method: 'push',
          })
        );
      }
      
      if (trip.passenger_id) {
        notifications.push(
          supabase.from('admin_notifications').insert({
            title: 'Trip Cancelled by Admin',
            message: `Trip ${tripId} has been cancelled by admin. Reason: ${reason}`,
            notification_type: 'alert',
            target_audience: 'specific_users',
            target_user_ids: [trip.passenger_id],
            delivery_method: 'push',
          })
        );
      }

      await Promise.all(notifications);

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.FORCE_CANCEL_TRIP,
        'trips',
        tripId,
        {
          reason,
          previous_state: trip.status,
          driver_id: trip.driver_id,
          passenger_id: trip.passenger_id,
        }
      );

      showSuccess('Trip cancelled successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to cancel trip: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const reassignDriver = useCallback(async (tripId, newDriverId, adminId) => {
    setLoading(true);
    try {
      // Get trip details
      const { data: trip, error: fetchError } = await supabase
        .from('trips')
        .select('*, driver_id, status')
        .eq('id', tripId)
        .single();

      if (fetchError) throw fetchError;

      // Check if trip can be reassigned
      if (!['requested', 'assigned'].includes(trip.status)) {
        throw new Error(`Cannot reassign trip in ${trip.status} state`);
      }

      // Get new driver details
      const { data: newDriver, error: driverError } = await supabase
        .from('drivers')
        .select('status')
        .eq('id', newDriverId)
        .single();

      if (driverError) throw driverError;

      if (newDriver.status !== DRIVER_STATES.ONLINE) {
        throw new Error(`New driver is not online (status: ${newDriver.status})`);
      }

      // Update trip with new driver
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          driver_id: newDriverId,
          assigned_at: new Date().toISOString(),
          status: TRIP_STATES.ASSIGNED,
        })
        .eq('id', tripId);

      if (updateError) throw updateError;

      // Update old driver state (if exists)
      if (trip.driver_id) {
        await supabase
          .from('drivers')
          .update({ status: DRIVER_STATES.ONLINE })
          .eq('id', trip.driver_id);

        await supabase.from('driver_state_logs').insert({
          driver_id: trip.driver_id,
          old_state: DRIVER_STATES.ASSIGNED,
          new_state: DRIVER_STATES.ONLINE,
          changed_by_admin: adminId,
          reason: `Reassigned from trip ${tripId}`,
        });

        // Notify old driver
        await supabase.from('admin_notifications').insert({
          title: 'Trip Reassigned',
          message: `Trip ${tripId} has been reassigned to another driver.`,
          notification_type: 'system',
          target_audience: 'specific_users',
          target_user_ids: [trip.driver_id],
          delivery_method: 'push',
        });
      }

      // Update new driver state
      await supabase
        .from('drivers')
        .update({ status: DRIVER_STATES.ASSIGNED })
        .eq('id', newDriverId);

      await supabase.from('driver_state_logs').insert({
        driver_id: newDriverId,
        old_state: DRIVER_STATES.ONLINE,
        new_state: DRIVER_STATES.ASSIGNED,
        changed_by_admin: adminId,
        reason: `Assigned to trip ${tripId} by admin`,
      });

      // Notify new driver
      await supabase.from('admin_notifications').insert({
        title: 'New Trip Assigned',
        message: `You have been assigned to trip ${tripId} by admin.`,
        notification_type: 'system',
        target_audience: 'specific_users',
        target_user_ids: [newDriverId],
        delivery_method: 'push',
      });

      // Notify passenger
      if (trip.passenger_id) {
        await supabase.from('admin_notifications').insert({
          title: 'Driver Changed',
          message: `A new driver has been assigned to your trip.`,
          notification_type: 'system',
          target_audience: 'specific_users',
          target_user_ids: [trip.passenger_id],
          delivery_method: 'push',
        });
      }

      // Log trip state change
      await supabase.from('trip_state_logs').insert({
        trip_id: tripId,
        old_state: trip.status,
        new_state: TRIP_STATES.ASSIGNED,
        changed_by_admin: adminId,
        reason: `Driver reassigned from ${trip.driver_id} to ${newDriverId}`,
      });

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.REASSIGN_DRIVER,
        'trips',
        tripId,
        {
          old_driver_id: trip.driver_id,
          new_driver_id: newDriverId,
          previous_state: trip.status,
        }
      );

      showSuccess('Driver reassigned successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to reassign driver: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const overrideTripState = useCallback(async (tripId, newState, reason, adminId) => {
    setLoading(true);
    try {
      // Get trip details
      const { data: trip, error: fetchError } = await supabase
        .from('trips')
        .select('*, driver_id, passenger_id, status')
        .eq('id', tripId)
        .single();

      if (fetchError) throw fetchError;

      // Update trip state
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          status: newState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (updateError) throw updateError;

      // Log state change
      await supabase.from('trip_state_logs').insert({
        trip_id: tripId,
        old_state: trip.status,
        new_state: newState,
        changed_by_admin: adminId,
        reason: reason,
      });

      // Update driver state if needed
      if (trip.driver_id) {
        let newDriverState = DRIVER_STATES.OFFLINE;
        
        if (newState === 'completed') {
          newDriverState = DRIVER_STATES.ONLINE;
        } else if (newState === 'cancelled') {
          newDriverState = DRIVER_STATES.ONLINE;
        }

        await supabase
          .from('drivers')
          .update({ status: newDriverState })
          .eq('id', trip.driver_id);

        await supabase.from('driver_state_logs').insert({
          driver_id: trip.driver_id,
          old_state: DRIVER_STATES.ON_TRIP,
          new_state: newDriverState,
          changed_by_admin: adminId,
          reason: `Trip ${tripId} state overridden to ${newState}`,
        });
      }

      // Update passenger state if needed
      if (trip.passenger_id) {
        let newPassengerState = PASSENGER_STATES.IDLE;
        
        if (newState === 'completed') {
          newPassengerState = PASSENGER_STATES.IDLE;
        } else if (newState === 'cancelled') {
          newPassengerState = PASSENGER_STATES.IDLE;
        }

        await supabase
          .from('passengers')
          .update({ status: newPassengerState })
          .eq('id', trip.passenger_id);

        await supabase.from('passenger_state_logs').insert({
          passenger_id: trip.passenger_id,
          old_state: PASSENGER_STATES.ON_TRIP,
          new_state: newPassengerState,
          changed_by_admin: adminId,
          reason: `Trip ${tripId} state overridden to ${newState}`,
        });
      }

      // Notify users
      const notifications = [];
      if (trip.driver_id) {
        notifications.push(
          supabase.from('admin_notifications').insert({
            title: 'Trip State Updated',
            message: `Trip ${tripId} state has been updated to ${newState}. Reason: ${reason}`,
            notification_type: 'system',
            target_audience: 'specific_users',
            target_user_ids: [trip.driver_id],
            delivery_method: 'push',
          })
        );
      }
      
      if (trip.passenger_id) {
        notifications.push(
          supabase.from('admin_notifications').insert({
            title: 'Trip State Updated',
            message: `Trip ${tripId} state has been updated to ${newState}. Reason: ${reason}`,
            notification_type: 'system',
            target_audience: 'specific_users',
            target_user_ids: [trip.passenger_id],
            delivery_method: 'push',
          })
        );
      }

      await Promise.all(notifications);

      // Log admin action
      await logAdminAction(
        ADMIN_ACTIONS.OVERRIDE_TRIP_STATE,
        'trips',
        tripId,
        {
          old_state: trip.status,
          new_state: newState,
          reason,
          driver_id: trip.driver_id,
          passenger_id: trip.passenger_id,
        }
      );

      showSuccess('Trip state updated successfully');
      return { success: true };
    } catch (error) {
      showError(`Failed to update trip state: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [logAdminAction, showError, showSuccess]);

  const handleEmergency = useCallback(async (tripId, emergencyType, details, adminId) => {
    setLoading(true);
    try {
      // Create emergency record
      const { data: emergency, error: emergencyError } = await supabase
        .from('emergencies')
        .insert({
          trip_id: tripId,
          emergency_type: emergencyType,
          triggered_by: 'admin',
          status: 'active',
          priority: 'high',
          description: details.description,
          location: details.location,
          acknowledged_by: adminId,
          acknowledged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (emergencyError) throw emergencyError;

      // Log emergency actions
      const actions = [];
      if (details.actions.includes('call_driver')) {
        actions.push(
          supabase.from('emergency_actions').insert({
            emergency_id: emergency.id,
            admin_id: adminId,
            action_type: 'call_driver',
            details: 'Admin called driver regarding emergency',
          })
        );
      }
      
      if (details.actions.includes('call_passenger')) {
        actions.push(
          supabase.from('emergency_actions').insert({
            emergency_id: emergency.id,
            admin_id: adminId,
            action_type: 'call_passenger',
            details: 'Admin called passenger regarding emergency',
          })
        );
      }
      
      if (details.actions.includes('cancel_trip')) {
        actions.push(
          supabase.from('emergency_actions').insert({
            emergency_id: emergency.id,
            admin_id: adminId,
            action_type: 'cancel_trip',
            details: 'Trip cancelled due to emergency',
          })
        );
        
        // Cancel the trip
        await forceCancelTrip(tripId, `Emergency: ${emergencyType}`, adminId);
      }

      await Promise.all(actions);

      // Notify relevant parties
      await supabase.from('admin_notifications').insert({
        title: 'Emergency Situation',
        message: `Emergency ${emergencyType} reported for trip ${tripId}. Admin has been notified.`,
        notification_type: 'emergency',
        target_audience: 'all',
        delivery_method: 'push',
      });

      showSuccess('Emergency handled successfully');
      return { success: true, emergencyId: emergency.id };
    } catch (error) {
      showError(`Failed to handle emergency: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [forceCancelTrip, showError, showSuccess]);

  return {
    forceCancelTrip,
    reassignDriver,
    overrideTripState,
    handleEmergency,
    loading,
  };
};