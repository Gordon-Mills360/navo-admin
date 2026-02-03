import { supabase } from './supabase';
import { auditService } from './auditService';
import { formatPhone, formatDate } from '../utils/formatters';

export const userService = {
  // Get filtered user lists
  async getUsers(filters = {}) {
    try {
      const { user_type = 'all', ...otherFilters } = filters;
      
      let query;
      let tableName;
      
      // Determine which table to query based on user_type
      if (user_type === 'drivers' || user_type === 'driver') {
        tableName = 'drivers';
        query = supabase.from('drivers').select('*', { count: 'exact' });
      } else if (user_type === 'passengers' || user_type === 'passenger') {
        tableName = 'passengers';
        query = supabase.from('passengers').select('*', { count: 'exact' });
      } else {
        // For 'all', we need to query both tables
        return await this.getAllUsers(otherFilters);
      }

      // Apply common filters
      if (otherFilters.search) {
        query = query.or(`name.ilike.%${otherFilters.search}%,email.ilike.%${otherFilters.search}%,phone.ilike.%${otherFilters.search}%`);
      }

      if (otherFilters.status) {
        query = query.eq('status', otherFilters.status);
      }

      if (otherFilters.city) {
        query = query.eq('city', otherFilters.city);
      }

      if (otherFilters.vehicle_type && tableName === 'drivers') {
        query = query.eq('vehicle_type', otherFilters.vehicle_type);
      }

      // Date range filters
      if (otherFilters.created_after) {
        query = query.gte('created_at', otherFilters.created_after);
      }

      if (otherFilters.created_before) {
        query = query.lte('created_at', otherFilters.created_before);
      }

      // Pagination
      if (otherFilters.page && otherFilters.limit) {
        const from = (otherFilters.page - 1) * otherFilters.limit;
        const to = from + otherFilters.limit - 1;
        query = query.range(from, to);
      }

      // Sorting
      if (otherFilters.sortBy) {
        query = query.order(otherFilters.sortBy, { 
          ascending: otherFilters.sortOrder !== 'desc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Format phone numbers
      const formattedData = data.map(user => ({
        ...user,
        phone: formatPhone(user.phone),
        created_at: formatDate(user.created_at, 'datetime')
      }));

      return { 
        data: formattedData, 
        count,
        user_type,
        error: null 
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: null, count: 0, error };
    }
  },

  // Get all users (both drivers and passengers)
  async getAllUsers(filters = {}) {
    try {
      // Fetch drivers and passengers in parallel
      const [driversResult, passengersResult] = await Promise.all([
        this.getUsers({ ...filters, user_type: 'drivers' }),
        this.getUsers({ ...filters, user_type: 'passengers' })
      ]);

      if (driversResult.error) throw driversResult.error;
      if (passengersResult.error) throw passengersResult.error;

      // Combine results
      const combinedData = [
        ...(driversResult.data || []).map(user => ({ ...user, user_type: 'driver' })),
        ...(passengersResult.data || []).map(user => ({ ...user, user_type: 'passenger' }))
      ];

      // Apply sorting to combined data if needed
      if (filters.sortBy) {
        combinedData.sort((a, b) => {
          const aValue = a[filters.sortBy];
          const bValue = b[filters.sortBy];
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          
          if (aValue < bValue) return -1 * order;
          if (aValue > bValue) return 1 * order;
          return 0;
        });
      }

      // Apply pagination to combined data
      let paginatedData = combinedData;
      if (filters.page && filters.limit) {
        const start = (filters.page - 1) * filters.limit;
        const end = start + filters.limit;
        paginatedData = combinedData.slice(start, end);
      }

      return {
        data: paginatedData,
        count: (driversResult.count || 0) + (passengersResult.count || 0),
        user_type: 'all',
        error: null
      };
    } catch (error) {
      console.error('Error fetching all users:', error);
      return { data: null, count: 0, error };
    }
  },

  // Get complete user data
  async getUserDetails(userId, userType) {
    try {
      const tableName = userType === 'driver' ? 'drivers' : 'passengers';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          ${userType === 'driver' ? `
            vehicles (*),
            documents (*),
            wallet:wallet (*),
            trips:trips (count),
            ratings:ratings (avg(rating), count)
          ` : `
            wallet:wallet (*),
            trips:trips (count),
            ratings:ratings (avg(rating), count)
          `}
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Format the data
      const formattedData = {
        ...data,
        phone: formatPhone(data.phone),
        created_at: formatDate(data.created_at, 'full'),
        user_type: userType,
        statistics: {
          total_trips: data.trips?.[0]?.count || 0,
          average_rating: data.ratings?.[0]?.avg || 0,
          rating_count: data.ratings?.[0]?.count || 0
        }
      };

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return { data: null, error };
    }
  },

  // Update user status
  async updateUserStatus(userId, status, reason, adminId, userType) {
    try {
      const tableName = userType === 'driver' ? 'drivers' : 'passengers';
      
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'suspended' && {
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          suspended_by: adminId
        }),
        ...(status === 'active' && status !== 'suspended' && {
          suspended_at: null,
          suspension_reason: null,
          suspended_by: null
        })
      };

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await auditService.logAdminAction({
        admin_id: adminId,
        action_type: `user.${status}`,
        resource_type: userType,
        resource_id: userId,
        details: { status, reason }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { data: null, error };
    }
  },

  // Get user statistics
  async getUserStatistics(timeRange = '30d') {
    try {
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Get driver statistics
      const { count: totalDrivers, error: driversError } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true });

      if (driversError) throw driversError;

      const { count: newDrivers, error: newDriversError } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (newDriversError) throw newDriversError;

      const { data: driverStatusStats, error: driverStatusError } = await supabase
        .from('drivers')
        .select('status');

      if (driverStatusError) throw driverStatusError;

      const driverStatusCount = driverStatusStats.reduce((acc, driver) => {
        acc[driver.status] = (acc[driver.status] || 0) + 1;
        return acc;
      }, {});

      // Get passenger statistics
      const { count: totalPassengers, error: passengersError } = await supabase
        .from('passengers')
        .select('*', { count: 'exact', head: true });

      if (passengersError) throw passengersError;

      const { count: newPassengers, error: newPassengersError } = await supabase
        .from('passengers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (newPassengersError) throw newPassengersError;

      const { data: passengerStatusStats, error: passengerStatusError } = await supabase
        .from('passengers')
        .select('status');

      if (passengerStatusError) throw passengerStatusError;

      const passengerStatusCount = passengerStatusStats.reduce((acc, passenger) => {
        acc[passenger.status] = (acc[passenger.status] || 0) + 1;
        return acc;
      }, {});

      // Get city distribution for drivers
      const { data: driverCities, error: citiesError } = await supabase
        .from('drivers')
        .select('city')
        .not('city', 'is', null);

      if (citiesError) throw citiesError;

      const cityDistribution = driverCities.reduce((acc, driver) => {
        if (driver.city) {
          acc[driver.city] = (acc[driver.city] || 0) + 1;
        }
        return acc;
      }, {});

      // Get vehicle type distribution
      const { data: vehicleTypes, error: vehicleError } = await supabase
        .from('drivers')
        .select('vehicle_type')
        .not('vehicle_type', 'is', null);

      if (vehicleError) throw vehicleError;

      const vehicleTypeDistribution = vehicleTypes.reduce((acc, driver) => {
        if (driver.vehicle_type) {
          acc[driver.vehicle_type] = (acc[driver.vehicle_type] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        data: {
          time_range: timeRange,
          total_users: totalDrivers + totalPassengers,
          drivers: {
            total: totalDrivers,
            new: newDrivers,
            by_status: driverStatusCount
          },
          passengers: {
            total: totalPassengers,
            new: newPassengers,
            by_status: passengerStatusCount
          },
          city_distribution: cityDistribution,
          vehicle_type_distribution: vehicleTypeDistribution,
          growth_rate: {
            drivers: totalDrivers > 0 ? (newDrivers / totalDrivers * 100).toFixed(2) : '0',
            passengers: totalPassengers > 0 ? (newPassengers / totalPassengers * 100).toFixed(2) : '0'
          },
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      return { data: null, error };
    }
  },

  // Search users
  async searchUsers(query, userType = 'all') {
    try {
      const searchTerm = `%${query}%`;
      
      if (userType === 'all') {
        // Search both tables
        const [driversResult, passengersResult] = await Promise.all([
          supabase
            .from('drivers')
            .select('*')
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
            .limit(10),
          supabase
            .from('passengers')
            .select('*')
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
            .limit(10)
        ]);

        if (driversResult.error) throw driversResult.error;
        if (passengersResult.error) throw passengersResult.error;

        const combinedResults = [
          ...(driversResult.data || []).map(driver => ({ ...driver, user_type: 'driver' })),
          ...(passengersResult.data || []).map(passenger => ({ ...passenger, user_type: 'passenger' }))
        ];

        return { data: combinedResults, error: null };
      } else {
        const tableName = userType === 'driver' ? 'drivers' : 'passengers';
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
          .limit(20);

        if (error) throw error;

        const resultsWithType = (data || []).map(user => ({
          ...user,
          user_type: userType
        }));

        return { data: resultsWithType, error: null };
      }
    } catch (error) {
      console.error('Error searching users:', error);
      return { data: null, error };
    }
  },

  // Export user data
  async exportUsers(format = 'csv', filters = {}) {
    try {
      // Get the data
      const { data, error } = await this.getUsers(filters);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      if (format === 'csv') {
        const csvContent = this.convertUsersToCSV(data, filters.user_type);
        return {
          data: csvContent,
          filename: `${filters.user_type || 'users'}_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      } else if (format === 'json') {
        return {
          data: JSON.stringify(data, null, 2),
          filename: `${filters.user_type || 'users'}_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      return { data: null, error };
    }
  },

  // Create new user
  async createUser(userData, createdBy) {
    try {
      const tableName = userData.user_type === 'driver' ? 'drivers' : 'passengers';
      
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          ...userData,
          status: 'active',
          created_at: new Date().toISOString(),
          verification_status: 'pending',
          is_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await auditService.logAdminAction({
        admin_id: createdBy,
        action_type: 'user.create',
        resource_type: userData.user_type,
        resource_id: data.id,
        details: {
          email: userData.email,
          name: userData.name,
          phone: userData.phone
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error creating user:', error);
      return { data: null, error };
    }
  },

  // Update user information
  async updateUser(userId, userData, updatedBy, userType) {
    try {
      const tableName = userType === 'driver' ? 'drivers' : 'passengers';
      
      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: updatedBy,
        action_type: 'user.update',
        resource_type: userType,
        resource_id: userId,
        details: userData
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      return { data: null, error };
    }
  },

  // Delete user account
  async deleteUser(userId, deletedBy, userType) {
    try {
      const tableName = userType === 'driver' ? 'drivers' : 'passengers';
      
      // First, check if user has any active trips or pending transactions
      const { data: activeTrips, error: tripsError } = await supabase
        .from('trips')
        .select('id')
        .eq(`${userType}_id`, userId)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .limit(1);

      if (tripsError) throw tripsError;

      if (activeTrips && activeTrips.length > 0) {
        throw new Error('Cannot delete user with active trips');
      }

      // Mark as deleted instead of actually deleting
      const { data, error } = await supabase
        .from(tableName)
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: deletedBy,
        action_type: 'user.delete',
        resource_type: userType,
        resource_id: userId,
        details: {}
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { data: null, error };
    }
  },

  // Get user activity log
  async getUserActivity(userId, userType, timeRange = '7d') {
    try {
      let startDate = new Date();
      
      switch (timeRange) {
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
          startDate.setDate(startDate.getDate() - 7);
      }

      // Get user trips
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq(`${userType}_id`, userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (tripsError) throw tripsError;

      // Get user transactions if driver
      let transactions = [];
      if (userType === 'driver') {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', userId)
          .eq('user_type', 'driver')
          .single();

        if (!walletError && walletData) {
          const { data: transData, error: transError } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', walletData.id)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

          if (!transError) {
            transactions = transData;
          }
        }
      }

      // Get user ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .eq('ratee_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (ratingsError) throw ratingsError;

      return {
        data: {
          trips: trips || [],
          transactions: transactions || [],
          ratings: ratings || [],
          activity_count: (trips?.length || 0) + (transactions?.length || 0) + (ratings?.length || 0)
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return { data: null, error };
    }
  },

  // Convert users to CSV
  convertUsersToCSV(users, userType) {
    if (!users || users.length === 0) {
      return '';
    }

    const headers = userType === 'driver' ? [
      'ID', 'Name', 'Email', 'Phone', 'Status', 'City', 'Vehicle Type', 'Vehicle Model',
      'License Plate', 'Rating', 'Total Trips', 'Total Earnings', 'Verification Status',
      'Created At', 'Last Online'
    ] : [
      'ID', 'Name', 'Email', 'Phone', 'Status', 'City', 'Rating', 'Total Trips',
      'Total Spent', 'Created At', 'Last Active'
    ];

    const rows = users.map(user => {
      if (userType === 'driver') {
        return [
          user.id,
          user.name,
          user.email,
          user.phone,
          user.status,
          user.city,
          user.vehicle_type,
          user.vehicle_model,
          user.license_plate,
          user.rating || '0.0',
          user.total_trips || '0',
          user.total_earnings || '0',
          user.verification_status,
          user.created_at,
          user.last_online || 'Never'
        ];
      } else {
        return [
          user.id,
          user.name,
          user.email,
          user.phone,
          user.status,
          user.city,
          user.rating || '0.0',
          user.total_trips || '0',
          user.total_spent || '0',
          user.created_at,
          user.last_active || 'Never'
        ];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  // Verify user documents
  async verifyUserDocuments(userId, userType, verificationData, verifiedBy) {
    try {
      if (userType !== 'driver') {
        throw new Error('Only drivers have documents to verify');
      }

      // Update driver verification status
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .update({
          verification_status: verificationData.status,
          is_verified: verificationData.status === 'verified',
          verified_at: verificationData.status === 'verified' ? new Date().toISOString() : null,
          verified_by: verificationData.status === 'verified' ? verifiedBy : null,
          verification_notes: verificationData.notes
        })
        .eq('id', userId)
        .select()
        .single();

      if (driverError) throw driverError;

      // Update document statuses if provided
      if (verificationData.document_updates) {
        for (const docUpdate of verificationData.document_updates) {
          await supabase
            .from('documents')
            .update({
              status: docUpdate.status,
              verified_at: docUpdate.status === 'approved' ? new Date().toISOString() : null,
              verified_by: docUpdate.status === 'approved' ? verifiedBy : null,
              rejection_reason: docUpdate.rejection_reason
            })
            .eq('id', docUpdate.document_id)
            .eq('user_id', userId);
        }
      }

      await auditService.logAdminAction({
        admin_id: verifiedBy,
        action_type: 'user.verify',
        resource_type: 'driver',
        resource_id: userId,
        details: verificationData
      });

      return { data: driverData, error: null };
    } catch (error) {
      console.error('Error verifying user documents:', error);
      return { data: null, error };
    }
  }
};

export default userService;