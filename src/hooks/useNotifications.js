import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@chakra-ui/react';
import notificationService from '../services/notificationService';
import realtimeService from '../services/realtimeService';

const useNotifications = (filters = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  
  const { user } = useAuth();
  const toast = useToast();
  const subscriptionRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (fetchFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedFilters = { ...filters, ...fetchFilters };
      
      // If user is logged in, fetch their notifications
      if (user) {
        const { data, error: fetchError } = await notificationService.getUserNotifications(
          user.id,
          'admin',
          mergedFilters
        );
        
        if (fetchError) throw fetchError;
        
        setNotifications(data || []);
        
        // Calculate unread count
        const unread = (data || []).filter(n => !n.read).length;
        setUnreadCount(unread);
        
        return { data, error: null };
      }
      
      return { data: [], error: null };
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Send notification
  const sendNotification = useCallback(async (notificationData, options = {}) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setSending(true);
      
      const { retry = 3, timeout = 5000 } = options;
      let lastError = null;
      
      // Retry logic
      for (let attempt = 1; attempt <= retry; attempt++) {
        try {
          const { data, error: sendError } = await notificationService.sendNotification({
            ...notificationData,
            sender_id: user.id
          });
          
          if (sendError) throw sendError;
          
          toast({
            title: 'Notification sent',
            description: 'Notification has been sent successfully',
            status: 'success',
            duration: 3000,
          });
          
          return { data, error: null };
        } catch (err) {
          lastError = err;
          
          if (attempt < retry) {
            await new Promise(resolve => setTimeout(resolve, timeout));
            continue;
          }
        }
      }
      
      throw lastError;
    } catch (err) {
      toast({
        title: 'Failed to send notification',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setSending(false);
    }
  }, [user, toast]);

  // Get unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!user) {
        setUnreadCount(0);
        return { data: 0, error: null };
      }
      
      const { data, error: countError } = await notificationService.getUnreadCount(user.id, 'admin');
      
      if (countError) throw countError;
      
      setUnreadCount(data || 0);
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return { data: null, error: err };
    }
  }, [user]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error: markError } = await notificationService.markAsRead(
        notificationId,
        user.id,
        'admin'
      );
      
      if (markError) throw markError;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return { data, error: null };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { data: null, error: err };
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error: markError } = await notificationService.markAllAsRead(user.id, 'admin');
      
      if (markError) throw markError;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      toast({
        title: 'All notifications marked as read',
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Failed to mark all as read',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    }
  }, [user, toast]);

  // Clear old notifications
  const clearNotifications = useCallback(async (days = 30) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // This would be a custom endpoint to clear old notifications
      // For now, we'll filter locally
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const oldNotifications = notifications.filter(notif => 
        new Date(notif.created_at) < cutoffDate
      );
      
      // In a real implementation, you would call an API to delete these
      console.log(`Would clear ${oldNotifications.length} notifications older than ${days} days`);
      
      toast({
        title: 'Notifications cleared',
        description: `Cleared notifications older than ${days} days`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh notifications
      await fetchNotifications();
      
      return { data: { cleared: oldNotifications.length }, error: null };
    } catch (err) {
      toast({
        title: 'Failed to clear notifications',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    }
  }, [user, notifications, fetchNotifications, toast]);

  // Get notification templates
  const getNotificationTemplates = useCallback(async () => {
    try {
      const { data, error: templatesError } = await notificationService.getNotificationTemplates();
      
      if (templatesError) throw templatesError;
      
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching notification templates:', err);
      return { data: null, error: err };
    }
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback(async (scheduleData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setSending(true);
      
      const { data, error: scheduleError } = await notificationService.scheduleNotification({
        ...scheduleData,
        sender_id: user.id
      });
      
      if (scheduleError) throw scheduleError;
      
      toast({
        title: 'Notification scheduled',
        description: `Notification scheduled for ${new Date(scheduleData.scheduled_for).toLocaleString()}`,
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Failed to schedule notification',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setSending(false);
    }
  }, [user, toast]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error: deleteError } = await notificationService.deleteNotification(
        notificationId,
        user.id
      );
      
      if (deleteError) throw deleteError;
      
      // Remove from local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update unread count if needed
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast({
        title: 'Notification deleted',
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Failed to delete notification',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    }
  }, [user, notifications, toast]);

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback((callback) => {
    if (!user) return null;
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      realtimeService.unsubscribe(subscriptionRef.current);
    }
    
    // Subscribe to notification updates
    const subscriptionId = realtimeService.subscribeToTable('notifications', (payload) => {
      if (payload.new && payload.new.sender_id !== user.id) {
        // New notification for this user
        const newNotification = payload.new;
        
        // Update local state
        setNotifications(prev => [newNotification, ...prev]);
        
        // Update unread count if not read
        if (!newNotification.read) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Call callback if provided
        if (callback && typeof callback === 'function') {
          callback(newNotification);
        }
        
        // Show toast for important notifications
        if (newNotification.priority === 'high') {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    });
    
    subscriptionRef.current = subscriptionId;
    return subscriptionId;
  }, [user, toast]);

  // Unsubscribe from updates
  const unsubscribeFromUpdates = useCallback(() => {
    if (subscriptionRef.current) {
      realtimeService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, []);

  // Initialize
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Subscribe to real-time updates
    const subscriptionId = subscribeToUpdates();
    
    // Cleanup on unmount
    return () => {
      if (subscriptionId) {
        realtimeService.unsubscribe(subscriptionId);
      }
    };
  }, [fetchNotifications, fetchUnreadCount, subscribeToUpdates]);

  return {
    // State
    notifications,
    loading,
    error,
    unreadCount,
    sending,
    
    // Actions
    fetchNotifications,
    sendNotification,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationTemplates,
    scheduleNotification,
    deleteNotification,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    
    // Helper functions
    refresh: () => {
      fetchNotifications();
      fetchUnreadCount();
    },
    reset: () => {
      setNotifications([]);
      setError(null);
      setUnreadCount(0);
      fetchNotifications();
      fetchUnreadCount();
    },
    
    // Computed values
    unreadNotifications: notifications.filter(n => !n.read),
    readNotifications: notifications.filter(n => n.read),
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0
  };
};

export default useNotifications;