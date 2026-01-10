import React from 'react';
import {
  Box,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  Badge,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaBell, FaCog, FaUser, FaChevronDown } from 'react-icons/fa';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const TopNav = () => {
  const navigate = useNavigate();
  const bgColor = 'white';
  const borderColor = 'gray.200';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleProfile = () => {
    // Navigate to profile page or show modal
    console.log('Navigate to profile');
  };

  const handleSettings = () => {
    // Navigate to settings page
    console.log('Navigate to settings');
  };

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={{ base: 4, md: 6 }}
      py={4}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top={0}
      zIndex={5}
      boxShadow="sm"
      backdropFilter="blur(10px)"
      ml={{ base: 0, md: '250px' }}
      transition="margin 0.3s"
    >
      {/* Left side - Page title */}
      <Box>
        <Text 
          fontSize="xl" 
          fontWeight="bold" 
          color="gray.800"
          bgGradient="linear(to-r, brand.500, brand.600)"
          bgClip="text"
        >
          Admin Dashboard
        </Text>
        <Text 
          fontSize="sm" 
          color="gray.600"
          mt={1}
        >
          Manage Your Rides Platform
        </Text>
      </Box>

      {/* Right side - User menu and notifications */}
      <HStack spacing={4}>
        {/* Notifications */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaBell />}
            variant="ghost"
            aria-label="Notifications"
            colorScheme="gray"
            position="relative"
            borderRadius="full"
            _hover={{ 
              bg: 'gray.100',
              transform: 'scale(1.05)'
            }}
            _active={{ bg: 'gray.200' }}
            transition="all 0.2s"
          >
            <Badge
              colorScheme="red"
              borderRadius="full"
              position="absolute"
              top="6px"
              right="6px"
              fontSize="10px"
              minW="16px"
              h="16px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              0
            </Badge>
          </MenuButton>
          <MenuList 
            minW="300px" 
            py={2}
            border="1px"
            borderColor="gray.200"
            boxShadow="xl"
            borderRadius="xl"
          >
            <MenuItem 
              py={3}
              _hover={{ bg: 'gray.50' }}
              cursor="default"
            >
              <HStack justify="space-between" w="100%">
                <Text fontSize="sm" color="gray.600">
                  No new notifications
                </Text>
                <Badge colorScheme="gray" fontSize="xs">
                  Up to date
                </Badge>
              </HStack>
            </MenuItem>
          </MenuList>
        </Menu>

        {/* User Menu */}
        <Menu>
          <MenuButton
            as={Box}
            _hover={{ 
              bg: 'gray.50',
              transform: 'translateY(-1px)'
            }}
            _active={{ bg: 'gray.100' }}
            transition="all 0.2s"
            borderRadius="lg"
            p={2}
          >
            <HStack spacing={3}>
              <Avatar 
                size="sm" 
                name="Admin User" 
                bg="brand.500" // Using theme color
                color="white"
                fontWeight="bold"
                boxShadow="sm"
              />
              <Box textAlign="left">
                <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                  Admin User
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Administrator
                </Text>
              </Box>
              <Icon 
                as={FaChevronDown} 
                boxSize="12px" 
                color="gray.500"
              />
            </HStack>
          </MenuButton>
          <MenuList 
            minW="200px"
            border="1px"
            borderColor="gray.200"
            boxShadow="xl"
            borderRadius="xl"
            py={2}
          >
            <MenuItem 
              icon={<Icon as={FaUser} color="gray.500" />} 
              onClick={handleProfile}
              py={2.5}
              _hover={{ bg: 'gray.50' }}
              fontSize="sm"
            >
              My Profile
            </MenuItem>
            <MenuItem 
              icon={<Icon as={FaCog} color="gray.500" />} 
              onClick={handleSettings}
              py={2.5}
              _hover={{ bg: 'gray.50' }}
              fontSize="sm"
            >
              Settings
            </MenuItem>
            <MenuDivider borderColor="gray.200" />
            <MenuItem 
              onClick={handleLogout}
              py={2.5}
              _hover={{ bg: 'red.50' }}
              fontSize="sm"
              color="red.500"
              fontWeight="medium"
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  );
};

export default TopNav;