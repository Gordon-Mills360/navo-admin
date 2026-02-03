import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Text, 
  VStack, 
  Icon,
  Button,
  Heading,
  useColorModeValue
} from '@chakra-ui/react';
import { WarningIcon, LockIcon } from '@chakra-ui/icons';
import { usePermission } from '../../contexts/PermissionContext';

const PermissionGuard = ({
  children,
  resource,
  action,
  permissions = [],
  requireAll = true,
  fallback = null,
  showFallback = true,
  redirectOnDeny = false,
  redirectTo = '/unauthorized',
  checkMode = 'any' // 'any' or 'all'
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Check permissions based on different strategies
  let hasAccess = false;

  if (resource && action) {
    // Single permission check
    hasAccess = hasPermission(resource, action);
  } else if (permissions.length > 0) {
    // Multiple permissions check
    if (checkMode === 'all' || requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }

  // Handle redirect if access denied
  React.useEffect(() => {
    if (!hasAccess && redirectOnDeny) {
      navigate(redirectTo, { 
        state: { 
          from: location.pathname,
          resource,
          action 
        } 
      });
    }
  }, [hasAccess, redirectOnDeny, redirectTo, navigate, location, resource, action]);

  // Return children if access granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Return null if no fallback and no redirect
  if (!showFallback && !redirectOnDeny) {
    return null;
  }

  // Return custom fallback if provided
  if (fallback && showFallback) {
    if (typeof fallback === 'function') {
      return fallback({ resource, action, permissions });
    }
    return <>{fallback}</>;
  }

  // Default fallback UI
  if (showFallback) {
    return (
      <Box
        width="100%"
        minHeight="300px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={bgColor}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        p={8}
      >
        <VStack spacing={4} textAlign="center" maxW="400px">
          <Icon as={LockIcon} boxSize={12} color="red.500" />
          <Heading size="md" color="gray.700">
            Access Denied
          </Heading>
          <Text color="gray.500" fontSize="sm">
            You don't have permission to access this resource.
            {resource && action && (
              <Text as="span" fontWeight="medium">
                Required: {resource}.{action}
              </Text>
            )}
          </Text>
          {permissions.length > 0 && (
            <Box 
              bg="gray.100" 
              p={3} 
              borderRadius="md" 
              fontSize="xs" 
              textAlign="left"
              width="100%"
            >
              <Text fontWeight="bold" mb={1}>Required Permissions:</Text>
              <VStack align="stretch" spacing={1}>
                {permissions.map((perm, index) => (
                  <Text key={index} fontFamily="mono">• {perm}</Text>
                ))}
              </VStack>
            </Box>
          )}
          <Button
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            mt={4}
          >
            Go Back
          </Button>
        </VStack>
      </Box>
    );
  }

  return null;
};

// Higher Order Component version
export const withPermission = (Component, permissionProps) => {
  return function WithPermissionWrapper(props) {
    return (
      <PermissionGuard {...permissionProps}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

// Hook for conditional rendering
export const usePermissionGuard = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  const checkPermission = (resource, action) => {
    return hasPermission(resource, action);
  };

  const checkPermissions = (permissions, mode = 'any') => {
    if (mode === 'all') {
      return hasAllPermissions(permissions);
    }
    return hasAnyPermission(permissions);
  };

  return { checkPermission, checkPermissions };
};

export default PermissionGuard;
export { withPermission, usePermissionGuard };