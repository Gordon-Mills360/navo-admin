import { supabase } from './supabase';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.callbacks = new Map();
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.initializeConnection();
  }

  // Initialize real-time connection
  initializeConnection() {
    this.channel = supabase.channel('admin-panel');
    
    this.channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Online users:', this.channel.presenceState());
      })
      .on('broadcast', { event: 'test' }, ({ payload }) => {
        console.log('Test broadcast received:', payload);
      })
      .subscribe((status) => {
        this.connectionStatus = status;
        console.log('Realtime connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.notifySubscribers('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.handleDisconnection();
        }
      });
  }

  // Handle disconnection with exponential backoff
  handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      this.reconnectAttempts++;
      
      console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.connectionStatus !== 'SUBSCRIBED') {
          this.reconnect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifySubscribers('disconnected');
    }
  }

  // Notify all subscribers of connection status change
  notifySubscribers(status) {
    this.callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback({ type: 'connection_status', status });
      }
    });
  }

  // Generic table subscription
  subscribeToTable(tableName, callback, filters = {}) {
    const subscriptionId = `${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      let query = supabase
        .channel(`table:${tableName}:${subscriptionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            ...(filters.filter && { filter: filters.filter })
          },
          (payload) => {
            if (callback) {
              callback(payload);
            }
            
            // Also notify global subscribers
            this.callbacks.forEach((cb) => {
              if (typeof cb === 'function') {
                cb({ 
                  type: 'table_update', 
                  table: tableName, 
                  payload 
                });
              }
            });
          }
        )
        .subscribe();

      this.subscriptions.set(subscriptionId, query);
      this.callbacks.set(subscriptionId, callback);

      console.log(`Subscribed to table: ${tableName} (ID: ${subscriptionId})`);

      return subscriptionId;
    } catch (error) {
      console.error(`Error subscribing to table ${tableName}:`, error);
      throw error;
    }
  }

  // Live trips subscription
  subscribeToLiveTrips(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('trips', (payload) => {
      // Apply additional filters
      if (filters.status && payload.new?.status !== filters.status) {
        return;
      }
      if (filters.driver_id && payload.new?.driver_id !== filters.driver_id) {
        return;
      }
      if (filters.passenger_id && payload.new?.passenger_id !== filters.passenger_id) {
        return;
      }
      
      callback(payload);
    }, { filter: 'status=in.(pending,accepted,arrived,in_progress)' });

    return subscriptionId;
  }

  // Live drivers subscription
  subscribeToLiveDrivers(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('drivers', (payload) => {
      // Apply additional filters
      if (filters.status && payload.new?.status !== filters.status) {
        return;
      }
      if (filters.city && payload.new?.city !== filters.city) {
        return;
      }
      if (filters.vehicle_type && payload.new?.vehicle_type !== filters.vehicle_type) {
        return;
      }
      
      callback(payload);
    }, { filter: 'status=in.(active,online,offline,busy)' });

    return subscriptionId;
  }

  // Live passengers subscription
  subscribeToLivePassengers(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('passengers', (payload) => {
      // Apply additional filters
      if (filters.status && payload.new?.status !== filters.status) {
        return;
      }
      
      callback(payload);
    });

    return subscriptionId;
  }

  // Live emergencies subscription
  subscribeToLiveEmergencies(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('emergencies', (payload) => {
      // Apply additional filters
      if (filters.status && payload.new?.status !== filters.status) {
        return;
      }
      if (filters.severity && payload.new?.severity !== filters.severity) {
        return;
      }
      
      callback(payload);
    }, { filter: 'status=in.(pending,active)' });

    return subscriptionId;
  }

  // Live notifications subscription
  subscribeToLiveNotifications(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('notifications', (payload) => {
      // Apply additional filters
      if (filters.type && payload.new?.type !== filters.type) {
        return;
      }
      if (filters.priority && payload.new?.priority !== filters.priority) {
        return;
      }
      
      callback(payload);
    });

    return subscriptionId;
  }

  // Subscribe to admin actions log
  subscribeToAdminActions(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('admin_actions_log', (payload) => {
      // Apply additional filters
      if (filters.admin_id && payload.new?.admin_id !== filters.admin_id) {
        return;
      }
      if (filters.action_type && payload.new?.action_type !== filters.action_type) {
        return;
      }
      
      callback(payload);
    });

    return subscriptionId;
  }

  // Subscribe to payments
  subscribeToPayments(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('payments', (payload) => {
      // Apply additional filters
      if (filters.status && payload.new?.status !== filters.status) {
        return;
      }
      if (filters.type && payload.new?.type !== filters.type) {
        return;
      }
      
      callback(payload);
    });

    return subscriptionId;
  }

  // Subscribe to wallet transactions
  subscribeToWalletTransactions(callback, filters = {}) {
    const subscriptionId = this.subscribeToTable('wallet_transactions', (payload) => {
      // Apply additional filters
      if (filters.type && payload.new?.type !== filters.type) {
        return;
      }
      if (filters.status && payload.new?.status !== filters.status) {
        return;
      }
      
      callback(payload);
    });

    return subscriptionId;
  }

  // Unsubscribe from specific subscription
  unsubscribe(subscriptionId) {
    if (this.subscriptions.has(subscriptionId)) {
      const subscription = this.subscriptions.get(subscriptionId);
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionId);
      this.callbacks.delete(subscriptionId);
      console.log(`Unsubscribed: ${subscriptionId}`);
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, id) => {
      supabase.removeChannel(subscription);
      console.log(`Unsubscribed: ${id}`);
    });
    
    this.subscriptions.clear();
    this.callbacks.clear();
    console.log('All subscriptions cleared');
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      subscriptions: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Manual reconnection
  reconnect() {
    if (this.connectionStatus === 'SUBSCRIBED') {
      console.log('Already connected');
      return;
    }

    console.log('Attempting to reconnect...');
    
    // Close existing connection
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    
    // Reinitialize
    this.initializeConnection();
  }

  // Get subscription count
  getSubscriptionCount() {
    return this.subscriptions.size;
  }

  // Get active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }

  // Send a test message
  async sendTestMessage(message) {
    if (this.connectionStatus !== 'SUBSCRIBED') {
      throw new Error('Not connected to real-time service');
    }

    return this.channel.send({
      type: 'broadcast',
      event: 'test',
      payload: { message, timestamp: new Date().toISOString() }
    });
  }

  // Update presence state
  updatePresence(data) {
    if (this.connectionStatus !== 'SUBSCRIBED') {
      return;
    }

    return this.channel.track({
      online_at: new Date().toISOString(),
      ...data
    });
  }

  // Get presence state
  getPresenceState() {
    if (this.connectionStatus !== 'SUBSCRIBED') {
      return {};
    }

    return this.channel.presenceState();
  }

  // Subscribe to connection status changes
  onConnectionStatusChange(callback) {
    const id = `connection_${Date.now()}`;
    this.callbacks.set(id, (data) => {
      if (data.type === 'connection_status') {
        callback(data.status);
      }
    });
    return id;
  }

  // Bulk subscribe to multiple tables
  bulkSubscribe(subscriptions) {
    const subscriptionIds = [];
    
    subscriptions.forEach(({ table, callback, filters = {} }) => {
      try {
        const id = this.subscribeToTable(table, callback, filters);
        subscriptionIds.push(id);
      } catch (error) {
        console.error(`Failed to subscribe to ${table}:`, error);
      }
    });
    
    return subscriptionIds;
  }

  // Health check
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Send a test message and wait for response
      await this.sendTestMessage('health_check');
      
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        connection: this.connectionStatus,
        subscriptions: this.subscriptions.size,
        latency: `${latency}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connection: this.connectionStatus,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clean up old subscriptions
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    this.subscriptions.forEach((subscription, id) => {
      const createdTime = parseInt(id.split('_')[1]);
      if (now - createdTime > maxAge) {
        this.unsubscribe(id);
      }
    });
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

// Export singleton
export default realtimeService;