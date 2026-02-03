import React, { createContext, useState, useContext, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../services/supabase';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();

  const showToast = useCallback((title, description, status = 'info') => {
    toast({
      title,
      description,
      status,
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
  }, [toast]);

  const showSuccess = useCallback((message) => {
    showToast('Success', message, 'success');
  }, [showToast]);

  const showError = useCallback((message) => {
    showToast('Error', message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message) => {
    showToast('Warning', message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message) => {
    showToast('Info', message, 'info');
  }, [showToast]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .is('read_at', null);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};