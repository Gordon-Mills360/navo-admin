import React, { useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Avatar,
  VStack,
  HStack,
  Divider,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaBell,
  FaChevronDown,
  FaBars,
  FaCog,
  FaUser,
  FaShieldAlt,
  FaQuestionCircle,
  FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useRealTime } from '../../contexts/RealTimeContext';

const Header = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { admin, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();
  const { realTimeData } = useRealTime();
  const { isOpen: isNotificationsOpen, onOpen: onNotificationsOpen, onClose: onNotificationsClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      console.log('Searching for:', searchQuery);
      // Implement search functionality
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'emergency': return '🔴';
      case 'alert': return '⚠️';
      case 'system': return '🔧';
      case 'update': return '🔄';
      default: return '📢';
    }
  };

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={900}
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      px={6}
      py={3}
      ml={sidebarCollapsed ? '70px' : '280px'}
      transition="margin-left 0.3s ease"
    >
      <Flex align="center" justify="space-between" h="60px">
        {/* Left Section */}
        <Flex align="center" gap={6}>
          <IconButton
            icon={<FaBars />}
            variant="ghost"
            size="sm"
            aria-label="Toggle sidebar"
            onClick={onToggleSidebar}
            color="gray.600"
            _hover={{ bg: 'gray.100' }}
          />
          
          <InputGroup width="400px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search users, trips, payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              bg="gray.50"
              borderColor="gray.300"
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
              }}
            />
          </InputGroup>
        </Flex>

        {/* Right Section */}
        <Flex align="center" gap={4}>
          {/* Real-time Indicators */}
          <HStack spacing={4}>
            <Box textAlign="center">
              <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                {realTimeData.activeTrips || 0}
              </Badge>
              <Text fontSize="xs" color="gray.600">Active Trips</Text>
            </Box>
            
            <Box textAlign="center">
              <Badge colorScheme="green" variant="subtle" fontSize="xs">
                {realTimeData.onlineDrivers || 0}
              </Badge>
              <Text fontSize="xs" color="gray.600">Online Drivers</Text>
            </Box>
            
            {realTimeData.emergencies?.length > 0 && (
              <Box textAlign="center">
                <Badge colorScheme="red" variant="solid" fontSize="xs">
                  {realTimeData.emergencies.length}
                </Badge>
                <Text fontSize="xs" color="gray.600">Emergencies</Text>
              </Box>
            )}
          </HStack>

          <Divider orientation="vertical" h={6} />

          {/* Notifications */}
          <Box position="relative">
            <IconButton
              icon={<FaBell />}
              variant="ghost"
              size="sm"
              aria-label="Notifications"
              onClick={onNotificationsOpen}
              color={unreadCount > 0 ? 'red.500' : 'gray.600'}
              _hover={{ bg: 'gray.100' }}
            />
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                variant="solid"
                fontSize="2xs"
                borderRadius="full"
                position="absolute"
                top={1}
                right={1}
                minW={4}
                h={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount}
              </Badge>
            )}
          </Box>

          {/* Admin Profile Menu */}
          <Menu>
            <MenuButton
              as={Flex}
              align="center"
              gap={3}
              p={2}
              borderRadius="lg"
              _hover={{ bg: 'gray.100' }}
              cursor="pointer"
              transition="all 0.2s"
            >
              <Avatar
                size="sm"
                name={admin?.name}
                bg="brand.500"
                color="white"
                fontWeight="bold"
              />
              {!sidebarCollapsed && (
                <>
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                      {admin?.name || 'Admin'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {admin?.role?.replace('_', ' ') || 'Admin'}
                    </Text>
                  </VStack>
                  <FaChevronDown size={12} color="gray.500" />
                </>
              )}
            </MenuButton>
            <MenuList minW="200px" py={2}>
              <MenuItem icon={<FaUser />} fontSize="sm">
                My Profile
              </MenuItem>
              <MenuItem icon={<FaCog />} fontSize="sm">
                Settings
              </MenuItem>
              <MenuItem icon={<FaShieldAlt />} fontSize="sm">
                Security
              </MenuItem>
              <MenuItem icon={<FaQuestionCircle />} fontSize="sm">
                Help & Support
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<FaTimes />}
                fontSize="sm"
                color="red.600"
                onClick={logout}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Notifications Drawer */}
      <Drawer
        isOpen={isNotificationsOpen}
        placement="right"
        onClose={onNotificationsClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Flex justify="space-between" align="center">
              <Text>Notifications</Text>
              <HStack spacing={2}>
                {unreadCount > 0 && (
                  <Text
                    as="button"
                    fontSize="sm"
                    color="brand.500"
                    onClick={markAllAsRead}
                    _hover={{ textDecoration: 'underline' }}
                  >
                    Mark all as read
                  </Text>
                )}
                <Text
                  as="button"
                  fontSize="sm"
                  color="gray.500"
                  onClick={clearAll}
                  _hover={{ textDecoration: 'underline' }}
                >
                  Clear all
                </Text>
              </HStack>
            </Flex>
          </DrawerHeader>
          <DrawerBody p={0}>
            {notifications.length === 0 ? (
              <Box textAlign="center" py={10} color="gray.500">
                <FaBell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <Text>No notifications</Text>
              </Box>
            ) : (
              <VStack spacing={0} align="stretch" divider={<Divider />}>
                {notifications.map((notification) => (
                  <Box
                    key={notification.id}
                    p={4}
                    bg={notification.read_at ? 'white' : 'blue.50'}
                    _hover={{ bg: 'gray.50' }}
                    borderLeft={!notification.read_at ? '4px solid' : 'none'}
                    borderLeftColor="brand.500"
                  >
                    <Flex justify="space-between" align="start" mb={2}>
                      <HStack spacing={2}>
                        <Text fontSize="lg">
                          {getNotificationIcon(notification.notification_type)}
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm">
                          {notification.title}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {formatTime(notification.created_at)}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color="gray.700" mb={2}>
                      {notification.message}
                    </Text>
                    {notification.target_audience !== 'all' && (
                      <Badge
                        fontSize="xs"
                        colorScheme="gray"
                        variant="subtle"
                        borderRadius="full"
                        px={2}
                      >
                        {notification.target_audience}
                      </Badge>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Header;