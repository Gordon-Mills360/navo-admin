import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { hasPermission, canViewModule, getAllowedActions } from '../utils/permissions';
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from '../utils/constants';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { admin } = useAuth();
  const [permissionCache, setPermissionCache] = useState({});

  const checkPermission = useCallback((resource, action) => {
    if (!admin) return false;
    
    const cacheKey = `${admin.role}_${resource}_${action}`;
    
    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }
    
    const hasPerm = hasPermission(admin.role, resource, action);
    setPermissionCache(prev => ({ ...prev, [cacheKey]: hasPerm }));
    
    return hasPerm;
  }, [admin, permissionCache]);

  const checkModuleAccess = useCallback((module) => {
    if (!admin) return false;
    return canViewModule(admin.role, module);
  }, [admin]);

  const getActions = useCallback((resource) => {
    if (!admin) return [];
    return getAllowedActions(admin.role, resource);
  }, [admin]);

  const can = {
    // User Management
    viewUsers: checkPermission(PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.VIEW),
    suspendUser: checkPermission(PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.SUSPEND),
    reinstateUser: checkPermission(PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.REINSTATE),
    
    // Driver Management
    viewDrivers: checkPermission(PERMISSION_RESOURCES.DRIVERS, PERMISSION_ACTIONS.VIEW),
    approveDriver: checkPermission(PERMISSION_RESOURCES.DRIVERS, PERMISSION_ACTIONS.APPROVE),
    rejectDriver: checkPermission(PERMISSION_RESOURCES.DRIVERS, PERMISSION_ACTIONS.REJECT),
    suspendDriver: checkPermission(PERMISSION_RESOURCES.DRIVERS, PERMISSION_ACTIONS.SUSPEND),
    
    // Trip Management
    viewTrips: checkPermission(PERMISSION_RESOURCES.TRIPS, PERMISSION_ACTIONS.VIEW),
    overrideTrip: checkPermission(PERMISSION_RESOURCES.TRIPS, PERMISSION_ACTIONS.OVERRIDE),
    
    // Finance Management
    viewPayments: checkPermission(PERMISSION_RESOURCES.PAYMENTS, PERMISSION_ACTIONS.VIEW),
    processRefund: checkPermission(PERMISSION_RESOURCES.PAYMENTS, PERMISSION_ACTIONS.REFUND),
    approvePayout: checkPermission(PERMISSION_RESOURCES.PAYOUTS, PERMISSION_ACTIONS.APPROVE),
    
    // System Management
    viewSettings: checkPermission(PERMISSION_RESOURCES.SYSTEM_SETTINGS, PERMISSION_ACTIONS.VIEW),
    updateSettings: checkPermission(PERMISSION_RESOURCES.SYSTEM_SETTINGS, PERMISSION_ACTIONS.UPDATE),
    
    // Admin Management (Super Admin only)
    viewAdmins: checkPermission(PERMISSION_RESOURCES.ADMIN_USERS, PERMISSION_ACTIONS.VIEW),
    createAdmin: checkPermission(PERMISSION_RESOURCES.ADMIN_USERS, PERMISSION_ACTIONS.CREATE),
    suspendAdmin: checkPermission(PERMISSION_RESOURCES.ADMIN_USERS, PERMISSION_ACTIONS.SUSPEND),
  };

  const modules = {
    operations: checkModuleAccess('operations'),
    accounts: checkModuleAccess('accounts'),
    finance: checkModuleAccess('finance'),
    system: checkModuleAccess('system'),
    analytics: checkModuleAccess('analytics'),
    communication: checkModuleAccess('communication'),
    adminManagement: checkModuleAccess('admin-management'),
  };

  const value = {
    can,
    modules,
    checkPermission,
    checkModuleAccess,
    getActions,
    adminRole: admin?.role,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};