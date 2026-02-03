import { supabase } from './supabase';
import { formatDate } from '../utils/formatters';

export const auditService = {
  // Log admin action
  async logAdminAction(actionData) {
    try {
      const { data, error } = await supabase
        .from('admin_actions_log')
        .insert({
          admin_id: actionData.admin_id,
          action_type: actionData.action_type,
          resource_type: actionData.resource_type,
          resource_id: actionData.resource_id,
          details: actionData.details || {},
          ip_address: actionData.ip_address || 'admin_panel',
          user_agent: actionData.user_agent || navigator?.userAgent || '',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw, just return error to avoid breaking the main action
      return { data: null, error };
    }
  },

  // Get filtered audit logs
  async getAuditLogs(filters = {}) {
    try {
      let query = supabase
        .from('admin_actions_log')
        .select(`
          *,
          admin:admins (name, email, role)
        `, { count: 'exact' });

      // Apply filters
      if (filters.admin_id) {
        query = query.eq('admin_id', filters.admin_id);
      }

      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }

      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.search) {
        query = query.or(
          `admin.name.ilike.%${filters.search}%,action_type.ilike.%${filters.search}%,resource_type.ilike.%${filters.search}%`
        );
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
      console.error('Error fetching audit logs:', error);
      return { data: null, count: 0, error };
    }
  },

  // Export audit logs to CSV
  async exportAuditLogs(format = 'csv', filters = {}) {
    try {
      // First get the data
      const { data, error } = await this.getAuditLogs(filters);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      if (format === 'csv') {
        const csvContent = this.convertToCSV(data);
        return {
          data: csvContent,
          filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      } else if (format === 'pdf') {
        // For PDF, you would typically use a PDF generation library
        // This is a placeholder that returns JSON for PDF generation
        return {
          data: this.prepareForPDF(data),
          filename: `audit_logs_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return { data: null, error };
    }
  },

  // Get action statistics
  async getActionStatistics(timeRange = '24h') {
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

      // Get total actions
      const { count: totalActions, error: totalError } = await supabase
        .from('admin_actions_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (totalError) throw totalError;

      // Get actions by type
      const { data: byType, error: typeError } = await supabase
        .from('admin_actions_log')
        .select('action_type')
        .gte('created_at', startDate.toISOString());

      if (typeError) throw typeError;

      const actionTypeStats = byType.reduce((acc, log) => {
        acc[log.action_type] = (acc[log.action_type] || 0) + 1;
        return acc;
      }, {});

      // Get actions by resource type
      const { data: byResource, error: resourceError } = await supabase
        .from('admin_actions_log')
        .select('resource_type')
        .gte('created_at', startDate.toISOString());

      if (resourceError) throw resourceError;

      const resourceTypeStats = byResource.reduce((acc, log) => {
        acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
        return acc;
      }, {});

      // Get actions by admin
      const { data: byAdmin, error: adminError } = await supabase
        .from('admin_actions_log')
        .select('admin_id')
        .gte('created_at', startDate.toISOString());

      if (adminError) throw adminError;

      // Get admin names for top performers
      const adminIds = [...new Set(byAdmin.map(log => log.admin_id))];
      const { data: admins, error: adminsError } = await supabase
        .from('admins')
        .select('id, name')
        .in('id', adminIds);

      if (adminsError) throw adminsError;

      const adminMap = admins.reduce((acc, admin) => {
        acc[admin.id] = admin.name;
        return acc;
      }, {});

      const adminStats = byAdmin.reduce((acc, log) => {
        const adminName = adminMap[log.admin_id] || 'Unknown';
        acc[adminName] = (acc[adminName] || 0) + 1;
        return acc;
      }, {});

      // Get hourly distribution for the last 24 hours
      const hourlyStats = {};
      if (timeRange === '24h') {
        for (let i = 0; i < 24; i++) {
          const hourStart = new Date(startDate);
          hourStart.setHours(hourStart.getHours() + i);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(hourEnd.getHours() + 1);

          const { count, error: hourError } = await supabase
            .from('admin_actions_log')
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
          total_actions: totalActions,
          time_range: timeRange,
          by_action_type: actionTypeStats,
          by_resource_type: resourceTypeStats,
          by_admin: adminStats,
          hourly_distribution: hourlyStats,
          top_action: Object.entries(actionTypeStats).sort((a, b) => b[1] - a[1])[0] || ['none', 0],
          top_admin: Object.entries(adminStats).sort((a, b) => b[1] - a[1])[0] || ['none', 0],
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching action statistics:', error);
      return { data: null, error };
    }
  },

  // Clear old logs
  async clearOldLogs(days = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('admin_actions_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('count');

      if (error) throw error;

      return { 
        data: { 
          deleted_count: data.length,
          cutoff_date: cutoffDate.toISOString()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error clearing old logs:', error);
      return { data: null, error };
    }
  },

  // Search in audit logs
  async searchAuditLogs(query, filters = {}) {
    try {
      let searchQuery = supabase
        .from('admin_actions_log')
        .select(`
          *,
          admin:admins (name, email, role)
        `, { count: 'exact' })
        .or(`details::text.ilike.%${query}%,action_type.ilike.%${query}%,resource_type.ilike.%${query}%`);

      // Apply additional filters
      if (filters.admin_id) {
        searchQuery = searchQuery.eq('admin_id', filters.admin_id);
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
      console.error('Error searching audit logs:', error);
      return { data: null, count: 0, error };
    }
  },

  // Get activity for specific resource
  async getResourceActivity(resourceType, resourceId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('admin_actions_log')
        .select(`
          *,
          admin:admins (name, email, role)
        `)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching resource activity:', error);
      return { data: null, error };
    }
  },

  // Get admin-specific activity
  async getAdminActivity(adminId, timeRange = '7d') {
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
          startDate.setDate(startDate.getDate() - 7);
      }

      const { data, error } = await supabase
        .from('admin_actions_log')
        .select('*')
        .eq('admin_id', adminId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching admin activity:', error);
      return { data: null, error };
    }
  },

  // Convert data to CSV format
  convertToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = [
      'Timestamp',
      'Admin Name',
      'Admin Email',
      'Admin Role',
      'Action Type',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'User Agent',
      'Details'
    ];

    const rows = data.map(log => [
      formatDate(log.created_at, 'datetime'),
      log.admin?.name || 'Unknown',
      log.admin?.email || 'Unknown',
      log.admin?.role || 'Unknown',
      log.action_type,
      log.resource_type,
      log.resource_id,
      log.ip_address,
      log.user_agent,
      JSON.stringify(log.details)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  // Prepare data for PDF generation
  prepareForPDF(data) {
    return {
      title: 'Audit Logs Report',
      generated_at: new Date().toISOString(),
      total_records: data.length,
      logs: data.map(log => ({
        timestamp: formatDate(log.created_at, 'datetime'),
        admin: log.admin?.name || 'Unknown',
        action: log.action_type,
        resource: log.resource_type,
        resource_id: log.resource_id,
        details: log.details
      }))
    };
  },

  // Get recent activity summary
  async getRecentActivitySummary(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('admin_actions_log')
        .select(`
          *,
          admin:admins (name, email, role)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return { data: null, error };
    }
  },

  // Batch log multiple actions
  async batchLogActions(actions) {
    try {
      const formattedActions = actions.map(action => ({
        ...action,
        ip_address: action.ip_address || 'admin_panel',
        user_agent: action.user_agent || navigator?.userAgent || '',
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('admin_actions_log')
        .insert(formattedActions)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error batch logging actions:', error);
      return { data: null, error };
    }
  },

  // Get audit log by ID
  async getAuditLogById(logId) {
    try {
      const { data, error } = await supabase
        .from('admin_actions_log')
        .select(`
          *,
          admin:admins (name, email, role, department)
        `)
        .eq('id', logId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return { data: null, error };
    }
  }
};

export default auditService;