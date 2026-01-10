import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Divider,
  useColorModeValue,
  Collapse,
} from '@chakra-ui/react';
import {
  FaTachometerAlt,
  FaUsers,
  FaMotorcycle,
  FaRoute,
  FaCreditCard,
  FaSignOutAlt,
  FaCog,
  FaChevronDown,
  FaChevronRight,
  FaUserShield,
  FaUserCheck,
  FaMoneyBillWave,
  FaShieldAlt,
  FaBell,
  FaHistory,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const bgColor = 'white';
  const borderColor = 'gray.200';
  const activeBg = 'brand.50';
  const activeColor = 'brand.500';

  const mainMenuItems = [
    { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/users', icon: FaUsers, label: 'Users' },
    { path: '/drivers', icon: FaMotorcycle, label: 'Drivers' },
    { path: '/rides', icon: FaRoute, label: 'Rides' },
    { path: '/payments', icon: FaCreditCard, label: 'Payments' },
  ];

  // Settings sub-menu items
  const settingsMenuItems = [
    { path: '/admin/settings/platform', icon: FaCog, label: 'Platform Settings' },
    { path: '/admin/settings/roles', icon: FaUserShield, label: 'Roles & Permissions' },
    { path: '/admin/settings/drivers', icon: FaUserCheck, label: 'Driver Rules' },
    { path: '/admin/settings/payments', icon: FaMoneyBillWave, label: 'Payments & Commission' },
    { path: '/admin/settings/security', icon: FaShieldAlt, label: 'Security & Compliance' },
    { path: '/admin/settings/notifications', icon: FaBell, label: 'Notifications' },
    { path: '/admin/settings/audit', icon: FaHistory, label: 'Audit Logs' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    
    // For settings pages, check if current path starts with the menu item path
    if (path.startsWith('/admin/settings')) {
      return location.pathname === path;
    }
    
    return location.pathname === path;
  };

  // Check if any settings page is active
  const isSettingsActive = settingsMenuItems.some(item => isActive(item.path));

  return (
    <Box
      width={{ base: 'full', md: '250px' }}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      height="100vh"
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      zIndex={10}
      boxShadow="sm"
    >
      {/* Logo */}
      <Box p={6} borderBottom="1px" borderColor={borderColor}>
        <Text 
          fontSize="xl" 
          fontWeight="bold" 
          color="brand.500"
          letterSpacing="-0.5px"
        >
          NAVO Admin
        </Text>
        <Text 
          fontSize="sm" 
          color="gray.600"
          mt={1}
        >
          Ride Platform
        </Text>
      </Box>

      {/* Menu Items */}
      <VStack 
        spacing={2} 
        p={4} 
        flex={1} 
        align="stretch"
        overflowY="auto"
      >
        {mainMenuItems.map((item) => (
          <Box
            key={item.path}
            as="button"
            onClick={() => navigate(item.path)}
            p={3}
            borderRadius="lg"
            bg={isActive(item.path) ? activeBg : 'transparent'}
            color={isActive(item.path) ? activeColor : 'gray.600'}
            _hover={{ 
              bg: isActive(item.path) ? activeBg : 'gray.50',
              transform: 'translateX(4px)',
              transition: 'all 0.2s'
            }}
            transition="all 0.2s"
            textAlign="left"
            fontWeight="500"
            display="flex"
            alignItems="center"
            gap={3}
          >
            <Icon 
              as={item.icon} 
              boxSize="18px" 
              color={isActive(item.path) ? activeColor : 'gray.500'}
            />
            <Text fontSize="sm" fontWeight="500">
              {item.label}
            </Text>
            {isActive(item.path) && (
              <Box 
                ml="auto" 
                w="3px" 
                h="6" 
                bg="brand.500" 
                borderRadius="full"
              />
            )}
          </Box>
        ))}

        {/* Settings Section with Dropdown */}
        <Box mt={2}>
          {/* Settings Main Button */}
          <Box
            as="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            p={3}
            borderRadius="lg"
            bg={isSettingsActive ? activeBg : 'transparent'}
            color={isSettingsActive ? activeColor : 'gray.600'}
            _hover={{ 
              bg: isSettingsActive ? activeBg : 'gray.50',
              transform: 'translateX(4px)',
              transition: 'all 0.2s'
            }}
            transition="all 0.2s"
            textAlign="left"
            fontWeight="500"
            display="flex"
            alignItems="center"
            gap={3}
            width="100%"
          >
            <Icon 
              as={FaCog} 
              boxSize="18px" 
              color={isSettingsActive ? activeColor : 'gray.500'}
            />
            <Text fontSize="sm" fontWeight="500">
              Settings
            </Text>
            <Icon 
              as={isSettingsOpen ? FaChevronDown : FaChevronRight} 
              boxSize="14px" 
              ml="auto"
              color="gray.400"
            />
          </Box>

          {/* Settings Dropdown Menu */}
          <Collapse in={isSettingsOpen} animateOpacity>
            <VStack 
              spacing={1} 
              align="stretch" 
              mt={2} 
              ml={6}
              borderLeft="2px"
              borderColor="gray.100"
              pl={3}
            >
              {settingsMenuItems.map((item) => (
                <Box
                  key={item.path}
                  as="button"
                  onClick={() => navigate(item.path)}
                  p={2}
                  borderRadius="lg"
                  bg={isActive(item.path) ? activeBg : 'transparent'}
                  color={isActive(item.path) ? activeColor : 'gray.600'}
                  _hover={{ 
                    bg: isActive(item.path) ? activeBg : 'gray.50',
                    transition: 'all 0.2s'
                  }}
                  transition="all 0.2s"
                  textAlign="left"
                  fontWeight="400"
                  display="flex"
                  alignItems="center"
                  gap={3}
                  fontSize="13px"
                >
                  <Icon 
                    as={item.icon} 
                    boxSize="14px" 
                    color={isActive(item.path) ? activeColor : 'gray.400'}
                  />
                  <Text fontSize="sm">
                    {item.label}
                  </Text>
                  {isActive(item.path) && (
                    <Box 
                      ml="auto" 
                      w="2px" 
                      h="4" 
                      bg="brand.500" 
                      borderRadius="full"
                    />
                  )}
                </Box>
              ))}
            </VStack>
          </Collapse>
        </Box>
      </VStack>

      <Divider />

      {/* Logout */}
      <Box p={4}>
        <Box
          as="button"
          onClick={handleLogout}
          p={3}
          borderRadius="lg"
          color="red.500"
          _hover={{ 
            bg: 'red.50',
            transform: 'translateX(4px)',
            transition: 'all 0.2s'
          }}
          transition="all 0.2s"
          textAlign="left"
          fontWeight="500"
          display="flex"
          alignItems="center"
          gap={3}
          width="100%"
        >
          <Icon as={FaSignOutAlt} boxSize="18px" />
          <Text fontSize="sm" fontWeight="500">
            Logout
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;