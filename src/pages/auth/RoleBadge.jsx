import React from 'react';
import {
  Badge,
  HStack,
  Text,
  Icon,
  Tooltip,
  Box,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import {
  StarIcon,
  ShieldIcon,
  SettingsIcon,
  DollarIcon,
  ChatIcon,
  ChartBarIcon,
  UserIcon
} from '@chakra-ui/icons';

const RoleBadge = ({
  role,
  size = 'md',
  showLabel = true,
  showIcon = true,
  tooltip = true,
  withDescription = false,
  variant = 'subtle',
  customIcon = null,
  customColor = null,
  textCase = 'uppercase',
  ...badgeProps
}) => {
  // Role configuration
  const roleConfig = {
    SUPER_ADMIN: {
      label: 'Super Admin',
      color: 'purple',
      icon: StarIcon,
      description: 'Full system access with all privileges',
      bgColor: 'purple.50',
      textColor: 'purple.700',
      borderColor: 'purple.200'
    },
    ADMIN: {
      label: 'Admin',
      color: 'blue',
      icon: ShieldIcon,
      description: 'Full administrative access',
      bgColor: 'blue.50',
      textColor: 'blue.700',
      borderColor: 'blue.200'
    },
    OPERATIONS: {
      label: 'Operations',
      color: 'green',
      icon: SettingsIcon,
      description: 'Ride operations and management',
      bgColor: 'green.50',
      textColor: 'green.700',
      borderColor: 'green.200'
    },
    FINANCE: {
      label: 'Finance',
      color: 'orange',
      icon: DollarIcon,
      description: 'Financial operations and reporting',
      bgColor: 'orange.50',
      textColor: 'orange.700',
      borderColor: 'orange.200'
    },
    SUPPORT: {
      label: 'Support',
      color: 'teal',
      icon: ChatIcon,
      description: 'Customer support and issue resolution',
      bgColor: 'teal.50',
      textColor: 'teal.700',
      borderColor: 'teal.200'
    },
    ANALYTICS: {
      label: 'Analytics',
      color: 'pink',
      icon: ChartBarIcon,
      description: 'Data analysis and reporting',
      bgColor: 'pink.50',
      textColor: 'pink.700',
      borderColor: 'pink.200'
    },
    VIEWER: {
      label: 'Viewer',
      color: 'gray',
      icon: UserIcon,
      description: 'Read-only access for viewing',
      bgColor: 'gray.50',
      textColor: 'gray.700',
      borderColor: 'gray.200'
    }
  };

  const config = roleConfig[role] || {
    label: role,
    color: customColor || 'gray',
    icon: customIcon || UserIcon,
    description: 'Custom role',
    bgColor: 'gray.50',
    textColor: 'gray.700',
    borderColor: 'gray.200'
  };

  const { label, color, icon: IconComponent, description } = config;
  
  // Size mapping
  const sizeConfig = {
    xs: { badge: 'xs', icon: 2, text: 'xs' },
    sm: { badge: 'sm', icon: 3, text: 'sm' },
    md: { badge: 'md', icon: 4, text: 'md' },
    lg: { badge: 'lg', icon: 5, text: 'lg' },
    xl: { badge: 'xl', icon: 6, text: 'xl' }
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const badgeContent = (
    <HStack spacing={1}>
      {showIcon && (
        <Icon
          as={IconComponent}
          boxSize={currentSize.icon}
          color={`${color}.500`}
        />
      )}
      {showLabel && (
        <Text
          fontSize={currentSize.text}
          fontWeight="medium"
          textTransform={textCase}
          letterSpacing="wider"
        >
          {label}
        </Text>
      )}
    </HStack>
  );

  const badgeComponent = (
    <Badge
      colorScheme={customColor || color}
      variant={variant}
      size={currentSize.badge}
      px={2}
      py={1}
      borderRadius="full"
      display="inline-flex"
      alignItems="center"
      border="1px"
      borderColor={`${color}.200`}
      {...badgeProps}
    >
      {badgeContent}
    </Badge>
  );

  // With description variant
  if (withDescription) {
    const bg = useColorModeValue(`${color}.50`, `${color}.900`);
    const border = useColorModeValue(`${color}.200`, `${color}.700`);

    return (
      <Box
        p={3}
        borderRadius="lg"
        border="1px"
        borderColor={border}
        bg={bg}
        width="100%"
      >
        <VStack align="start" spacing={2}>
          <HStack spacing={2}>
            {showIcon && (
              <Icon as={IconComponent} boxSize={5} color={`${color}.500`} />
            )}
            <Text fontWeight="bold" fontSize="sm" textTransform="uppercase">
              {label}
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.600">
            {description}
          </Text>
        </VStack>
      </Box>
    );
  }

  // Tooltip variant
  if (tooltip && description) {
    return (
      <Tooltip
        label={description}
        hasArrow
        placement="top"
        bg={`${color}.600`}
        color="white"
        fontSize="xs"
        p={2}
        borderRadius="md"
      >
        {badgeComponent}
      </Tooltip>
    );
  }

  return badgeComponent;
};

// Role selector component
export const RoleSelector = ({ 
  roles = ['ADMIN', 'OPERATIONS', 'FINANCE', 'SUPPORT', 'ANALYTICS', 'VIEWER'],
  selectedRole,
  onRoleSelect,
  size = 'md',
  showIcons = true,
  ...props
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <HStack 
      spacing={2} 
      p={2} 
      bg={bgColor} 
      borderRadius="md" 
      border="1px" 
      borderColor={borderColor}
      wrap="wrap"
      {...props}
    >
      {roles.map((role) => {
        const isSelected = role === selectedRole;
        return (
          <Box
            key={role}
            as="button"
            type="button"
            onClick={() => onRoleSelect && onRoleSelect(role)}
            opacity={isSelected ? 1 : 0.7}
            transform={isSelected ? 'scale(1.05)' : 'scale(1)'}
            transition="all 0.2s"
            _hover={{
              opacity: 1,
              transform: 'scale(1.05)'
            }}
          >
            <RoleBadge
              role={role}
              size={size}
              showIcon={showIcons}
              variant={isSelected ? 'solid' : 'subtle'}
            />
          </Box>
        );
      })}
    </HStack>
  );
};

// Role description component
export const RoleDescription = ({ role, showIcon = true, ...props }) => {
  const config = {
    SUPER_ADMIN: {
      permissions: [
        'Create/Delete administrators',
        'Manage all system settings',
        'Access audit logs',
        'Override any permission',
        'System backup/restore'
      ]
    },
    ADMIN: {
      permissions: [
        'Manage users and drivers',
        'Process financial operations',
        'Configure system rules',
        'Handle escalations',
        'Generate reports'
      ]
    },
    OPERATIONS: {
      permissions: [
        'Monitor live trips',
        'Handle emergencies',
        'Manage driver onboarding',
        'Process trip disputes',
        'Coordinate support'
      ]
    },
    FINANCE: {
      permissions: [
        'Process payouts',
        'Handle refunds',
        'Generate financial reports',
        'Manage wallets',
        'Audit transactions'
      ]
    },
    SUPPORT: {
      permissions: [
        'Respond to user inquiries',
        'Process refund requests',
        'Handle complaints',
        'Escalate issues',
        'Update user status'
      ]
    },
    ANALYTICS: {
      permissions: [
        'View all reports',
        'Export data',
        'Analyze trends',
        'Generate insights',
        'Monitor KPIs'
      ]
    },
    VIEWER: {
      permissions: [
        'View dashboards',
        'Read reports',
        'Monitor statistics',
        'View user data (read-only)',
        'Access analytics'
      ]
    }
  };

  const roleData = config[role] || { permissions: [] };

  return (
    <VStack align="stretch" spacing={3} {...props}>
      <RoleBadge 
        role={role} 
        size="lg" 
        showIcon={showIcon} 
        withDescription 
      />
      <Box>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          Permissions:
        </Text>
        <VStack align="stretch" spacing={1}>
          {roleData.permissions.map((perm, index) => (
            <HStack key={index} spacing={2}>
              <Box
                width="6px"
                height="6px"
                borderRadius="full"
                bg="green.500"
                flexShrink={0}
              />
              <Text fontSize="xs" color="gray.600">
                {perm}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};

export default RoleBadge;
export { RoleSelector, RoleDescription };