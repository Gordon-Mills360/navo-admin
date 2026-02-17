import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';

// Layout
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { PermissionGuard } from "./PermissionRoutes";

// Auth pages
const Login = lazy(() => import('../pages/auth/Login'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));

// Dashboard pages
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const SuperAdminDashboard = lazy(() => import('../pages/dashboard/SuperAdminDashboard'));
const OperationsDashboard = lazy(() => import('../pages/dashboard/OperationsDashboard'));
const FinanceDashboard = lazy(() => import('../pages/dashboard/FinanceDashboard'));
const AnalyticsDashboard = lazy(() => import('../pages/dashboard/AnalyticsDashboard'));
const ComplianceDashboard = lazy(() => import('../pages/dashboard/ComplianceDashboard'));
const SupportDashboard = lazy(() => import('../pages/dashboard/SupportDashboard'));

// Operations pages
const LiveTrips = lazy(() => import('../pages/domains/operations/LiveTrips'));
const TripHistory = lazy(() => import('../pages/domains/operations/TripHistory'));
const Emergencies = lazy(() => import('../pages/domains/operations/Emergencies'));
const MapView = lazy(() => import('../pages/domains/operations/MapView'));
const EmergencyView = lazy(() => import('../pages/domains/operations/EmergencyView'));
const LiveDrivers = lazy(() => import('../pages/domains/operations/LiveDrivers'));

// Accounts pages
const Drivers = lazy(() => import('../pages/domains/accounts/Drivers'));
const Passengers = lazy(() => import('../pages/domains/accounts/Passengers'));
const DriverDetail = lazy(() => import('../pages/domains/accounts/DriverDetail'));
const PassengerDetail = lazy(() => import('../pages/domains/accounts/PassengerDetail'));
const UserManagement = lazy(() => import('../pages/domains/accounts/UserManagement'));
const Verifications = lazy(() => import('../pages/domains/accounts/Verifications'));

// Finance pages
const Transactions = lazy(() => import('../pages/domains/finance/Transactions'));
const Payouts = lazy(() => import('../pages/domains/finance/Payouts'));
const Wallets = lazy(() => import('../pages/domains/finance/Wallets'));
const Disputes = lazy(() => import('../pages/domains/finance/Disputes'));

// System pages
const SystemSettings = lazy(() => import('../pages/domains/system/SystemSettings'));
const SystemRules = lazy(() => import('../pages/domains/system/SystemRules'));

// Analytics pages
const AnalyticsOverview = lazy(() => import('../pages/domains/analytics/AnalyticsOverview'));
const Reports = lazy(() => import('../pages/domains/analytics/Reports'));

// Communication pages
const Notifications = lazy(() => import('../pages/domains/communication/Notifications'));
const Announcements = lazy(() => import('../pages/domains/communication/Announcements'));

// Admin pages
const AdminManagement = lazy(() => import('../pages/domains/admin/AdminManagement'));
const AuditLogs = lazy(() => import('../pages/domains/admin/AuditLogs'));
const RolesPermissions = lazy(() => import('../pages/domains/admin/RolesPermissions'));

// Error pages
const NotFound = lazy(() => import('../pages/errors/NotFound'));
const Unauthorized = lazy(() => import('../pages/errors/Unauthorized'));
const ServerError = lazy(() => import('../pages/errors/ServerError'));

// Loading fallback component
const RouteLoading = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <LoadingSpinner size="lg" text="Loading..." fullPage />
  </div>
);

// Public route wrapper
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Private route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based route wrapper
const RoleRoute = ({ children, roles = [] }) => {
  const { user } = useAuth();
  const { hasRole } = usePermissions();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Permission-based route wrapper
const PermissionRoute = ({ children, resource, action }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (resource && action && !hasPermission(resource, action)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Helper function to get default dashboard based on admin role (from first file)
const getDefaultDashboard = (admin) => {
  if (!admin) return '/login';
  
  switch (admin.role) {
    case 'SUPER_ADMIN':
      return '/dashboard/super';
    case 'OPERATIONS_ADMIN':
      return '/dashboard/operations';
    case 'FINANCE_ADMIN':
      return '/dashboard/finance';
    case 'COMPLIANCE_ADMIN':
      return '/dashboard/compliance';
    case 'SUPPORT_ADMIN':
      return '/dashboard/support';
    default:
      return '/dashboard';
  }
};

// Main AppRoutes component
const AppRoutes = () => {
  const { admin } = useAuth();

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Auth routes (public) */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />

        {/* Redirect root to appropriate dashboard */}
        <Route path="/" element={<Navigate to={admin ? getDefaultDashboard(admin) : '/login'} />} />
        
        {/* Protected routes with layout */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <Outlet />
            </Layout>
          </PrivateRoute>
        }>
          
          {/* Dashboard routes */}
          <Route index element={<Navigate to={getDefaultDashboard(admin)} replace />} />
          
          {/* New dashboard routes from first file */}
          <Route path="dashboard">
            <Route index element={<Navigate to={getDefaultDashboard(admin)} />} />
            <Route path="super" element={
              <RoleRoute roles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </RoleRoute>
            } />
            <Route path="operations" element={
              <RoleRoute roles={['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'ADMIN', 'OPERATIONS']}>
                <OperationsDashboard />
              </RoleRoute>
            } />
            <Route path="finance" element={
              <RoleRoute roles={['SUPER_ADMIN', 'FINANCE_ADMIN', 'ADMIN', 'FINANCE']}>
                <FinanceDashboard />
              </RoleRoute>
            } />
            <Route path="compliance" element={
              <RoleRoute roles={['SUPER_ADMIN', 'COMPLIANCE_ADMIN']}>
                <ComplianceDashboard />
              </RoleRoute>
            } />
            <Route path="support" element={
              <RoleRoute roles={['SUPER_ADMIN', 'SUPPORT_ADMIN', 'ADMIN', 'SUPPORT']}>
                <SupportDashboard />
              </RoleRoute>
            } />
          </Route>
          
          {/* Legacy dashboard routes (keep for backward compatibility) */}
          <Route path="dashboard" element={
            <RoleRoute roles={['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'FINANCE', 'ANALYTICS', 'SUPPORT', 'VIEWER']}>
              <Dashboard />
            </RoleRoute>
          } />
          
          <Route path="super-admin-dashboard" element={
            <RoleRoute roles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </RoleRoute>
          } />
          
          <Route path="operations-dashboard" element={
            <RoleRoute roles={['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']}>
              <OperationsDashboard />
            </RoleRoute>
          } />
          
          <Route path="finance-dashboard" element={
            <RoleRoute roles={['SUPER_ADMIN', 'ADMIN', 'FINANCE']}>
              <FinanceDashboard />
            </RoleRoute>
          } />
          
          <Route path="analytics-dashboard" element={
            <RoleRoute roles={['SUPER_ADMIN', 'ADMIN', 'ANALYTICS']}>
              <AnalyticsDashboard />
            </RoleRoute>
          } />

          {/* Operations routes - using PermissionGuard from first file */}
          <Route path="operations" element={
            <PermissionGuard resource="trips" action="view">
              <Outlet />
            </PermissionGuard>
          }>
            <Route path="live-trips" element={<LiveTrips />} />
            <Route path="trip-history" element={<TripHistory />} />
            <Route path="emergencies" element={<Emergencies />} />
            <Route path="map-view" element={<MapView />} />
            <Route path="emergencies/:id" element={<EmergencyView />} />
            <Route path="live-drivers" element={<LiveDrivers />} />
          </Route>

          {/* Accounts routes - using PermissionGuard from first file */}
          <Route path="accounts" element={
            <PermissionGuard resource="users" action="view">
              <Outlet />
            </PermissionGuard>
          }>
            <Route path="drivers" element={<Drivers />} />
            <Route path="passengers" element={<Passengers />} />
            <Route path="drivers/:id" element={<DriverDetail />} />
            <Route path="passengers/:id" element={<PassengerDetail />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="verifications" element={<Verifications />} />
          </Route>

          {/* Finance routes - using PermissionGuard from first file */}
          <Route path="finance" element={
            <PermissionGuard resource="payments" action="view">
              <Outlet />
            </PermissionGuard>
          }>
            <Route path="transactions" element={<Transactions />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="wallets" element={<Wallets />} />
            <Route path="disputes" element={<Disputes />} />
          </Route>

          {/* System routes - using PermissionGuard from first file */}
          <Route path="system" element={
            <PermissionGuard resource="system_settings" action="view">
              <Outlet />
            </PermissionGuard>
          }>
            <Route path="settings" element={<SystemSettings />} />
            <Route path="rules" element={<SystemRules />} />
          </Route>

          {/* Analytics routes - using PermissionGuard from first file */}
          <Route path="analytics" element={
            <PermissionGuard resource="analytics" action="view">
              <Outlet />
            </PermissionGuard>
          }>
            <Route path="overview" element={<AnalyticsOverview />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Communication routes - using PermissionGuard from first file */}
          <Route path="communication" element={
            <PermissionGuard resource="notifications" action="view">
              <Outlet />
            </PermissionGuard>
          }>
            <Route path="notifications" element={<Notifications />} />
            <Route path="announcements" element={<Announcements />} />
          </Route>

          {/* Admin Management routes (Super Admin only) from first file */}
          <Route path="admin-management" element={
            <RoleRoute roles={['SUPER_ADMIN']}>
              <Outlet />
            </RoleRoute>
          }>
            <Route path="admins" element={<AdminManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="roles-permissions" element={<RolesPermissions />} />
          </Route>

          {/* Legacy Admin routes */}
          <Route path="admin">
            <Route path="management" element={
              <RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminManagement />
              </RoleRoute>
            } />
            
            <Route path="audit-logs" element={
              <RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                <AuditLogs />
              </RoleRoute>
            } />
            
            <Route path="roles-permissions" element={
              <RoleRoute roles={['SUPER_ADMIN']}>
                <RolesPermissions />
              </RoleRoute>
            } />
          </Route>

          {/* Error routes */}
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="server-error" element={<ServerError />} />
          
          {/* 404 Route - redirect to appropriate dashboard */}
          <Route path="*" element={<Navigate to={getDefaultDashboard(admin)} />} />
        </Route>

        {/* Direct error routes (outside layout) */}
        <Route path="/404" element={<NotFound />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/403" element={<Unauthorized />} />
      </Routes>
    </Suspense>
  );
};

// Route configuration for navigation and permissions
export const routeConfig = {
  // Dashboard routes
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'FINANCE', 'ANALYTICS', 'SUPPORT', 'VIEWER'],
    permissions: ['dashboard.view'],
    category: 'dashboard'
  },
  superAdminDashboard: {
    path: '/dashboard/super',
    title: 'Super Admin Dashboard',
    icon: 'shield',
    roles: ['SUPER_ADMIN'],
    permissions: ['dashboard.view'],
    category: 'dashboard'
  },
  operationsDashboard: {
    path: '/dashboard/operations',
    title: 'Operations Dashboard',
    icon: 'activity',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'OPERATIONS_ADMIN'],
    permissions: ['operations.dashboard.view'],
    category: 'dashboard'
  },
  financeDashboard: {
    path: '/dashboard/finance',
    title: 'Finance Dashboard',
    icon: 'dollar-sign',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'FINANCE_ADMIN'],
    permissions: ['finance.dashboard.view'],
    category: 'dashboard'
  },
  complianceDashboard: {
    path: '/dashboard/compliance',
    title: 'Compliance Dashboard',
    icon: 'check-circle',
    roles: ['SUPER_ADMIN', 'COMPLIANCE_ADMIN'],
    permissions: ['compliance.dashboard.view'],
    category: 'dashboard'
  },
  supportDashboard: {
    path: '/dashboard/support',
    title: 'Support Dashboard',
    icon: 'help-circle',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'SUPPORT_ADMIN'],
    permissions: ['support.dashboard.view'],
    category: 'dashboard'
  },
  analyticsDashboard: {
    path: '/analytics-dashboard',
    title: 'Analytics Dashboard',
    icon: 'bar-chart',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ANALYTICS'],
    permissions: ['analytics.dashboard.view'],
    category: 'dashboard'
  },

  // Operations routes
  liveTrips: {
    path: '/operations/live-trips',
    title: 'Live Trips',
    icon: 'navigation',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'OPERATIONS_ADMIN'],
    permissions: ['trips.view'],
    category: 'operations'
  },
  liveDrivers: {
    path: '/operations/live-drivers',
    title: 'Live Drivers',
    icon: 'users',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'OPERATIONS_ADMIN'],
    permissions: ['drivers.view'],
    category: 'operations'
  },
  tripHistory: {
    path: '/operations/trip-history',
    title: 'Trip History',
    icon: 'clock',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'FINANCE'],
    permissions: ['trips.view'],
    category: 'operations'
  },
  emergencies: {
    path: '/operations/emergencies',
    title: 'Emergencies',
    icon: 'alert-triangle',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'OPERATIONS_ADMIN'],
    permissions: ['emergencies.view'],
    category: 'operations'
  },
  mapView: {
    path: '/operations/map-view',
    title: 'Map View',
    icon: 'map',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'OPERATIONS_ADMIN'],
    permissions: ['trips.view'],
    category: 'operations'
  },

  // Accounts routes
  drivers: {
    path: '/accounts/drivers',
    title: 'Drivers',
    icon: 'users',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'OPERATIONS_ADMIN'],
    permissions: ['drivers.view'],
    category: 'accounts'
  },
  passengers: {
    path: '/accounts/passengers',
    title: 'Passengers',
    icon: 'user',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT', 'SUPPORT_ADMIN'],
    permissions: ['passengers.view'],
    category: 'accounts'
  },
  verifications: {
    path: '/accounts/verifications',
    title: 'Verifications',
    icon: 'user-check',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'OPERATIONS_ADMIN'],
    permissions: ['users.verify'],
    category: 'accounts'
  },
  userManagement: {
    path: '/accounts/user-management',
    title: 'User Management',
    icon: 'user-check',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['users.manage'],
    category: 'accounts'
  },

  // Finance routes
  transactions: {
    path: '/finance/transactions',
    title: 'Transactions',
    icon: 'credit-card',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'FINANCE_ADMIN'],
    permissions: ['transactions.view'],
    category: 'finance'
  },
  payouts: {
    path: '/finance/payouts',
    title: 'Payouts',
    icon: 'dollar-sign',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'FINANCE_ADMIN'],
    permissions: ['payouts.manage'],
    category: 'finance'
  },
  wallets: {
    path: '/finance/wallets',
    title: 'Wallets',
    icon: 'briefcase',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'FINANCE_ADMIN'],
    permissions: ['wallets.view'],
    category: 'finance'
  },
  disputes: {
    path: '/finance/disputes',
    title: 'Disputes',
    icon: 'alert-circle',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT', 'FINANCE_ADMIN'],
    permissions: ['disputes.manage'],
    category: 'finance'
  },

  // System routes
  systemSettings: {
    path: '/system/settings',
    title: 'System Settings',
    icon: 'settings',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['settings.manage'],
    category: 'system'
  },
  systemRules: {
    path: '/system/rules',
    title: 'Business Rules',
    icon: 'file-text',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['rules.manage'],
    category: 'system'
  },

  // Analytics routes
  analyticsOverview: {
    path: '/analytics/overview',
    title: 'Analytics Overview',
    icon: 'bar-chart',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ANALYTICS'],
    permissions: ['analytics.view'],
    category: 'analytics'
  },
  reports: {
    path: '/analytics/reports',
    title: 'Reports',
    icon: 'file-text',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ANALYTICS', 'FINANCE'],
    permissions: ['reports.view'],
    category: 'analytics'
  },

  // Communication routes
  notifications: {
    path: '/communication/notifications',
    title: 'Notifications',
    icon: 'bell',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'],
    permissions: ['notifications.manage'],
    category: 'communication'
  },
  announcements: {
    path: '/communication/announcements',
    title: 'Announcements',
    icon: 'megaphone',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'],
    permissions: ['announcements.manage'],
    category: 'communication'
  },

  // Admin routes
  adminManagement: {
    path: '/admin-management/admins',
    title: 'Admin Management',
    icon: 'shield',
    roles: ['SUPER_ADMIN'],
    permissions: ['admin.manage'],
    category: 'admin'
  },
  auditLogs: {
    path: '/admin-management/audit-logs',
    title: 'Audit Logs',
    icon: 'file-text',
    roles: ['SUPER_ADMIN'],
    permissions: ['audit.view'],
    category: 'admin'
  },
  rolesPermissions: {
    path: '/admin-management/roles-permissions',
    title: 'Roles & Permissions',
    icon: 'key',
    roles: ['SUPER_ADMIN'],
    permissions: ['roles.manage'],
    category: 'admin'
  },

  // Legacy admin routes
  legacyAdminManagement: {
    path: '/admin/management',
    title: 'Admin Management',
    icon: 'shield',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['admin.manage'],
    category: 'admin'
  },
  legacyAuditLogs: {
    path: '/admin/audit-logs',
    title: 'Audit Logs',
    icon: 'file-text',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['audit.view'],
    category: 'admin'
  },
  legacyRolesPermissions: {
    path: '/admin/roles-permissions',
    title: 'Roles & Permissions',
    icon: 'key',
    roles: ['SUPER_ADMIN'],
    permissions: ['roles.manage'],
    category: 'admin'
  }
};

// Get filtered routes based on user role
export const getFilteredRoutes = (userRole) => {
  const filteredRoutes = {};
  
  Object.entries(routeConfig).forEach(([key, route]) => {
    if (route.roles.includes(userRole)) {
      filteredRoutes[key] = route;
    }
  });
  
  return filteredRoutes;
};

// Get navigation items for sidebar
export const getNavigationItems = (userRole) => {
  const routes = getFilteredRoutes(userRole);
  
  // Group by category
  const categories = {
    dashboard: {
      name: 'Dashboard',
      icon: 'home',
      items: []
    },
    operations: {
      name: 'Operations',
      icon: 'activity',
      items: []
    },
    accounts: {
      name: 'Accounts',
      icon: 'users',
      items: []
    },
    finance: {
      name: 'Finance',
      icon: 'dollar-sign',
      items: []
    },
    system: {
      name: 'System',
      icon: 'settings',
      items: []
    },
    analytics: {
      name: 'Analytics',
      icon: 'bar-chart',
      items: []
    },
    communication: {
      name: 'Communication',
      icon: 'message-square',
      items: []
    },
    admin: {
      name: 'Admin',
      icon: 'shield',
      items: []
    }
  };
  
  // Populate categories
  Object.values(routes).forEach(route => {
    if (categories[route.category]) {
      categories[route.category].items.push(route);
    }
  });
  
  // Remove empty categories
  Object.keys(categories).forEach(category => {
    if (categories[category].items.length === 0) {
      delete categories[category];
    }
  });
  
  return categories;
};

// Get default route for user role (updated with new admin roles)
export const getDefaultRoute = (userRole) => {
  if (userRole === 'SUPER_ADMIN') {
    return '/dashboard/super';
  } else if (userRole === 'OPERATIONS_ADMIN' || userRole === 'OPERATIONS') {
    return '/dashboard/operations';
  } else if (userRole === 'FINANCE_ADMIN' || userRole === 'FINANCE') {
    return '/dashboard/finance';
  } else if (userRole === 'COMPLIANCE_ADMIN') {
    return '/dashboard/compliance';
  } else if (userRole === 'SUPPORT_ADMIN' || userRole === 'SUPPORT') {
    return '/dashboard/support';
  } else if (userRole === 'ANALYTICS') {
    return '/analytics-dashboard';
  } else if (userRole === 'VIEWER') {
    return '/dashboard';
  } else if (userRole === 'ADMIN') {
    return '/dashboard';
  }
  
  return '/dashboard';
};

export default AppRoutes;