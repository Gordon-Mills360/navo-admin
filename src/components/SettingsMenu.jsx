import React from 'react';
import { VStack, Text, Icon, Box, useColorModeValue } from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaCog,
  FaUserShield,
  FaUserCheck,
  FaMoneyBillWave,
  FaShieldAlt,
  FaBell,
  FaHistory,
} from 'react-icons/fa';

const SettingsMenu = () => {
  const location = useLocation();
  
  // Color scheme
  const activeBg = 'brand.50';
  const activeColor = 'brand.500';
  const hoverBg = 'gray.50';
  const borderColor = 'gray.200';
  const textColor = 'gray.600';
  
  const menuItems = [
    { 
      path: '/admin/settings/platform', 
      label: 'Platform Settings', 
      icon: FaCog,
      description: 'Configure platform-wide settings'
    },
    { 
      path: '/admin/settings/roles', 
      label: 'Roles & Permissions', 
      icon: FaUserShield,
      description: 'Manage admin roles and access'
    },
    { 
      path: '/admin/settings/drivers', 
      label: 'Driver Management', 
      icon: FaUserCheck,
      description: 'Driver rules and approval workflow'
    },
    { 
      path: '/admin/settings/payments', 
      label: 'Payments & Commission', 
      icon: FaMoneyBillWave,
      description: 'Payment settings and commission rules'
    },
    { 
      path: '/admin/settings/security', 
      label: 'Security & Compliance', 
      icon: FaShieldAlt,
      description: 'Security settings and compliance logs'
    },
    { 
      path: '/admin/settings/notifications', 
      label: 'Notifications', 
      icon: FaBell,
      description: 'Configure alerts and automation'
    },
    { 
      path: '/admin/settings/audit', 
      label: 'Audit Logs', 
      icon: FaHistory,
      description: 'System logs and activity trail'
    },
  ];

  return (
    <Box 
      width="240px" 
      bg="white" 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={borderColor}
      p={4}
      flexShrink={0}
      boxShadow="sm"
      height="fit-content"
    >
      <Text 
        fontSize="lg" 
        fontWeight="bold" 
        color="gray.800" 
        mb={4}
        pb={2}
        borderBottom="1px"
        borderColor="gray.100"
      >
        Settings
      </Text>
      
      <VStack spacing={1} align="stretch">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink to={item.path} key={item.path}>
              <Box
                p={3}
                borderRadius="md"
                bg={isActive ? activeBg : 'transparent'}
                color={isActive ? activeColor : textColor}
                _hover={{ 
                  bg: isActive ? activeBg : hoverBg,
                  transform: 'translateX(2px)',
                  transition: 'all 0.2s'
                }}
                transition="all 0.2s"
                display="flex"
                alignItems="flex-start"
                gap={3}
                position="relative"
                borderLeft={isActive ? '3px solid' : '3px solid transparent'}
                borderLeftColor={isActive ? activeColor : 'transparent'}
              >
                {/* Icon */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  bg={isActive ? 'white' : 'gray.50'}
                  borderWidth="1px"
                  borderColor={isActive ? 'brand.100' : 'gray.100'}
                  flexShrink={0}
                >
                  <Icon 
                    as={item.icon} 
                    boxSize="14px" 
                    color={isActive ? activeColor : 'gray.500'}
                  />
                </Box>
                
                {/* Text Content */}
                <Box flex={1}>
                  <Text 
                    fontSize="sm" 
                    fontWeight={isActive ? 'semibold' : 'medium'}
                    lineHeight="shorter"
                  >
                    {item.label}
                  </Text>
                  <Text 
                    fontSize="xs" 
                    color={isActive ? 'brand.400' : 'gray.500'}
                    mt={0.5}
                    lineHeight="tight"
                  >
                    {item.description}
                  </Text>
                </Box>
                
                {/* Active indicator dot */}
                {isActive && (
                  <Box
                    position="absolute"
                    right={3}
                    top="50%"
                    transform="translateY(-50%)"
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={activeColor}
                  />
                )}
              </Box>
            </NavLink>
          );
        })}
      </VStack>
      
      {/* Info footer */}
      <Box 
        mt={6} 
        pt={4} 
        borderTop="1px" 
        borderColor="gray.100"
      >
        <Text fontSize="xs" color="gray.500" textAlign="center">
          Control Room • Real-time Updates
        </Text>
      </Box>
    </Box>
  );
};

export default SettingsMenu;