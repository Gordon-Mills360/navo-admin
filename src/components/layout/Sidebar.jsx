import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Icon,
  Collapse,
  useDisclosure,
  Divider,
  Tooltip,
  Badge,
} from '@chakra-ui/react';
import {
  FaHome,
  FaUsers,
  FaUserFriends,
  FaUser,
  FaMotorcycle,
  FaDollarSign,
  FaCog,
  FaChartBar,
  FaBell,
  FaDatabase,
  FaShieldAlt,
  FaCommentDots,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionContext';
import { useRealTime } from '../../contexts/RealTimeContext';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const { logout, admin } = useAuth();
  const { modules } = usePermissions();
  const { realTimeData } = useRealTime();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: FaHome,
      path: '/dashboard',
      show: true,
    },
    {
      title: 'Operations',
      icon: FaMotorcycle,
      path: '/operations',
      show: modules.operations,
      subItems: [
        { title: 'Live Trips', path: '/operations/live-trips' },
        { title: 'Live Drivers', path: '/operations/live-drivers' },
        { title: 'Emergencies', path: '/operations/emergencies' },
      ],
    },
    {
      title: 'Accounts',
      icon: FaUsers,
      path: '/accounts',
      show: modules.accounts,
      subItems: [
        { title: 'Drivers', path: '/accounts/drivers', badge: realTimeData.pendingApprovals },
        { title: 'Passengers', path: '/accounts/passengers' },
        { title: 'Verifications', path: '/accounts/verifications' },
      ],
    },
    {
      title: 'Finance',
      icon: FaDollarSign,
      path: '/finance',
      show: modules.finance,
      subItems: [
        { title: 'Transactions', path: '/finance/transactions' },
        { title: 'Payouts', path: '/finance/payouts' },
        { title: 'Wallets', path: '/finance/wallets' },
        { title: 'Disputes', path: '/finance/disputes' },
      ],
    },
    {
      title: 'System',
      icon: FaCog,
      path: '/system',
      show: modules.system,
      subItems: [
        { title: 'Settings', path: '/system/settings' },
        { title: 'Rules', path: '/system/rules' },
        { title: 'Configuration', path: '/system/configuration' },
      ],
    },
    {
      title: 'Analytics',
      icon: FaChartBar,
      path: '/analytics',
      show: modules.analytics,
      subItems: [
        { title: 'Overview', path: '/analytics/overview' },
        { title: 'Reports', path: '/analytics/reports' },
        { title: 'Metrics', path: '/analytics/metrics' },
      ],
    },
    {
      title: 'Communication',
      icon: FaCommentDots,
      path: '/communication',
      show: modules.communication,
      subItems: [
        { title: 'Notifications', path: '/communication/notifications' },
        { title: 'Announcements', path: '/communication/announcements' },
      ],
    },
    {
      title: 'Admin Management',
      icon: FaShieldAlt,
      path: '/admin-management',
      show: modules.adminManagement,
      subItems: [
        { title: 'Admins', path: '/admin-management/admins' },
        { title: 'Roles', path: '/admin-management/roles' },
        { title: 'Audit Logs', path: '/admin-management/audit-logs' },
      ],
    },
  ];

  const renderMenuItem = (item) => {
    const isExpanded = expandedSections[item.title];
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (!item.show) return null;

    const content = (
      <Box
        as={hasSubItems ? 'div' : NavLink}
        to={hasSubItems ? '#' : item.path}
        onClick={hasSubItems ? () => toggleSection(item.title) : null}
        display="flex"
        alignItems="center"
        justifyContent={isCollapsed ? 'center' : 'space-between'}
        p={3}
        mx={2}
        borderRadius="lg"
        color="gray.600"
        _hover={{
          bg: 'gray.100',
          color: 'brand.500',
        }}
        _activeLink={{
          bg: 'brand.50',
          color: 'brand.600',
          fontWeight: 'semibold',
        }}
        transition="all 0.2s"
        cursor="pointer"
        position="relative"
      >
        <Box display="flex" alignItems="center" gap={3}>
          <Icon as={item.icon} boxSize={5} />
          {!isCollapsed && (
            <Text fontSize="sm" fontWeight="medium">
              {item.title}
            </Text>
          )}
        </Box>
        
        {!isCollapsed && hasSubItems && (
          <Icon
            as={isExpanded ? FaChevronDown : FaChevronRight}
            boxSize={3}
            color="gray.400"
          />
        )}
        
        {!isCollapsed && item.badge && item.badge > 0 && (
          <Badge
            colorScheme="red"
            variant="solid"
            fontSize="xs"
            borderRadius="full"
            position="absolute"
            right={2}
            top={2}
            minW={5}
            h={5}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {item.badge}
          </Badge>
        )}
      </Box>
    );

    return (
      <Box key={item.title}>
        {isCollapsed ? (
          <Tooltip label={item.title} placement="right" hasArrow>
            {content}
          </Tooltip>
        ) : (
          content
        )}
        
        {hasSubItems && !isCollapsed && (
          <Collapse in={isExpanded}>
            <VStack spacing={1} align="stretch" pl={8} pr={2}>
              {item.subItems.map((subItem) => (
                <NavLink
                  key={subItem.path}
                  to={subItem.path}
                  style={({ isActive }) => ({
                    display: 'block',
                    padding: '8px 12px',
                    borderRadius: 'lg',
                    fontSize: 'sm',
                    color: isActive ? 'brand.600' : 'gray.600',
                    backgroundColor: isActive ? 'brand.50' : 'transparent',
                    fontWeight: isActive ? 'semibold' : 'normal',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'gray.100',
                      color: 'brand.500',
                    },
                  })}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Text>{subItem.title}</Text>
                    {subItem.badge && subItem.badge > 0 && (
                      <Badge
                        colorScheme="red"
                        variant="solid"
                        fontSize="xs"
                        borderRadius="full"
                        minW={5}
                        h={5}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {subItem.badge}
                      </Badge>
                    )}
                  </Box>
                </NavLink>
              ))}
            </VStack>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box
      as="aside"
      width={isCollapsed ? '70px' : '280px'}
      height="100vh"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      transition="all 0.3s ease"
      position="fixed"
      left={0}
      top={0}
      zIndex={1000}
      display="flex"
      flexDirection="column"
      overflowY="auto"
      className="scrollbar-hide"
    >
      {/* Logo */}
      <Box
        p={4}
        borderBottom="1px"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent={isCollapsed ? 'center' : 'space-between'}
        minH="60px"
      >
        {!isCollapsed ? (
          <>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              NAVO ADMIN
            </Text>
            <Badge colorScheme="brand" variant="subtle" fontSize="xs">
              v1.0
            </Badge>
          </>
        ) : (
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            N
          </Text>
        )}
      </Box>

      {/* Menu Items */}
      <VStack
        spacing={1}
        align="stretch"
        flex={1}
        py={4}
        overflowY="auto"
        className="scrollbar-hide"
      >
        {menuItems.map(renderMenuItem)}
      </VStack>

      {/* Admin Profile & Logout */}
      <Box
        p={4}
        borderTop="1px"
        borderColor="gray.200"
        bg="white"
      >
        {!isCollapsed ? (
          <>
            <Box display="flex" alignItems="center" gap={3} mb={3}>
              <Box
                w={10}
                h={10}
                borderRadius="full"
                bg="brand.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
              >
                {admin?.name?.charAt(0) || 'A'}
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                  {admin?.name || 'Admin'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {admin?.role?.replace('_', ' ') || 'Admin'}
                </Text>
              </Box>
            </Box>
            <Box
              as="button"
              onClick={logout}
              display="flex"
              alignItems="center"
              gap={3}
              p={3}
              w="100%"
              borderRadius="lg"
              color="gray.600"
              _hover={{
                bg: 'red.50',
                color: 'red.600',
              }}
              transition="all 0.2s"
              fontSize="sm"
            >
              <Icon as={FaSignOutAlt} />
              <Text>Logout</Text>
            </Box>
          </>
        ) : (
          <Tooltip label="Logout" placement="right" hasArrow>
            <Box
              as="button"
              onClick={logout}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={3}
              w="100%"
              borderRadius="lg"
              color="gray.600"
              _hover={{
                bg: 'red.50',
                color: 'red.600',
              }}
              transition="all 0.2s"
            >
              <Icon as={FaSignOutAlt} boxSize={5} />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;