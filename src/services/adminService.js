import { supabase } from './supabase';
import { auditService } from './auditService';

export const adminService = {
  // Create new admin account
  async createAdmin(adminData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true,
        user_metadata: {
          name: adminData.name,
          role: adminData.role,
          phone: adminData.phone,
          department: adminData.department,
          is_active: true
        }
      });

      if (authError) throw authError;

      const { data, error } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          phone: adminData.phone,
          department: adminData.department,
          permissions: adminData.permissions || [],
          is_active: true,
          created_by: adminData.created_by,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await auditService.logAdminAction({
        admin_id: adminData.created_by,
        action_type: 'admin.create',
        resource_type: 'admin',
        resource_id: data.id,
        details: {
          email: adminData.email,
          role: adminData.role,
          name: adminData.name
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error creating admin:', error);
      return { data: null, error };
    }
  },

  // Update admin details
  async updateAdmin(adminId, updateData) {
    try {
      // First update auth metadata if needed
      if (updateData.email || updateData.name) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          adminId,
          {
            email: updateData.email,
            user_metadata: {
              name: updateData.name,
              role: updateData.role,
              ...updateData.metadata
            }
          }
        );

        if (authError) throw authError;
      }

      const { data, error } = await supabase
        .from('admins')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating admin:', error);
      return { data: null, error };
    }
  },

  // Suspend admin account
  async suspendAdmin(adminId, reason, suspendedBy) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .update({
          is_active: false,
          suspended_at: new Date().toISOString(),
          suspended_by: suspendedBy,
          suspension_reason: reason
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) throw error;

      // Log suspension
      await auditService.logAdminAction({
        admin_id: suspendedBy,
        action_type: 'admin.suspend',
        resource_type: 'admin',
        resource_id: adminId,
        details: { reason }
      });

      // Force logout
      await this.forceLogoutAdmin(adminId);

      return { data, error: null };
    } catch (error) {
      console.error('Error suspending admin:', error);
      return { data: null, error };
    }
  },

  // Reactivate admin account
  async reactivateAdmin(adminId, reactivatedBy) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .update({
          is_active: true,
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null,
          reactivated_at: new Date().toISOString(),
          reactivated_by: reactivatedBy
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: reactivatedBy,
        action_type: 'admin.reactivate',
        resource_type: 'admin',
        resource_id: adminId,
        details: {}
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error reactivating admin:', error);
      return { data: null, error };
    }
  },

  // Get admin statistics
  async getAdminStats() {
    try {
      // Get total admins count
      const { count: totalAdmins, error: countError } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get active admins count
      const { count: activeAdmins, error: activeError } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) throw activeError;

      // Get admins by role
        const { data: roleStats, error: roleError } = await supabase
         .from('admins')
         .select('role')
        .eq('is_active', true);

    if (roleError) throw roleError;

      const rolesCount = roleStats.reduce((acc, admin) => {
        acc[admin.role] = (acc[admin.role] || 0) + 1;
        return acc;
      }, {});

      // Get recent activity count
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: recentActivity, error: activityError } = await supabase
        .from('admin_actions_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (activityError) throw activityError;

      return {
        data: {
          total_admins: totalAdmins,
          active_admins: activeAdmins,
          suspended_admins: totalAdmins - activeAdmins,
          roles_distribution: rolesCount,
          recent_activity: recentActivity,
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return { data: null, error };
    }
  },

  // Get admin activity log
  async getAdminActivity(adminId, timeRange = '24h') {
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

      const { data, error } = await supabase
        .from('admin_actions_log')
        .select(`
          *,
          admins (name, email, role)
        `)
        .eq('admin_id', adminId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching admin activity:', error);
      return { data: null, error };
    }
  },

  // Reset admin password
  async resetAdminPassword(adminId, resetBy) {
    try {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      
      const { error } = await supabase.auth.admin.updateUserById(
        adminId,
        {
          password: tempPassword
        }
      );

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: resetBy,
        action_type: 'admin.password_reset',
        resource_type: 'admin',
        resource_id: adminId,
        details: {}
      });

      return { 
        data: { 
          success: true, 
          temporary_password: tempPassword 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error resetting admin password:', error);
      return { data: null, error };
    }
  },

  // Force admin logout from all devices
  async forceLogoutAdmin(adminId) {
    try {
      // Invalidate all sessions for this admin
      const { error } = await supabase.auth.admin.signOut(adminId);

      if (error) throw error;

      // Clear admin sessions from our table
      const { error: clearError } = await supabase
        .from('admin_sessions')
        .delete()
        .eq('admin_id', adminId);

      if (clearError) throw clearError;

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('Error forcing admin logout:', error);
      return { data: null, error };
    }
  },

  // Get available admin roles
  async getAdminRoles() {
    try {
      // This could come from a configuration table or hardcoded
      const roles = [
        {
          id: 'SUPER_ADMIN',
          name: 'Super Admin',
          description: 'Full system access with all privileges',
          permissions: ['*'],
          level: 100
        },
        {
          id: 'ADMIN',
          name: 'Admin',
          description: 'Full administrative access',
          permissions: [
            'users.manage',
            'drivers.manage',
            'trips.manage',
            'finance.manage',
            'reports.view',
            'settings.manage'
          ],
          level: 90
        },
        {
          id: 'OPERATIONS',
          name: 'Operations',
          description: 'Ride operations and management',
          permissions: [
            'trips.view',
            'trips.manage',
            'drivers.view',
            'drivers.manage',
            'emergencies.manage',
            'reports.view'
          ],
          level: 80
        },
        {
          id: 'FINANCE',
          name: 'Finance',
          description: 'Financial operations and reporting',
          permissions: [
            'payments.view',
            'payments.manage',
            'payouts.manage',
            'wallets.manage',
            'transactions.view',
            'reports.view'
          ],
          level: 80
        },
        {
          id: 'SUPPORT',
          name: 'Support',
          description: 'Customer support and issue resolution',
          permissions: [
            'users.view',
            'drivers.view',
            'trips.view',
            'disputes.manage',
            'complaints.manage'
          ],
          level: 70
        },
        {
          id: 'ANALYTICS',
          name: 'Analytics',
          description: 'Data analysis and reporting',
          permissions: [
            'reports.view',
            'analytics.view',
            'data.export',
            'dashboard.view'
          ],
          level: 70
        },
        {
          id: 'VIEWER',
          name: 'Viewer',
          description: 'Read-only access for viewing',
          permissions: [
            'dashboard.view',
            'reports.view',
            'analytics.view'
          ],
          level: 50
        }
      ];

      return { data: roles, error: null };
    } catch (error) {
      console.error('Error fetching admin roles:', error);
      return { data: null, error };
    }
  },

  // Update admin role
  async updateAdminRole(adminId, role, updatedBy) {
    try {
      // First check if the updater has permission to assign this role
      const { data: updater, error: updaterError } = await supabase
        .from('admins')
        .select('role')
        .eq('id', updatedBy)
        .single();

      if (updaterError) throw updaterError;

      // Super admin can assign any role
      // Admin can only assign roles with level < 90
      if (updater.role !== 'SUPER_ADMIN') {
        const { data: allRoles } = await this.getAdminRoles();
        const targetRole = allRoles.data.find(r => r.id === role);
        
        if (targetRole && targetRole.level >= 90) {
          throw new Error('You do not have permission to assign this role');
        }
      }

      const { data, error } = await supabase
        .from('admins')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) throw error;

      // Update auth metadata
      await supabase.auth.admin.updateUserById(adminId, {
        user_metadata: { role: role }
      });

      await auditService.logAdminAction({
        admin_id: updatedBy,
        action_type: 'admin.role_update',
        resource_type: 'admin',
        resource_id: adminId,
        details: { new_role: role }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating admin role:', error);
      return { data: null, error };
    }
  },

  // Get admin by ID
  async getAdminById(adminId) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select(`
          *,
          created_by_admin:admins!admins_created_by_fkey (name, email),
          suspended_by_admin:admins!admins_suspended_by_fkey (name, email),
          reactivated_by_admin:admins!admins_reactivated_by_fkey (name, email)
        `)
        .eq('id', adminId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching admin:', error);
      return { data: null, error };
    }
  },

  // Get all admins with filters
  async getAllAdmins(filters = {}) {
    try {
      let query = supabase
        .from('admins')
        .select(`
          *,
          created_by_admin:admins!admins_created_by_fkey (name),
          last_login:admin_sessions!admin_sessions_admin_id_fkey (created_at)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.department) {
        query = query.eq('department', filters.department);
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

      return { 
        data, 
        count,
        error: null 
      };
    } catch (error) {
      console.error('Error fetching admins:', error);
      return { data: null, count: 0, error };
    }
  },

  // Get admin's recent sessions
  async getAdminSessions(adminId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching admin sessions:', error);
      return { data: null, error };
    }
  },

  // Track admin login
  async trackAdminLogin(adminId, userAgent, ipAddress) {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .insert({
          admin_id: adminId,
          user_agent: userAgent,
          ip_address: ipAddress,
          login_time: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Update last login in admins table
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminId);

      return { data, error: null };
    } catch (error) {
      console.error('Error tracking admin login:', error);
      return { data: null, error };
    }
  },

  // Track admin logout
  async trackAdminLogout(sessionId) {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .update({
          logout_time: new Date().toISOString(),
          is_active: false,
          duration: supabase.sql`EXTRACT(EPOCH FROM (NOW() - login_time))`
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error tracking admin logout:', error);
      return { data: null, error };
    }
  }
};

export default adminService;