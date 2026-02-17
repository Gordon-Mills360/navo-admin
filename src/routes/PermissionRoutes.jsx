import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';

// Import all route configurations
import { routeConfig, getNavigationItems, getDefaultRoute } from './AppRoutes';

/**
 * Check if user has permission to access a route
 */
export const checkRoutePermission = (route, userRole, userPermissions = []) => {
  if (!route) return false;
  
  // Check role-based access
  if (route.roles && route.roles.length > 0) {
    if (!route.roles.includes(userRole)) {
      return false;
    }
  }
  
  // Check permission-based access
  if (route.permissions && route.permissions.length > 0) {
    const hasAllPermissions = route.permissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get all routes that user has access to
 */
export const getAllowedRoutes = (userRole, userPermissions = []) => {
  const allowedRoutes = {};
  
  Object.entries(routeConfig).forEach(([key, route]) => {
    if (checkRoutePermission(route, userRole, userPermissions)) {
      allowedRoutes[key] = route;
    }
  });
  
  return allowedRoutes;
};

/**
 * Redirect if unauthorized
 */
export const redirectIfUnauthorized = (user, route, userPermissions = []) => {
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!checkRoutePermission(route, user.role, userPermissions)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  return null;
};

/**
 * Check if user has permission for current route
 */
export const hasRoutePermission = (path, userRole, userPermissions = []) => {
  // Find route by path
  const route = Object.values(routeConfig).find(r => r.path === path);
  
  if (!route) {
    // If route not in config, allow access (for dynamic routes)
    return true;
  }
  
  return checkRoutePermission(route, userRole, userPermissions);
};

/**
 * Get complete route configuration
 */
export const getRouteConfig = () => {
  return routeConfig;
};

/**
 * Get required permissions for a route
 */
export const getRoutePermissions = (routePath) => {
  const route = Object.values(routeConfig).find(r => r.path === routePath);
  return route?.permissions || [];
};

/**
 * Filter navigation items based on user permissions
 */
export const filterNavigationItems = (items, userRole, userPermissions = []) => {
  const filteredCategories = {};
  
  Object.entries(items).forEach(([category, categoryData]) => {
    const filteredItems = categoryData.items.filter(item => 
      checkRoutePermission(item, userRole, userPermissions)
    );
    
    if (filteredItems.length > 0) {
      filteredCategories[category] = {
        ...categoryData,
        items: filteredItems
      };
    }
  });
  
  return filteredCategories;
};

/**
 * Component wrapper for route protection
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallback = null 
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, hasRole } = usePermission();
  const location = useLocation();
  
  if (loading) {
    return <LoadingSpinner fullPage text="Checking permissions..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role requirements
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return fallback || <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission.split('.')[0], permission.split('.')[1])
    );
    
    if (!hasAllPermissions) {
      return fallback || <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }
  
  return children;
};

/**
 * Alias for ProtectedRoute with resource/action syntax
 * (Added to fix the import issue in AppRoutes.jsx)
 */
export const PermissionGuard = ({ children, resource, action }) => {
  const requiredPermissions = resource && action ? [`${resource}.${action}`] : [];
  
  return (
    <ProtectedRoute requiredPermissions={requiredPermissions}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Component wrapper for element-level permission checking
 */
export const PermissionBoundary = ({ 
  children, 
  resource, 
  action,
  requiredPermissions = [],
  fallback = null,
  showFallback = true
}) => {
  const { hasPermission } = usePermission();
  
  let hasAccess = false;
  
  if (resource && action) {
    hasAccess = hasPermission(resource, action);
  } else if (requiredPermissions.length > 0) {
    hasAccess = requiredPermissions.every(permission => 
      hasPermission(permission.split('.')[0], permission.split('.')[1])
    );
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }
  
  if (!hasAccess) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    if (showFallback) {
      return null;
    }
  }
  
  return <>{children}</>;
};

/**
 * HOC for permission-based component wrapping
 */
export const withPermission = (Component, permissionProps = {}) => {
  return function WithPermissionWrapper(props) {
    return (
      <PermissionBoundary {...permissionProps}>
        <Component {...props} />
      </PermissionBoundary>
    );
  };
};

/**
 * Hook for route-based permission utilities
 */
export const useRoutePermissions = () => {
  const { user } = useAuth();
  const { hasPermission, hasRole } = usePermission();
  const location = useLocation();
  
  const checkCurrentRoute = () => {
    const currentPath = location.pathname;
    const route = Object.values(routeConfig).find(r => r.path === currentPath);
    
    if (!route) return true; // Dynamic routes are allowed
    
    return checkRoutePermission(route, user?.role, []);
  };
  
  const getCurrentRouteConfig = () => {
    const currentPath = location.pathname;
    return Object.values(routeConfig).find(r => r.path === currentPath);
  };
  
  const getBreadcrumbRoutes = () => {
    const currentPath = location.pathname;
    const pathSegments = currentPath.split('/').filter(segment => segment);
    
    const breadcrumbs = [];
    let currentPathBuilder = '';
    
    pathSegments.forEach(segment => {
      currentPathBuilder += `/${segment}`;
      const route = Object.values(routeConfig).find(r => r.path === currentPathBuilder);
      
      if (route) {
        breadcrumbs.push({
          path: route.path,
          title: route.title,
          icon: route.icon
        });
      }
    });
    
    return breadcrumbs;
  };
  
  return {
    checkCurrentRoute,
    getCurrentRouteConfig,
    getBreadcrumbRoutes,
    hasPermission,
    hasRole,
    userRole: user?.role
  };
};

// Export all utilities
export {
  getNavigationItems,
  getDefaultRoute
};

export default ProtectedRoute;