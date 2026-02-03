import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@chakra-ui/react';
import systemService from '../services/systemService';

const useSystemSettings = (category = null) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const { user } = useAuth();
  const toast = useToast();

  // Fetch all settings
  const fetchAllSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await systemService.getSystemSettings();
      
      if (fetchError) throw fetchError;
      
      // Transform to key-value object for easy access
      const settingsMap = {};
      data.settings.forEach(setting => {
        settingsMap[setting.key] = setting;
      });
      
      setSettings(settingsMap);
      setCategories(data.categories || []);
      
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching settings',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get single setting
  const getSetting = useCallback((key) => {
    return settings[key] || null;
  }, [settings]);

  // Update single setting
  const updateSetting = useCallback(async (key, value, notes = '') => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const setting = getSetting(key);
      if (!setting) {
        throw new Error(`Setting ${key} not found`);
      }
      
      setSaving(true);
      
      const { data, error: updateError } = await systemService.updateSystemSetting(
        setting.id,
        value,
        notes,
        user.id
      );
      
      if (updateError) throw updateError;
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          value: value,
          version: data.version,
          updated_at: data.updated_at,
          updated_by: user.id
        }
      }));
      
      toast({
        title: 'Setting updated',
        description: `${setting.name} has been updated`,
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setSaving(false);
    }
  }, [user, getSetting, toast]);

  // Get settings by category
  const getSettingsByCategory = useCallback((categoryName) => {
    return Object.values(settings).filter(setting => setting.category === categoryName);
  }, [settings]);

  // Reset setting to default
  const resetSetting = useCallback(async (key) => {
    try {
      const setting = getSetting(key);
      if (!setting) {
        throw new Error(`Setting ${key} not found`);
      }
      
      const defaultValue = setting.default_value;
      if (defaultValue === undefined || defaultValue === null) {
        throw new Error('No default value defined for this setting');
      }
      
      return await updateSetting(key, defaultValue, 'Reset to default value');
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    }
  }, [getSetting, updateSetting, toast]);

  // Validate setting value
  const validateSetting = useCallback((key, value) => {
    const setting = getSetting(key);
    if (!setting) {
      return { isValid: false, error: 'Setting not found' };
    }
    
    // Basic validation based on data type
    const { data_type, min_value, max_value, is_required } = setting;
    
    if (is_required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: 'This setting is required' };
    }
    
    switch (data_type) {
      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return { isValid: false, error: 'Must be a valid number' };
        }
        if (min_value !== null && numValue < min_value) {
          return { isValid: false, error: `Minimum value is ${min_value}` };
        }
        if (max_value !== null && numValue > max_value) {
          return { isValid: false, error: `Maximum value is ${max_value}` };
        }
        break;
        
      case 'boolean':
        if (value !== 'true' && value !== 'false' && value !== true && value !== false) {
          return { isValid: false, error: 'Must be true or false' };
        }
        break;
        
      case 'json':
        try {
          JSON.parse(value);
        } catch (e) {
          return { isValid: false, error: 'Must be valid JSON' };
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { isValid: false, error: 'Must be a valid email address' };
        }
        break;
        
      case 'url':
        try {
          new URL(value);
        } catch (e) {
          return { isValid: false, error: 'Must be a valid URL' };
        }
        break;
    }
    
    return { isValid: true, error: null };
  }, [getSetting]);

  // Batch update settings
  const saveSettingsBatch = useCallback(async (updates, notes = '') => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new Error('No updates provided');
      }
      
      setSaving(true);
      
      // Validate all updates first
      const validationResults = updates.map(({ key, value }) => ({
        key,
        ...validateSetting(key, value)
      }));
      
      const invalidUpdates = validationResults.filter(r => !r.isValid);
      if (invalidUpdates.length > 0) {
        const errors = invalidUpdates.map(u => `${u.key}: ${u.error}`).join(', ');
        throw new Error(`Validation failed: ${errors}`);
      }
      
      // Process updates
      const results = [];
      const errors = [];
      
      for (const update of updates) {
        try {
          const result = await updateSetting(update.key, update.value, notes);
          if (result.error) {
            errors.push(`${update.key}: ${result.error.message}`);
          } else {
            results.push({ key: update.key, success: true });
          }
        } catch (err) {
          errors.push(`${update.key}: ${err.message}`);
        }
      }
      
      if (errors.length > 0) {
        toast({
          title: 'Partial success',
          description: `${results.length} settings updated, ${errors.length} failed`,
          status: 'warning',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Settings updated',
          description: 'All settings have been updated successfully',
          status: 'success',
          duration: 3000,
        });
      }
      
      return {
        success: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (err) {
      toast({
        title: 'Batch update failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { success: 0, failed: updates.length, errors: [err.message] };
    } finally {
      setSaving(false);
    }
  }, [user, validateSetting, updateSetting, toast]);

  // Get setting history
  const getSettingHistory = useCallback(async (key) => {
    try {
      const setting = getSetting(key);
      if (!setting) {
        throw new Error(`Setting ${key} not found`);
      }
      
      // Note: This would require a separate API endpoint for setting history
      // For now, return mock data or implement if available
      return { data: [], error: null };
    } catch (err) {
      console.error('Error fetching setting history:', err);
      return { data: null, error: err };
    }
  }, [getSetting]);

  // Get system health
  const getSystemHealth = useCallback(async () => {
    try {
      const { data, error: healthError } = await systemService.getSystemHealth();
      
      if (healthError) throw healthError;
      
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching system health:', err);
      return { data: null, error: err };
    }
  }, []);

  // Clear system cache
  const clearSystemCache = useCallback(async (cacheType = 'all') => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error: cacheError } = await systemService.clearSystemCache(cacheType, user.id);
      
      if (cacheError) throw cacheError;
      
      toast({
        title: 'Cache cleared',
        description: `System cache (${cacheType}) has been cleared`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh settings after cache clear
      await fetchAllSettings();
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Cache clear failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    }
  }, [user, fetchAllSettings, toast]);

  // Initialize
  useEffect(() => {
    fetchAllSettings();
  }, [fetchAllSettings]);

  // Filter settings by category if specified
  const filteredSettings = category 
    ? getSettingsByCategory(category)
    : Object.values(settings);

  return {
    // State
    settings: filteredSettings,
    allSettings: settings,
    loading,
    error,
    saving,
    categories,
    
    // Actions
    fetchAllSettings,
    getSetting,
    updateSetting,
    getSettingsByCategory,
    resetSetting,
    validateSetting,
    saveSettingsBatch,
    getSettingHistory,
    getSystemHealth,
    clearSystemCache,
    
    // Helper functions
    refresh: () => fetchAllSettings(),
    reset: () => {
      setSettings({});
      setError(null);
      setCategories([]);
      fetchAllSettings();
    },
    
    // Computed values
    getSettingValue: (key) => getSetting(key)?.value,
    hasSettings: filteredSettings.length > 0
  };
};

export default useSystemSettings;