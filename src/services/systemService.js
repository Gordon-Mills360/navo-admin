import { supabase } from './supabase';
import { auditService } from './auditService';

export const systemService = {
  // Get all system settings
  async getSystemSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category')
        .order('sort_order');

      if (error) throw error;

      // Group by category
      const settingsByCategory = {};
      const categories = new Set();

      data.forEach(setting => {
        if (!settingsByCategory[setting.category]) {
          settingsByCategory[setting.category] = [];
        }
        settingsByCategory[setting.category].push(setting);
        categories.add(setting.category);
      });

      return {
        data: {
          settings: data,
          categories: Array.from(categories),
          grouped: settingsByCategory,
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return { data: null, error };
    }
  },

  // Update single setting
  async updateSystemSetting(settingId, value, notes, updatedBy) {
    try {
      // Get current value first
      const { data: currentSetting, error: getError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', settingId)
        .single();

      if (getError) throw getError;

      // Validate based on setting type
      const validationError = this.validateSettingValue(currentSetting, value);
      if (validationError) {
        throw new Error(validationError);
      }

      // Update setting
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          value: value,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
          version: currentSetting.version + 1
        })
        .eq('id', settingId)
        .select()
        .single();

      if (error) throw error;

      // Create history record
      await supabase
        .from('system_setting_history')
        .insert({
          setting_id: settingId,
          previous_value: currentSetting.value,
          new_value: value,
          changed_by: updatedBy,
          notes: notes,
          created_at: new Date().toISOString()
        });

      // Log the action
      await auditService.logAdminAction({
        admin_id: updatedBy,
        action_type: 'system.setting_update',
        resource_type: 'system_setting',
        resource_id: settingId,
        details: {
          key: currentSetting.key,
          previous_value: currentSetting.value,
          new_value: value,
          notes
        }
      });

      // Clear system cache for this setting
      await this.clearSettingCache(settingId);

      return { data, error: null };
    } catch (error) {
      console.error('Error updating system setting:', error);
      return { data: null, error };
    }
  },

  // Get system rules
  async getSystemRules() {
    try {
      const { data, error } = await supabase
        .from('system_rules')
        .select('*')
        .order('category')
        .order('sort_order');

      if (error) throw error;

      // Group by category
      const rulesByCategory = {};
      const categories = new Set();

      data.forEach(rule => {
        if (!rulesByCategory[rule.category]) {
          rulesByCategory[rule.category] = [];
        }
        rulesByCategory[rule.category].push(rule);
        categories.add(rule.category);
      });

      return {
        data: {
          rules: data,
          categories: Array.from(categories),
          grouped: rulesByCategory,
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching system rules:', error);
      return { data: null, error };
    }
  },

  // Validate system configuration
  async validateSystemConfig(config) {
    try {
      const errors = [];
      const warnings = [];

      // Validate required settings
      const requiredSettings = [
        'app_name',
        'currency',
        'default_commission_rate',
        'min_trip_amount',
        'max_trip_amount'
      ];

      for (const setting of requiredSettings) {
        if (!config[setting]) {
          errors.push(`Required setting missing: ${setting}`);
        }
      }

      // Validate numeric ranges
      if (config.default_commission_rate) {
        const rate = parseFloat(config.default_commission_rate);
        if (isNaN(rate) || rate < 0 || rate > 50) {
          errors.push('Commission rate must be between 0 and 50%');
        }
      }

      if (config.min_trip_amount && config.max_trip_amount) {
        const min = parseFloat(config.min_trip_amount);
        const max = parseFloat(config.max_trip_amount);
        
        if (min >= max) {
          errors.push('Minimum trip amount must be less than maximum trip amount');
        }
      }

      // Validate email settings
      if (config.smtp_enabled === 'true') {
        if (!config.smtp_host || !config.smtp_port || !config.smtp_username) {
          warnings.push('SMTP enabled but configuration may be incomplete');
        }
      }

      // Validate payment gateway
      if (config.payment_gateway === 'stripe' && !config.stripe_api_key) {
        warnings.push('Stripe selected but API key not configured');
      }

      // Validate business hours
      if (config.business_hours) {
        try {
          const hours = JSON.parse(config.business_hours);
          if (!Array.isArray(hours) || hours.length !== 7) {
            errors.push('Business hours must be a 7-day array');
          }
        } catch (e) {
          errors.push('Invalid business hours format');
        }
      }

      return {
        data: {
          isValid: errors.length === 0,
          errors,
          warnings,
          checked_at: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error validating system config:', error);
      return { data: null, error };
    }
  },

  // Backup system configuration
  async backupSystemConfig(backupName, createdBy) {
    try {
      // Get all settings
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*');

      if (settingsError) throw settingsError;

      // Get all rules
      const { data: rules, error: rulesError } = await supabase
        .from('system_rules')
        .select('*');

      if (rulesError) throw rulesError;

      const backupData = {
        settings,
        rules,
        metadata: {
          name: backupName,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          version: '1.0',
          system_version: await this.getSystemVersion()
        }
      };

      // Create backup record
      const { data, error } = await supabase
        .from('system_backups')
        .insert({
          name: backupName,
          description: `Manual backup created by ${createdBy}`,
          data: backupData,
          created_by: createdBy,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await auditService.logAdminAction({
        admin_id: createdBy,
        action_type: 'system.backup_create',
        resource_type: 'system_backup',
        resource_id: data.id,
        details: {
          backup_name: backupName,
          settings_count: settings.length,
          rules_count: rules.length
        }
      });

      return { 
        data: {
          ...data,
          summary: {
            settings: settings.length,
            rules: rules.length,
            size: JSON.stringify(backupData).length
          }
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error creating system backup:', error);
      return { data: null, error };
    }
  },

  // Restore from backup
  async restoreSystemConfig(backupId, restoredBy) {
    try {
      // Get backup data
      const { data: backup, error: backupError } = await supabase
        .from('system_backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (backupError) throw backupError;

      // Create current backup before restore (safety measure)
      await this.backupSystemConfig(`Pre-restore backup ${new Date().toISOString()}`, restoredBy);

      const backupData = backup.data;
      const errors = [];

      // Restore settings
      if (backupData.settings && Array.isArray(backupData.settings)) {
        for (const setting of backupData.settings) {
          try {
            await supabase
              .from('system_settings')
              .update({
                value: setting.value,
                updated_at: new Date().toISOString(),
                updated_by: restoredBy,
                version: setting.version + 1
              })
              .eq('id', setting.id);
          } catch (error) {
            errors.push(`Setting ${setting.key}: ${error.message}`);
          }
        }
      }

      // Restore rules
      if (backupData.rules && Array.isArray(backupData.rules)) {
        for (const rule of backupData.rules) {
          try {
            await supabase
              .from('system_rules')
              .update({
                value: rule.value,
                updated_at: new Date().toISOString(),
                updated_by: restoredBy,
                version: rule.version + 1
              })
              .eq('id', rule.id);
          } catch (error) {
            errors.push(`Rule ${rule.key}: ${error.message}`);
          }
        }
      }

      // Update backup record
      await supabase
        .from('system_backups')
        .update({
          restored_at: new Date().toISOString(),
          restored_by: restoredBy,
          status: 'restored'
        })
        .eq('id', backupId);

      // Clear all system cache
      await this.clearSystemCache();

      // Log the action
      await auditService.logAdminAction({
        admin_id: restoredBy,
        action_type: 'system.restore',
        resource_type: 'system_backup',
        resource_id: backupId,
        details: {
          backup_name: backup.name,
          errors: errors.length > 0 ? errors : undefined,
          restored_at: new Date().toISOString()
        }
      });

      return { 
        data: {
          success: errors.length === 0,
          backup_name: backup.name,
          restored_by: restoredBy,
          errors: errors.length > 0 ? errors : undefined,
          restored_at: new Date().toISOString()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error restoring system config:', error);
      return { data: null, error };
    }
  },

  // Get system health status
  async getSystemHealth() {
    try {
      const checks = [];
      const startTime = Date.now();

      // Check database connection
      const dbCheckStart = Date.now();
      const { error: dbError } = await supabase
        .from('system_settings')
        .select('count', { count: 'exact', head: true });
      const dbCheckTime = Date.now() - dbCheckStart;

      checks.push({
        name: 'Database Connection',
        status: !dbError ? 'healthy' : 'unhealthy',
        response_time: dbCheckTime,
        error: dbError ? dbError.message : null
      });

      // Check storage connection
      const storageCheckStart = Date.now();
      const { error: storageError } = await supabase.storage.listBuckets();
      const storageCheckTime = Date.now() - storageCheckStart;

      checks.push({
        name: 'Storage Connection',
        status: !storageError ? 'healthy' : 'unhealthy',
        response_time: storageCheckTime,
        error: storageError ? storageError.message : null
      });

      // Check real-time connection
      const realtimeCheckStart = Date.now();
      const realtimeStatus = supabase.getChannels().length > 0 ? 'connected' : 'disconnected';
      const realtimeCheckTime = Date.now() - realtimeCheckStart;

      checks.push({
        name: 'Real-time Connection',
        status: realtimeStatus,
        response_time: realtimeCheckTime,
        error: realtimeStatus === 'disconnected' ? 'No active channels' : null
      });

      // Check system tables
      const tablesCheckStart = Date.now();
      const requiredTables = ['trips', 'drivers', 'passengers', 'payments', 'system_settings'];
      const tableStatuses = [];

      for (const table of requiredTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true });
          
          tableStatuses.push({
            table,
            status: !error ? 'exists' : 'missing',
            error: error ? error.message : null
          });
        } catch (error) {
          tableStatuses.push({
            table,
            status: 'error',
            error: error.message
          });
        }
      }
      const tablesCheckTime = Date.now() - tablesCheckStart;

      checks.push({
        name: 'System Tables',
        status: tableStatuses.every(t => t.status === 'exists') ? 'healthy' : 'unhealthy',
        response_time: tablesCheckTime,
        details: tableStatuses
      });

      // Check system load
      const loadCheckStart = Date.now();
      const { data: recentActions, error: actionsError } = await supabase
        .from('admin_actions_log')
        .select('count', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
      
      const { data: activeTrips, error: tripsError } = await supabase
        .from('trips')
        .select('count', { count: 'exact', head: true })
        .in('status', ['pending', 'accepted', 'in_progress']);
      
      const loadCheckTime = Date.now() - loadCheckStart;

      checks.push({
        name: 'System Load',
        status: 'healthy',
        response_time: loadCheckTime,
        details: {
          recent_actions: recentActions || 0,
          active_trips: activeTrips || 0,
          load_level: this.calculateLoadLevel(recentActions || 0, activeTrips || 0)
        }
      });

      // Overall status
      const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
      const overallStatus = unhealthyChecks.length === 0 ? 'healthy' : 
                          unhealthyChecks.length <= 2 ? 'degraded' : 'unhealthy';

      const totalTime = Date.now() - startTime;

      return {
        data: {
          status: overallStatus,
          checks,
          summary: {
            total_checks: checks.length,
            healthy_checks: checks.filter(c => c.status === 'healthy').length,
            unhealthy_checks: unhealthyChecks.length,
            total_response_time: totalTime
          },
          checked_at: new Date().toISOString(),
          system_version: await this.getSystemVersion()
        },
        error: null
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return { data: null, error };
    }
  },

  // Clear system cache
  async clearSystemCache(cacheType = 'all', clearedBy) {
    try {
      const operations = [];

      // Clear setting cache
      if (cacheType === 'all' || cacheType === 'settings') {
        operations.push('settings_cache_cleared');
        // In a real app, you'd clear your cache store here
        // localStorage.removeItem('system_settings_cache');
        // sessionStorage.removeItem('system_settings');
      }

      // Clear rules cache
      if (cacheType === 'all' || cacheType === 'rules') {
        operations.push('rules_cache_cleared');
        // localStorage.removeItem('system_rules_cache');
      }

      // Clear configuration cache
      if (cacheType === 'all' || cacheType === 'config') {
        operations.push('config_cache_cleared');
        // localStorage.removeItem('system_config_cache');
      }

      // Log the action
      if (clearedBy) {
        await auditService.logAdminAction({
          admin_id: clearedBy,
          action_type: 'system.cache_clear',
          resource_type: 'system',
          resource_id: 'cache',
          details: {
            cache_type: cacheType,
            operations
          }
        });
      }

      return { 
        data: {
          success: true,
          cache_type: cacheType,
          operations,
          cleared_at: new Date().toISOString()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error clearing system cache:', error);
      return { data: null, error };
    }
  },

  // Get system logs
  async getSystemLogs(filters = {}) {
    try {
      let query = supabase
        .from('system_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.level) {
        query = query.eq('level', filters.level);
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.search) {
        query = query.or(`message.ilike.%${filters.search}%,source.ilike.%${filters.search}%`);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      // Pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Group by date for easier consumption
      const logsByDate = {};
      data.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (!logsByDate[date]) {
          logsByDate[date] = [];
        }
        logsByDate[date].push(log);
      });

      return { 
        data: {
          logs: data,
          grouped: logsByDate,
          count,
          last_updated: new Date().toISOString()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching system logs:', error);
      return { data: null, count: 0, error };
    }
  },

  // Update business rule
  async updateBusinessRule(ruleId, value, notes, updatedBy) {
    try {
      // Get current value first
      const { data: currentRule, error: getError } = await supabase
        .from('system_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (getError) throw getError;

      // Validate rule value
      const validationError = this.validateRuleValue(currentRule, value);
      if (validationError) {
        throw new Error(validationError);
      }

      // Update rule
      const { data, error } = await supabase
        .from('system_rules')
        .update({
          value: value,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
          version: currentRule.version + 1
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;

      // Create history record
      await supabase
        .from('system_rule_history')
        .insert({
          rule_id: ruleId,
          previous_value: currentRule.value,
          new_value: value,
          changed_by: updatedBy,
          notes: notes,
          created_at: new Date().toISOString()
        });

      // Log the action
      await auditService.logAdminAction({
        admin_id: updatedBy,
        action_type: 'system.rule_update',
        resource_type: 'system_rule',
        resource_id: ruleId,
        details: {
          key: currentRule.key,
          previous_value: currentRule.value,
          new_value: value,
          notes
        }
      });

      // Clear rule cache
      await this.clearRuleCache(ruleId);

      return { data, error: null };
    } catch (error) {
      console.error('Error updating business rule:', error);
      return { data: null, error };
    }
  },

  // Get system version
  async getSystemVersion() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'system_version')
        .single();

      if (error) {
        // Default version if not set
        return '1.0.0';
      }

      return data.value || '1.0.0';
    } catch (error) {
      console.error('Error getting system version:', error);
      return '1.0.0';
    }
  },

  // Get available backups
  async getSystemBackups(filters = {}) {
    try {
      let query = supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching system backups:', error);
      return { data: null, error };
    }
  },

  // Delete system backup
  async deleteSystemBackup(backupId, deletedBy) {
    try {
      const { data, error } = await supabase
        .from('system_backups')
        .delete()
        .eq('id', backupId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logAdminAction({
        admin_id: deletedBy,
        action_type: 'system.backup_delete',
        resource_type: 'system_backup',
        resource_id: backupId,
        details: {
          backup_name: data.name,
          deleted_at: new Date().toISOString()
        }
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting system backup:', error);
      return { data: null, error };
    }
  },

  // Export system configuration
  async exportSystemConfig(format = 'json', filters = {}) {
    try {
      // Get settings and rules
      const [settingsResult, rulesResult] = await Promise.all([
        this.getSystemSettings(),
        this.getSystemRules()
      ]);

      if (settingsResult.error) throw settingsResult.error;
      if (rulesResult.error) throw rulesResult.error;

      const exportData = {
        metadata: {
          exported_at: new Date().toISOString(),
          system_version: await this.getSystemVersion(),
          format: format
        },
        settings: settingsResult.data?.settings || [],
        rules: rulesResult.data?.rules || []
      };

      if (format === 'json') {
        return {
          data: JSON.stringify(exportData, null, 2),
          filename: `system_config_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      } else if (format === 'csv') {
        // Convert to CSV format
        const csvContent = this.convertSystemConfigToCSV(exportData);
        return {
          data: csvContent,
          filename: `system_config_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting system config:', error);
      return { data: null, error };
    }
  },

  // Import system configuration
  async importSystemConfig(configData, importedBy, merge = false) {
    try {
      let settings, rules;
      
      if (typeof configData === 'string') {
        const parsed = JSON.parse(configData);
        settings = parsed.settings;
        rules = parsed.rules;
      } else {
        settings = configData.settings;
        rules = configData.rules;
      }

      if (!Array.isArray(settings) || !Array.isArray(rules)) {
        throw new Error('Invalid configuration format');
      }

      const results = {
        settings: { updated: 0, errors: [] },
        rules: { updated: 0, errors: [] }
      };

      // Update settings
      for (const setting of settings) {
        try {
          if (merge) {
            // Merge: Update only if key exists
            const { data: existing } = await supabase
              .from('system_settings')
              .select('id')
              .eq('key', setting.key)
              .single();

            if (existing) {
              await this.updateSystemSetting(existing.id, setting.value, 'Imported from config', importedBy);
              results.settings.updated++;
            }
          } else {
            // Replace: Update or insert
            const { data: existing } = await supabase
              .from('system_settings')
              .select('id')
              .eq('key', setting.key)
              .single();

            if (existing) {
              await this.updateSystemSetting(existing.id, setting.value, 'Imported from config', importedBy);
            } else {
              await supabase
                .from('system_settings')
                .insert({
                  ...setting,
                  created_by: importedBy,
                  created_at: new Date().toISOString()
                });
            }
            results.settings.updated++;
          }
        } catch (error) {
          results.settings.errors.push(`${setting.key}: ${error.message}`);
        }
      }

      // Update rules
      for (const rule of rules) {
        try {
          if (merge) {
            const { data: existing } = await supabase
              .from('system_rules')
              .select('id')
              .eq('key', rule.key)
              .single();

            if (existing) {
              await this.updateBusinessRule(existing.id, rule.value, 'Imported from config', importedBy);
              results.rules.updated++;
            }
          } else {
            const { data: existing } = await supabase
              .from('system_rules')
              .select('id')
              .eq('key', rule.key)
              .single();

            if (existing) {
              await this.updateBusinessRule(existing.id, rule.value, 'Imported from config', importedBy);
            } else {
              await supabase
                .from('system_rules')
                .insert({
                  ...rule,
                  created_by: importedBy,
                  created_at: new Date().toISOString()
                });
            }
            results.rules.updated++;
          }
        } catch (error) {
          results.rules.errors.push(`${rule.key}: ${error.message}`);
        }
      }

      // Clear cache
      await this.clearSystemCache('all', importedBy);

      await auditService.logAdminAction({
        admin_id: importedBy,
        action_type: 'system.config_import',
        resource_type: 'system',
        resource_id: 'config',
        details: {
          merge_mode: merge,
          results,
          imported_at: new Date().toISOString()
        }
      });

      return { 
        data: {
          success: true,
          results,
          imported_by: importedBy,
          imported_at: new Date().toISOString()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error importing system config:', error);
      return { data: null, error };
    }
  },

  // Helper methods
  validateSettingValue(setting, value) {
    if (setting.is_required && !value) {
      return 'This setting is required';
    }

    switch (setting.data_type) {
      case 'number':
        if (isNaN(Number(value))) {
          return 'Must be a valid number';
        }
        if (setting.min_value && Number(value) < setting.min_value) {
          return `Minimum value is ${setting.min_value}`;
        }
        if (setting.max_value && Number(value) > setting.max_value) {
          return `Maximum value is ${setting.max_value}`;
        }
        break;

      case 'boolean':
        if (value !== 'true' && value !== 'false' && value !== true && value !== false) {
          return 'Must be true or false';
        }
        break;

      case 'json':
        try {
          JSON.parse(value);
        } catch (e) {
          return 'Must be valid JSON';
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Must be a valid email address';
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch (e) {
          return 'Must be a valid URL';
        }
        break;
    }

    return null;
  },

  validateRuleValue(rule, value) {
    // Similar validation as settings
    return this.validateSettingValue(rule, value);
  },

  clearSettingCache(settingId) {
    // In a real app, clear from cache store
    // localStorage.removeItem(`setting_${settingId}`);
    return Promise.resolve();
  },

  clearRuleCache(ruleId) {
    // In a real app, clear from cache store
    // localStorage.removeItem(`rule_${ruleId}`);
    return Promise.resolve();
  },

  calculateLoadLevel(actions, activeTrips) {
    if (actions > 100 || activeTrips > 50) return 'high';
    if (actions > 50 || activeTrips > 20) return 'medium';
    return 'low';
  },

  convertSystemConfigToCSV(config) {
    const settingsHeaders = ['Category', 'Key', 'Value', 'DataType', 'Description', 'Is Required'];
    const rulesHeaders = ['Category', 'Key', 'Value', 'DataType', 'Description', 'Is Required'];

    const settingsRows = config.settings.map(s => [
      s.category,
      s.key,
      s.value,
      s.data_type,
      s.description,
      s.is_required ? 'Yes' : 'No'
    ]);

    const rulesRows = config.rules.map(r => [
      r.category,
      r.key,
      r.value,
      r.data_type,
      r.description,
      r.is_required ? 'Yes' : 'No'
    ]);

    const csvContent = [
      'SYSTEM SETTINGS',
      settingsHeaders.join(','),
      ...settingsRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      'BUSINESS RULES',
      rulesHeaders.join(','),
      ...rulesRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
};

export default systemService;