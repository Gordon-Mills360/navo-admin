import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

const RealTimeContext = createContext();

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export const RealTimeProvider = ({ children }) => {
  const [realTimeData, setRealTimeData] = useState({
    activeTrips: 0,
    onlineDrivers: 0,
    pendingApprovals: 0,
    recentActivities: [],
    emergencies: [],
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Use refs for subscriptions and retry logic
  const subscriptionsRef = useRef([]);
  const retryCountRef = useRef(0);
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const MAX_RETRIES = 5;
  const RETRY_DELAYS = [1000, 3000, 10000, 30000, 60000]; // Exponential backoff
  const POLLING_INTERVAL = 30000; // 30 seconds as fallback

  const cleanup = useCallback(() => {
    // Clear subscriptions
    subscriptionsRef.current.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        try {
          supabase.removeChannel(sub);
        } catch (err) {
          console.warn('Error removing channel:', err);
        }
      }
    });
    subscriptionsRef.current = [];

    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      console.log('Refreshing real-time data...');
      
      // Fetch real-time counts
      const [tripsResponse, driversResponse, verificationsResponse] = await Promise.all([
        supabase
          .from('trips')
          .select('id', { count: 'exact', head: true })
          .in('status', ['requested', 'assigned', 'driver_arriving', 'in_progress']),
        
        supabase
          .from('drivers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'online'),
        
        supabase
          .from('driver_verification')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      if (isMountedRef.current) {
        setRealTimeData(prev => ({
          ...prev,
          activeTrips: tripsResponse.count || 0,
          onlineDrivers: driversResponse.count || 0,
          pendingApprovals: verificationsResponse.count || 0,
        }));
        setLastUpdate(new Date());
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error refreshing real-time data:', error);
      if (isMountedRef.current && connectionStatus !== 'disconnected') {
        setConnectionStatus('disconnected');
      }
    }
  }, [connectionStatus]);

  const subscribeToTable = useCallback((table, event, callback) => {
    try {
      const channel = supabase.channel(`public:${table}:${Date.now()}`);
      
      const subscription = channel
        .on('postgres_changes', 
          { event, schema: 'public', table }, 
          (payload) => {
            if (isMountedRef.current) {
              callback(payload);
              setLastUpdate(new Date());
            }
          }
        )
        .subscribe((status, error) => {
          if (isMountedRef.current) {
            if (status === 'SUBSCRIBED') {
              console.log(`Subscribed to ${table} successfully`);
              setConnectionStatus('connected');
              retryCountRef.current = 0;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn(`Subscription error for ${table}:`, error);
              if (retryCountRef.current < MAX_RETRIES) {
                const delay = RETRY_DELAYS[retryCountRef.current];
                retryCountRef.current++;
                console.log(`Retrying subscription to ${table} in ${delay}ms (attempt ${retryCountRef.current})`);
                setTimeout(() => subscribeToTable(table, event, callback), delay);
              } else {
                console.error(`Max retries reached for ${table}, switching to polling`);
                setConnectionStatus('polling');
                startPolling();
              }
            }
          }
        });

      subscriptionsRef.current = [...subscriptionsRef.current, subscription];
      return subscription;
    } catch (error) {
      console.error(`Error subscribing to ${table}:`, error);
      return null;
    }
  }, []);

  const startPolling = useCallback(() => {
    cleanup(); // Clear any existing WebSocket connections
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Immediate refresh
    refreshData();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        refreshData();
      }
    }, POLLING_INTERVAL);

    console.log('Started polling as WebSocket fallback');
  }, [cleanup, refreshData]);

  const initializeRealTime = useCallback(() => {
    if (!isMountedRef.current) return;

    cleanup(); // Clean up any existing connections
    setConnectionStatus('connecting');

    // First, try to refresh data via REST
    refreshData().then(() => {
      if (!isMountedRef.current) return;

      // Then attempt WebSocket subscriptions
      try {
        // Subscribe to trips
        const tripSub = subscribeToTable('trips', '*', (payload) => {
          console.log('Trip update:', payload);
          setRealTimeData(prev => ({
            ...prev,
            recentActivities: [
              { type: 'trip', data: payload.new, timestamp: new Date() },
              ...prev.recentActivities.slice(0, 9)
            ]
          }));
        });

        // Subscribe to drivers
        const driverSub = subscribeToTable('drivers', '*', (payload) => {
          console.log('Driver update:', payload);
          setRealTimeData(prev => ({
            ...prev,
            recentActivities: [
              { type: 'driver', data: payload.new, timestamp: new Date() },
              ...prev.recentActivities.slice(0, 9)
            ]
          }));
        });

        // Subscribe to emergencies
        const emergencySub = subscribeToTable('emergencies', '*', (payload) => {
          console.log('Emergency update:', payload);
          if (payload.new && payload.new.status === 'active') {
            setRealTimeData(prev => ({
              ...prev,
              emergencies: [...prev.emergencies.filter(e => e.id !== payload.new.id), payload.new],
              recentActivities: [
                { type: 'emergency', data: payload.new, timestamp: new Date() },
                ...prev.recentActivities.slice(0, 9)
              ]
            }));
          } else if (payload.new && payload.new.status === 'resolved') {
            setRealTimeData(prev => ({
              ...prev,
              emergencies: prev.emergencies.filter(e => e.id !== payload.new.id)
            }));
          }
        });

        // If no subscriptions were created (all returned null), start polling
        if (!tripSub && !driverSub && !emergencySub) {
          console.log('All WebSocket subscriptions failed, starting polling');
          startPolling();
        }

      } catch (error) {
        console.error('Error initializing real-time subscriptions:', error);
        startPolling();
      }
    });
  }, [cleanup, refreshData, subscribeToTable, startPolling]);

  // Initialize on mount
  useEffect(() => {
    isMountedRef.current = true;
    initializeRealTime();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [initializeRealTime, cleanup]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (isMountedRef.current) {
      console.log('Manual reconnect requested');
      retryCountRef.current = 0;
      initializeRealTime();
    }
  }, [initializeRealTime]);

  const value = {
    realTimeData,
    connectionStatus,
    lastUpdate,
    refreshData,
    reconnect,
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};