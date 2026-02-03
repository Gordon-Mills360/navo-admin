import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  const [subscriptions, setSubscriptions] = useState([]);

  const subscribeToTable = useCallback((table, event, callback) => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event, schema: 'public', table }, 
        callback
      )
      .subscribe();

    setSubscriptions(prev => [...prev, subscription]);
    return subscription;
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptions.forEach(sub => {
      supabase.removeChannel(sub);
    });
    setSubscriptions([]);
  }, [subscriptions]);

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to trips
    const tripSub = subscribeToTable('trips', '*', (payload) => {
      console.log('Trip update:', payload);
      // Update real-time data
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
          emergencies: [...prev.emergencies, payload.new],
          recentActivities: [
            { type: 'emergency', data: payload.new, timestamp: new Date() },
            ...prev.recentActivities.slice(0, 9)
          ]
        }));
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeAll();
    };
  }, [subscribeToTable, unsubscribeAll]);

  const refreshData = useCallback(async () => {
    try {
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
          .from('driver_verifications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      setRealTimeData(prev => ({
        ...prev,
        activeTrips: tripsResponse.count || 0,
        onlineDrivers: driversResponse.count || 0,
        pendingApprovals: verificationsResponse.count || 0,
      }));
    } catch (error) {
      console.error('Error refreshing real-time data:', error);
    }
  }, []);

  const value = {
    realTimeData,
    refreshData,
    subscribeToTable,
    unsubscribeAll,
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};