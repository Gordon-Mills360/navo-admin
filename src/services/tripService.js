import { supabase } from './supabase';
import { auditService } from './auditService';
import { formatCurrency, formatDate, formatDuration } from '../utils/formatters';

export const tripService = {
  // Get filtered trip lists
  async getTrips(filters = {}) {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          driver:drivers (name, phone, vehicle_model, license_plate),
          passenger:passengers (name, phone)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(
          `id.ilike.%${filters.search}%,pickup_address.ilike.%${filters.search}%,dropoff_address.ilike.%${filters.search}%`
        );
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }

      if (filters.passenger_id) {
        query = query.eq('passenger_id', filters.passenger_id);
      }

      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }

      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      if (filters.vehicle_type) {
        query = query.eq('vehicle_type', filters.vehicle_type);
      }

      // Date range filters
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.min_amount) {
        query = query.gte('total_amount', filters.min_amount);
      }

      if (filters.max_amount) {
        query = query.lte('total_amount', filters.max_amount);
      }

      // Pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      // Sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder !== 'desc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Format the data
      const formattedData = (data || []).map(trip => ({
        ...trip,
        formatted_amount: formatCurrency(trip.total_amount, trip.currency),
        formatted_distance: `${(trip.distance / 1000).toFixed(2)} km`,
        formatted_duration: formatDuration(trip.duration),
        created_at_formatted: formatDate(trip.created_at, 'datetime'),
        pickup_time_formatted: trip.pickup_time ? formatDate(trip.pickup_time, 'datetime') : null,
        dropoff_time_formatted: trip.dropoff_time ? formatDate(trip.dropoff_time, 'datetime') : null,
        driver_name: trip.driver?.name || 'Unknown',
        passenger_name: trip.passenger?.name || 'Unknown'
      }));

      return { 
        data: formattedData, 
        count,
        error: null 
      };
    } catch (error) {
      console.error('Error fetching trips:', error);
      return { data: null, count: 0, error };
    }
  },

  // Get complete trip data
  async getTripDetails(tripId) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          driver:drivers (*,
            vehicle:vehicles (*),
            documents (*)
          ),
          passenger:passengers (*),
          payment:payments (*),
          rating:ratings (*),
          disputes (*),
          trip_logs (*)
        `)
        .eq('id', tripId)
        .single();

      if (error) throw error;

      // Format the data
      const formattedData = {
        ...data,
        formatted_amount: formatCurrency(data.total_amount, data.currency),
        formatted_distance: `${(data.distance / 1000).toFixed(2)} km`,
        formatted_duration: formatDuration(data.duration),
        formatted_wait_time: formatDuration(data.wait_time),
        created_at_formatted: formatDate(data.created_at, 'full'),
        pickup_time_formatted: data.pickup_time ? formatDate(data.pickup_time, 'full') : null,
        dropoff_time_formatted: data.dropoff_time ? formatDate(data.dropoff_time, 'full') : null,
        timeline: this.generateTripTimeline(data)
      };

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error fetching trip details:', error);
      return { data: null, error };
    }
  },

  // Update trip state
  async updateTripState(tripId, state, reason, adminId) {
    try {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('status')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;

      const { data, error } = await supabase
        .from('trips')
        .update({
          status: state,
          updated_at: new Date().toISOString(),
          ...(reason && { admin_notes: reason }),
          ...(state === 'cancelled' && { cancelled_at: new Date().toISOString() }),
          ...(state === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) throw error;

      // Add to trip logs
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: tripId,
          action: 'status_change',
          from_status: trip.status,
          to_status: state,
          performed_by: adminId,
          performed_by_type: 'admin',
          notes: reason,
          created_at: new Date().toISOString()
        });

      // Log the action
      await auditService.logAdminAction({
        admin_id: adminId,
        action_type: 'trip.status_update',
        resource_type: 'trip',
        resource_id: tripId,
        details: {
          from_status: trip.status,
          to_status: state,
          reason
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating trip state:', error);
      return { data: null, error };
    }
  },

  // Get trip statistics
  async getTripStatistics(timeRange = '24h') {
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

      // Get total trips
      const { count: totalTrips, error: totalError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (totalError) throw totalError;

      // Get completed trips
      const { count: completedTrips, error: completedError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      if (completedError) throw completedError;

      // Get cancelled trips
      const { count: cancelledTrips, error: cancelledError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .eq('status', 'cancelled');

      if (cancelledError) throw cancelledError;

      // Get total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('trips')
        .select('total_amount, currency')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed')
        .eq('payment_status', 'paid');

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData.reduce((sum, trip) => sum + trip.total_amount, 0);

      // Get trips by status
      const { data: byStatus, error: statusError } = await supabase
        .from('trips')
        .select('status')
        .gte('created_at', startDate.toISOString());

      if (statusError) throw statusError;

      const statusStats = byStatus.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1;
        return acc;
      }, {});

      // Get trips by vehicle type
      const { data: byVehicle, error: vehicleError } = await supabase
        .from('trips')
        .select('vehicle_type')
        .gte('created_at', startDate.toISOString());

      if (vehicleError) throw vehicleError;

      const vehicleStats = byVehicle.reduce((acc, trip) => {
        if (trip.vehicle_type) {
          acc[trip.vehicle_type] = (acc[trip.vehicle_type] || 0) + 1;
        }
        return acc;
      }, {});

      // Get average trip metrics
      const { data: completedTripsData, error: metricsError } = await supabase
        .from('trips')
        .select('distance, duration, total_amount, wait_time')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      if (metricsError) throw metricsError;

      const avgDistance = completedTripsData.length > 0 
        ? completedTripsData.reduce((sum, trip) => sum + trip.distance, 0) / completedTripsData.length 
        : 0;
      
      const avgDuration = completedTripsData.length > 0 
        ? completedTripsData.reduce((sum, trip) => sum + trip.duration, 0) / completedTripsData.length 
        : 0;
      
      const avgAmount = completedTripsData.length > 0 
        ? completedTripsData.reduce((sum, trip) => sum + trip.total_amount, 0) / completedTripsData.length 
        : 0;

      // Get hourly distribution for the last 24 hours
      const hourlyStats = {};
      if (timeRange === '24h') {
        for (let i = 0; i < 24; i++) {
          const hourStart = new Date(startDate);
          hourStart.setHours(hourStart.getHours() + i);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(hourEnd.getHours() + 1);

          const { count, error: hourError } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', hourStart.toISOString())
            .lt('created_at', hourEnd.toISOString());

          if (!hourError) {
            const hourLabel = `${hourStart.getHours().toString().padStart(2, '0')}:00`;
            hourlyStats[hourLabel] = count;
          }
        }
      }

      return {
        data: {
          total_trips: totalTrips,
          completed_trips: completedTrips,
          cancelled_trips: cancelledTrips,
          completion_rate: totalTrips > 0 ? (completedTrips / totalTrips * 100).toFixed(2) : '0',
          cancellation_rate: totalTrips > 0 ? (cancelledTrips / totalTrips * 100).toFixed(2) : '0',
          total_revenue: totalRevenue,
          formatted_revenue: formatCurrency(totalRevenue, revenueData[0]?.currency || 'USD'),
          by_status: statusStats,
          by_vehicle_type: vehicleStats,
          average_metrics: {
            distance: avgDistance / 1000, // Convert to km
            duration: avgDuration,
            amount: avgAmount,
            formatted_distance: `${(avgDistance / 1000).toFixed(2)} km`,
            formatted_duration: formatDuration(avgDuration),
            formatted_amount: formatCurrency(avgAmount, revenueData[0]?.currency || 'USD')
          },
          hourly_distribution: hourlyStats,
          time_range: timeRange,
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching trip statistics:', error);
      return { data: null, error };
    }
  },

  // Search trips
  async searchTrips(query, filters = {}) {
    try {
      let searchQuery = supabase
        .from('trips')
        .select(`
          *,
          driver:drivers (name, phone),
          passenger:passengers (name, phone)
        `, { count: 'exact' })
        .or(
          `id.ilike.%${query}%,pickup_address.ilike.%${query}%,dropoff_address.ilike.%${query}%,driver.name.ilike.%${query}%,passenger.name.ilike.%${query}%`
        );

      // Apply additional filters
      if (filters.status) {
        searchQuery = searchQuery.eq('status', filters.status);
      }

      if (filters.start_date) {
        searchQuery = searchQuery.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        searchQuery = searchQuery.lte('created_at', filters.end_date);
      }

      // Pagination
      if (filters.limit) {
        searchQuery = searchQuery.limit(filters.limit);
      }

      searchQuery = searchQuery.order('created_at', { ascending: false });

      const { data, error, count } = await searchQuery;

      if (error) throw error;

      return { data, count, error: null };
    } catch (error) {
      console.error('Error searching trips:', error);
      return { data: null, count: 0, error };
    }
  },

  // Export trip data
  async exportTrips(format = 'csv', filters = {}) {
    try {
      // Get the data
      const { data, error } = await this.getTrips(filters);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      if (format === 'csv') {
        const csvContent = this.convertTripsToCSV(data);
        return {
          data: csvContent,
          filename: `trips_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      } else if (format === 'json') {
        return {
          data: JSON.stringify(data, null, 2),
          filename: `trips_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting trips:', error);
      return { data: null, error };
    }
  },

  // Create manual trip
  async createTrip(tripData, createdBy) {
    try {
      // Validate required fields
      const requiredFields = ['passenger_id', 'pickup_address', 'dropoff_address', 'vehicle_type'];
      for (const field of requiredFields) {
        if (!tripData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      const trip = {
        ...tripData,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        created_by: createdBy,
        is_manual: true
      };

      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await auditService.logAdminAction({
        admin_id: createdBy,
        action_type: 'trip.create',
        resource_type: 'trip',
        resource_id: data.id,
        details: {
          passenger_id: tripData.passenger_id,
          pickup_address: tripData.pickup_address,
          dropoff_address: tripData.dropoff_address,
          is_manual: true
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error creating trip:', error);
      return { data: null, error };
    }
  },

  // Cancel trip
  async cancelTrip(tripId, reason, cancelledBy) {
    try {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('status, driver_id, passenger_id, total_amount')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;

      if (trip.status === 'completed' || trip.status === 'cancelled') {
        throw new Error(`Cannot cancel trip with status: ${trip.status}`);
      }

      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy,
          cancellation_reason: reason,
          admin_notes: reason
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) throw error;

      // Add to trip logs
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: tripId,
          action: 'cancelled',
          from_status: trip.status,
          to_status: 'cancelled',
          performed_by: cancelledBy,
          performed_by_type: 'admin',
          notes: reason,
          created_at: new Date().toISOString()
        });

      // Notify driver and passenger if needed
      if (trip.driver_id) {
        // Send notification to driver
        await supabase
          .from('notifications')
          .insert({
            title: 'Trip Cancelled',
            message: `Trip ${tripId} has been cancelled by admin. Reason: ${reason}`,
            type: 'info',
            recipient_type: 'specific',
            recipient_ids: [trip.driver_id],
            sender_id: cancelledBy,
            sender_type: 'admin'
          });
      }

      if (trip.passenger_id) {
        // Send notification to passenger
        await supabase
          .from('notifications')
          .insert({
            title: 'Trip Cancelled',
            message: `Your trip has been cancelled by admin. Reason: ${reason}`,
            type: 'info',
            recipient_type: 'specific',
            recipient_ids: [trip.passenger_id],
            sender_id: cancelledBy,
            sender_type: 'admin'
          });
      }

      await auditService.logAdminAction({
        admin_id: cancelledBy,
        action_type: 'trip.cancel',
        resource_type: 'trip',
        resource_id: tripId,
        details: {
          reason,
          previous_status: trip.status,
          amount: trip.total_amount
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error cancelling trip:', error);
      return { data: null, error };
    }
  },

  // Process trip refund
  async processRefund(tripId, amount, reason, processedBy) {
    try {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('status, payment_status, total_amount, passenger_id, payment_id')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;

      if (trip.payment_status !== 'paid') {
        throw new Error('Trip payment is not paid, cannot process refund');
      }

      if (amount > trip.total_amount) {
        throw new Error('Refund amount cannot exceed trip total amount');
      }

      // Update trip payment status
      const { data: updatedTrip, error: updateError } = await supabase
        .from('trips')
        .update({
          payment_status: 'refunded',
          refund_amount: amount,
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
          refunded_by: processedBy
        })
        .eq('id', tripId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create refund transaction
      await supabase
        .from('transactions')
        .insert({
          trip_id: tripId,
          user_id: trip.passenger_id,
          user_type: 'passenger',
          type: 'refund',
          amount: amount,
          status: 'completed',
          payment_method: 'admin_refund',
          reference_id: `REFUND_${tripId}_${Date.now()}`,
          notes: reason,
          processed_by: processedBy,
          created_at: new Date().toISOString()
        });

      // Update payment record if exists
      if (trip.payment_id) {
        await supabase
          .from('payments')
          .update({
            status: 'refunded',
            refund_amount: amount,
            refund_reason: reason
          })
          .eq('id', trip.payment_id);
      }

      // Add to trip logs
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: tripId,
          action: 'refund_processed',
          details: { amount, reason },
          performed_by: processedBy,
          performed_by_type: 'admin',
          created_at: new Date().toISOString()
        });

      await auditService.logAdminAction({
        admin_id: processedBy,
        action_type: 'trip.refund',
        resource_type: 'trip',
        resource_id: tripId,
        details: {
          amount,
          reason,
          trip_amount: trip.total_amount
        }
      });

      return { data: updatedTrip, error: null };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { data: null, error };
    }
  },

  // Get user trip history
  async getTripHistory(userId, userType, filters = {}) {
    try {
      const userField = userType === 'driver' ? 'driver_id' : 'passenger_id';
      
      let query = supabase
        .from('trips')
        .select('*')
        .eq(userField, userId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const completedTrips = data.filter(trip => trip.status === 'completed');
      const totalEarnings = userType === 'driver' 
        ? completedTrips.reduce((sum, trip) => sum + (trip.driver_earning || 0), 0)
        : completedTrips.reduce((sum, trip) => sum + trip.total_amount, 0);

      const statistics = {
        total_trips: data.length,
        completed_trips: completedTrips.length,
        cancelled_trips: data.filter(trip => trip.status === 'cancelled').length,
        total_earnings: totalEarnings,
        average_rating: data.length > 0 
          ? data.reduce((sum, trip) => sum + (trip.rating || 0), 0) / data.length 
          : 0
      };

      return {
        data: {
          trips: data,
          statistics,
          user_type: userType
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching trip history:', error);
      return { data: null, error };
    }
  },

  // Generate trip timeline
  generateTripTimeline(trip) {
    const timeline = [];

    // Trip created
    timeline.push({
      time: trip.created_at,
      event: 'trip_created',
      description: 'Trip request created',
      status: 'completed'
    });

    // Driver assigned
    if (trip.driver_id) {
      timeline.push({
        time: trip.driver_assigned_at || trip.created_at,
        event: 'driver_assigned',
        description: `Driver assigned: ${trip.driver?.name || 'Unknown'}`,
        status: 'completed'
      });
    }

    // Driver arrived
    if (trip.driver_arrived_at) {
      timeline.push({
        time: trip.driver_arrived_at,
        event: 'driver_arrived',
        description: 'Driver arrived at pickup location',
        status: 'completed'
      });
    }

    // Trip started
    if (trip.started_at) {
      timeline.push({
        time: trip.started_at,
        event: 'trip_started',
        description: 'Trip started',
        status: 'completed'
      });
    }

    // Trip completed
    if (trip.completed_at) {
      timeline.push({
        time: trip.completed_at,
        event: 'trip_completed',
        description: 'Trip completed',
        status: 'completed'
      });
    }

    // Payment processed
    if (trip.payment_status === 'paid' && trip.payment?.paid_at) {
      timeline.push({
        time: trip.payment.paid_at,
        event: 'payment_processed',
        description: `Payment of ${formatCurrency(trip.total_amount, trip.currency)} processed`,
        status: 'completed'
      });
    }

    // Rating given
    if (trip.rating && trip.rating?.created_at) {
      timeline.push({
        time: trip.rating.created_at,
        event: 'rating_given',
        description: `Rated ${trip.rating.rating} stars`,
        status: 'completed'
      });
    }

    // Sort by time
    timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

    return timeline;
  },

  // Convert trips to CSV
  convertTripsToCSV(trips) {
    if (!trips || trips.length === 0) {
      return '';
    }

    const headers = [
      'Trip ID', 'Status', 'Passenger', 'Driver', 'Pickup Address', 'Dropoff Address',
      'Distance (km)', 'Duration', 'Total Amount', 'Payment Status', 'Payment Method',
      'Vehicle Type', 'Created At', 'Completed At', 'Cancelled At'
    ];

    const rows = trips.map(trip => [
      trip.id,
      trip.status,
      trip.passenger_name,
      trip.driver_name,
      trip.pickup_address,
      trip.dropoff_address,
      (trip.distance / 1000).toFixed(2),
      formatDuration(trip.duration),
      trip.formatted_amount,
      trip.payment_status,
      trip.payment_method || 'N/A',
      trip.vehicle_type,
      trip.created_at_formatted,
      trip.completed_at ? formatDate(trip.completed_at, 'datetime') : 'N/A',
      trip.cancelled_at ? formatDate(trip.cancelled_at, 'datetime') : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  // Assign driver to trip
  async assignDriver(tripId, driverId, assignedBy) {
    try {
      // Check if driver is available
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('status, current_location')
        .eq('id', driverId)
        .single();

      if (driverError) throw driverError;

      if (driver.status !== 'active' && driver.status !== 'online') {
        throw new Error('Driver is not available for assignment');
      }

      const { data, error } = await supabase
        .from('trips')
        .update({
          driver_id: driverId,
          driver_assigned_at: new Date().toISOString(),
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) throw error;

      // Update driver status
      await supabase
        .from('drivers')
        .update({
          status: 'busy',
          current_trip_id: tripId
        })
        .eq('id', driverId);

      // Add to trip logs
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: tripId,
          action: 'driver_assigned',
          details: { driver_id: driverId },
          performed_by: assignedBy,
          performed_by_type: 'admin',
          created_at: new Date().toISOString()
        });

      // Send notification to driver
      await supabase
        .from('notifications')
        .insert({
          title: 'New Trip Assignment',
          message: `You have been assigned to trip ${tripId} by admin`,
          type: 'info',
          recipient_type: 'specific',
          recipient_ids: [driverId],
          sender_id: assignedBy,
          sender_type: 'admin'
        });

      await auditService.logAdminAction({
        admin_id: assignedBy,
        action_type: 'trip.assign_driver',
        resource_type: 'trip',
        resource_id: tripId,
        details: { driver_id: driverId }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error assigning driver:', error);
      return { data: null, error };
    }
  }
};

export default tripService;