import { supabase } from './supabase';
import { auditService } from './auditService';

export const notificationService = {
  // Send notification to users
  async sendNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info',
          priority: notificationData.priority || 'medium',
          recipient_type: notificationData.recipient_type, // 'user', 'driver', 'all', 'specific'
          recipient_ids: notificationData.recipient_ids || [],
          sender_id: notificationData.sender_id,
          sender_type: notificationData.sender_type || 'admin',
          data: notificationData.data || {},
          scheduled_for: notificationData.scheduled_for,
          status: notificationData.scheduled_for ? 'scheduled' : 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // If not scheduled, trigger immediate delivery
      if (!notificationData.scheduled_for) {
        await this.triggerNotificationDelivery(data.id);
      }

      // Log the action
      await auditService.logAdminAction({
        admin_id: notificationData.sender_id,
        action_type: 'notification.send',
        resource_type: 'notification',
        resource_id: data.id,
        details: {
          type: notificationData.type,
          recipient_type: notificationData.recipient_type,
          recipient_count: notificationData.recipient_ids?.length || 0
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { data: null, error };
    }
  },

  // Send system announcements
  async sendAnnouncement(announcementData) {
    try {
      const announcement = {
        title: announcementData.title,
        message: announcementData.message,
        type: 'announcement',
        priority: 'high',
        recipient_type: 'all',
        sender_id: announcementData.sender_id,
        sender_type: 'system',
        data: {
          announcement_type: announcementData.announcement_type,
          expiry_date: announcementData.expiry_date,
          action_url: announcementData.action_url,
          action_text: announcementData.action_text
        },
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(announcement)
        .select()
        .single();

      if (error) throw error;

      await this.triggerNotificationDelivery(data.id);

      await auditService.logAdminAction({
        admin_id: announcementData.sender_id,
        action_type: 'announcement.send',
        resource_type: 'notification',
        resource_id: data.id,
        details: {
          title: announcementData.title,
          announcement_type: announcementData.announcement_type
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error sending announcement:', error);
      return { data: null, error };
    }
  },

  // Get notification statistics
  async getNotificationStats(timeRange = '24h') {
    try {
      let startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 1);
      }

      // Get total notifications
      const { count: total, error: totalError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (totalError) throw totalError;

      // Get delivered notifications
      const { count: delivered, error: deliveredError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .eq('status', 'delivered');

      if (deliveredError) throw deliveredError;

      // Get read notifications
      const { count: read, error: readError } = await supabase
        .from('notification_delivery_logs')
        .select('*', { count: 'exact', head: true })
        .gte('delivered_at', startDate.toISOString())
        .eq('read', true);

      if (readError) throw readError;

      // Get notifications by type
      const { data: byType, error: typeError } = await supabase
        .from('notifications')
        .select('type')
        .gte('created_at', startDate.toISOString());

      if (typeError) throw typeError;

      const typeStats = byType.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {});

      // Get delivery rate
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
      const readRate = delivered > 0 ? (read / delivered) * 100 : 0;

      return {
        data: {
          total_notifications: total,
          delivered_notifications: delivered,
          read_notifications: read,
          failed_notifications: total - delivered,
          delivery_rate: parseFloat(deliveryRate.toFixed(2)),
          read_rate: parseFloat(readRate.toFixed(2)),
          by_type: typeStats,
          time_range: timeRange,
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { data: null, error };
    }
  },

  // Schedule future notification
  async scheduleNotification(scheduleData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: scheduleData.title,
          message: scheduleData.message,
          type: scheduleData.type || 'info',
          priority: scheduleData.priority || 'medium',
          recipient_type: scheduleData.recipient_type,
          recipient_ids: scheduleData.recipient_ids,
          sender_id: scheduleData.sender_id,
          sender_type: scheduleData.sender_type || 'admin',
          data: scheduleData.data || {},
          scheduled_for: scheduleData.scheduled_for,
          status: 'scheduled',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: scheduleData.sender_id,
        action_type: 'notification.schedule',
        resource_type: 'notification',
        resource_id: data.id,
        details: {
          scheduled_for: scheduleData.scheduled_for,
          recipient_type: scheduleData.recipient_type
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { data: null, error };
    }
  },

  // Cancel scheduled notification
  async cancelNotification(notificationId, cancelledBy) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy
        })
        .eq('id', notificationId)
        .eq('status', 'scheduled')
        .select()
        .single();

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: cancelledBy,
        action_type: 'notification.cancel',
        resource_type: 'notification',
        resource_id: notificationId,
        details: {}
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return { data: null, error };
    }
  },

  // Get notification templates
  async getNotificationTemplates() {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      return { data: null, error };
    }
  },

  // Create notification template
  async createNotificationTemplate(templateData, createdBy) {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          title_template: templateData.title_template,
          message_template: templateData.message_template,
          type: templateData.type,
          variables: templateData.variables || [],
          is_active: true,
          created_by: createdBy,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating notification template:', error);
      return { data: null, error };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId, userId, userType) {
    try {
      const { data, error } = await supabase
        .from('notification_delivery_logs')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { data: null, error };
    }
  },

  // Mark all notifications as read for user
  async markAllAsRead(userId, userType) {
    try {
      const { data, error } = await supabase
        .from('notification_delivery_logs')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .eq('read', false)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { data: null, error };
    }
  },

  // Get user notifications
  async getUserNotifications(userId, userType, filters = {}) {
    try {
      let query = supabase
        .from('notification_delivery_logs')
        .select(`
          *,
          notification:notifications(*)
        `)
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .order('delivered_at', { ascending: false });

      if (filters.read !== undefined) {
        query = query.eq('read', filters.read);
      }

      if (filters.type) {
        query = query.eq('notification.type', filters.type);
      }

      if (filters.priority) {
        query = query.eq('notification.priority', filters.priority);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return { data: null, error };
    }
  },

  // Delete notification
  async deleteNotification(notificationId, deletedBy) {
    try {
      // First, delete delivery logs
      const { error: logsError } = await supabase
        .from('notification_delivery_logs')
        .delete()
        .eq('notification_id', notificationId);

      if (logsError) throw logsError;

      // Then delete the notification
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: deletedBy,
        action_type: 'notification.delete',
        resource_type: 'notification',
        resource_id: notificationId,
        details: {}
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { data: null, error };
    }
  },

  // Trigger notification delivery (internal)
  async triggerNotificationDelivery(notificationId) {
    try {
      // Get notification details
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (notifError) throw notifError;

      // Determine recipients based on recipient_type
      let recipientIds = [];

      switch (notification.recipient_type) {
        case 'all':
          // Get all active users and drivers
          const [usersResult, driversResult] = await Promise.all([
            supabase.from('passengers').select('id').eq('status', 'active'),
            supabase.from('drivers').select('id').eq('status', 'active')
          ]);

          if (usersResult.error) throw usersResult.error;
          if (driversResult.error) throw driversResult.error;

          recipientIds = [
            ...usersResult.data.map(u => ({ id: u.id, type: 'user' })),
            ...driversResult.data.map(d => ({ id: d.id, type: 'driver' }))
          ];
          break;

        case 'users':
          const { data: users, error: usersError } = await supabase
            .from('passengers')
            .select('id')
            .eq('status', 'active');

          if (usersError) throw usersError;
          recipientIds = users.map(u => ({ id: u.id, type: 'user' }));
          break;

        case 'drivers':
          const { data: drivers, error: driversError } = await supabase
            .from('drivers')
            .select('id')
            .eq('status', 'active');

          if (driversError) throw driversError;
          recipientIds = drivers.map(d => ({ id: d.id, type: 'driver' }));
          break;

        case 'specific':
          // recipient_ids should contain user IDs
          recipientIds = notification.recipient_ids.map(id => ({ 
            id, 
            type: id.startsWith('driver_') ? 'driver' : 'user' 
          }));
          break;

        default:
          throw new Error('Invalid recipient type');
      }

      // Create delivery logs for each recipient
      const deliveryLogs = recipientIds.map(recipient => ({
        notification_id: notificationId,
        recipient_id: recipient.id,
        recipient_type: recipient.type,
        status: 'pending',
        created_at: new Date().toISOString()
      }));

      const { error: logsError } = await supabase
        .from('notification_delivery_logs')
        .insert(deliveryLogs);

      if (logsError) throw logsError;

      // Update notification status
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          recipient_count: recipientIds.length
        })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      // Here you would typically trigger push notifications, emails, SMS, etc.
      // This is where you'd integrate with FCM, APNS, email service, etc.
      await this.sendPushNotifications(notification, recipientIds);

      return { data: { success: true, recipient_count: recipientIds.length }, error: null };
    } catch (error) {
      console.error('Error triggering notification delivery:', error);
      
      // Update notification status to failed
      await supabase
        .from('notifications')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', notificationId);

      return { data: null, error };
    }
  },

  // Send push notifications (placeholder for actual push service integration)
  async sendPushNotifications(notification, recipients) {
    try {
      // This is a placeholder for actual push notification service
      // You would integrate with FCM (Firebase Cloud Messaging), APNS, etc.
      
      console.log(`Would send push notification to ${recipients.length} recipients`);
      console.log('Notification:', notification);
      
      // Example implementation:
      // const fcmTokens = await this.getFCMTokens(recipients);
      // await firebase.messaging().sendMulticast({
      //   tokens: fcmTokens,
      //   notification: {
      //     title: notification.title,
      //     body: notification.message,
      //   },
      //   data: notification.data,
      // });

      return { success: true };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  },

  // Get unread count for user
  async getUnreadCount(userId, userType) {
    try {
      const { count, error } = await supabase
        .from('notification_delivery_logs')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .eq('read', false);

      if (error) throw error;

      return { data: count, error: null };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { data: null, error };
    }
  },

  // Update delivery log status
  async updateDeliveryStatus(deliveryLogId, status, details = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString();
        updateData.error_message = details.error_message;
      }

      const { data, error } = await supabase
        .from('notification_delivery_logs')
        .update(updateData)
        .eq('id', deliveryLogId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating delivery status:', error);
      return { data: null, error };
    }
  }
};

export default notificationService;