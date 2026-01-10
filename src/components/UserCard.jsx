import React, { useState } from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
  Badge,
  useToast,
  Avatar,
  Tag,
  TagLabel,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
} from '@chakra-ui/react';
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCar,
  FaStar,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { formatDate } from '../utils/helpers';

const UserCard = ({ user, onStatusToggle }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToast();

  // Safe extraction of user data
  const userName = user.full_name || user.name || 'No Name';
  const userEmail = user.email || 'No email';
  const userPhone = user.phone || 'N/A';
  const userRole = user.role || 'passenger';
  const userCreatedAt = user.created_at;
  const userRating = user.rating || 5.0;
  const isOnline = user.is_online || false;
  const vehicleNumber = user.vehicle_number || 'N/A';
  
  // Driver-specific data
  const driverInfo = user.driver?.[0] || null;
  const isDriver = userRole === 'driver';
  const isDriverApproved = driverInfo?.approved || false;
  const isDriverSuspended = driverInfo?.suspended || false;
  const verificationStatus = driverInfo?.verification_status || 'pending';
  const driverRating = driverInfo?.rating || userRating;
  const totalRides = driverInfo?.total_rides || 0;
  const completedRides = driverInfo?.completed_rides || 0;
  const totalEarnings = driverInfo?.total_earnings || 0;

  const handleToggleStatus = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onStatusToggle(user.id, isOnline);
      setShowConfirm(false);
      
      toast({
        title: isOnline ? 'Account Disabled' : 'Account Enabled',
        description: isOnline 
          ? 'User account has been disabled' 
          : 'User account has been enabled',
        status: isOnline ? 'warning' : 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      passenger: {
        bg: 'blue.100',
        color: 'blue.800',
        label: 'Passenger',
        icon: FaUser
      },
      driver: {
        bg: 'green.100',
        color: 'green.800',
        label: 'Driver',
        icon: FaCar
      },
      admin: {
        bg: 'purple.100',
        color: 'purple.800',
        label: 'Admin',
        icon: FaCheckCircle
      }
    };
    
    const config = roleConfig[role] || roleConfig.passenger;
    const IconComponent = config.icon;
    
    return (
      <Tag 
        size="sm" 
        bg={config.bg} 
        color={config.color}
        borderRadius="full"
        ml={2}
      >
        <Icon as={IconComponent} mr={1} />
        <TagLabel>{config.label}</TagLabel>
      </Tag>
    );
  };

  const getDriverStatusBadge = () => {
    if (!isDriver) return null;
    
    if (isDriverSuspended) {
      return (
        <Badge 
          ml={2}
          colorScheme="red"
          variant="subtle"
          borderRadius="full"
          px={3}
          py={1}
        >
          Suspended
        </Badge>
      );
    }
    
    if (verificationStatus === 'pending' || !isDriverApproved) {
      return (
        <Badge 
          ml={2}
          colorScheme="yellow"
          variant="subtle"
          borderRadius="full"
          px={3}
          py={1}
        >
          Pending Approval
        </Badge>
      );
    }
    
    if (verificationStatus === 'verified' || isDriverApproved) {
      return (
        <Badge 
          ml={2}
          colorScheme="green"
          variant="subtle"
          borderRadius="full"
          px={3}
          py={1}
        >
          Verified Driver
        </Badge>
      );
    }
    
    return null;
  };

  const getStatusBadge = () => {
    if (isOnline === false) {
      return (
        <Badge
          colorScheme="red"
          variant="subtle"
          px={3}
          py={1}
          borderRadius="full"
          fontSize="sm"
          fontWeight="medium"
        >
          Offline
        </Badge>
      );
    }
    
    return (
      <Badge
        colorScheme="green"
        variant="subtle"
        px={3}
        py={1}
        borderRadius="full"
        fontSize="sm"
        fontWeight="medium"
      >
        Online
      </Badge>
    );
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <HStack spacing={0.5}>
        {[...Array(5)].map((_, i) => (
          <Icon
            key={i}
            as={FaStar}
            color={i < fullStars || (i === fullStars && hasHalfStar) ? 'yellow.500' : 'gray.300'}
            boxSize={4}
          />
        ))}
        <Text fontSize="sm" color="gray.600" ml={1}>
          ({rating.toFixed(1)})
        </Text>
      </HStack>
    );
  };

  return (
    <Box
      bg="white"
      borderRadius="lg"
      shadow="sm"
      border="1px solid"
      borderColor="gray.200"
      _hover={{ shadow: 'md', borderColor: 'gray.300' }}
      transition="all 0.2s"
    >
      <Box p={6}>
        <Flex justify="space-between" align="flex-start" wrap={{ base: 'wrap', md: 'nowrap' }} gap={4}>
          {/* Left Section: User Info */}
          <Flex align="flex-start" gap={4} flex={1} minW={0}>
            <Box flexShrink={0}>
              <Avatar
                bg={isDriver ? "green.100" : "blue.100"}
                color={isDriver ? "green.600" : "blue.600"}
                icon={isDriver ? <FaCar /> : <FaUser />}
                size="lg"
              />
            </Box>
            
            <Box flex="1" minW={0}>
              <Flex align="center" mb={2} wrap="wrap">
                <Text fontSize="lg" fontWeight="semibold" color="gray.900" isTruncated>
                  {userName}
                </Text>
                {getRoleBadge(userRole)}
                {getDriverStatusBadge()}
                <Box ml={2}>
                  {getStatusBadge()}
                </Box>
              </Flex>
              
              <VStack align="start" spacing={2} mt={2}>
                <HStack>
                  <Icon as={FaEnvelope} color="gray.600" boxSize={4} />
                  <Text fontSize="sm" color="gray.600" isTruncated>
                    {userEmail}
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={FaPhone} color="gray.600" boxSize={4} />
                  <Text fontSize="sm" color="gray.600">
                    {userPhone}
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={FaCalendarAlt} color="gray.600" boxSize={4} />
                  <Text fontSize="xs" color="gray.500">
                    Joined: {formatDate(userCreatedAt)}
                  </Text>
                </HStack>
                
                {/* Driver Stats */}
                {isDriver && (
                  <SimpleGrid columns={2} spacing={4} mt={2} width="full">
                    <Box>
                      <Text fontSize="xs" color="gray.500">Rating</Text>
                      {getRatingStars(driverRating)}
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Completed Rides</Text>
                      <Text fontSize="sm" fontWeight="medium">{completedRides}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Total Rides</Text>
                      <Text fontSize="sm" fontWeight="medium">{totalRides}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Total Earnings</Text>
                      <Text fontSize="sm" fontWeight="medium" color="green.600">
                        ₵{totalEarnings.toLocaleString('en-GH')}
                      </Text>
                    </Box>
                  </SimpleGrid>
                )}
              </VStack>
            </Box>
          </Flex>
          
          {/* Right Section: Actions */}
          <VStack align="end" spacing={3} minW="200px">
            {!showConfirm ? (
              <Button
                onClick={() => setShowConfirm(true)}
                isLoading={isUpdating}
                colorScheme={isOnline ? 'red' : 'green'}
                variant="outline"
                size="sm"
                width="full"
              >
                {isOnline ? 'Disable Account' : 'Enable Account'}
              </Button>
            ) : (
              <VStack align="end" spacing={2} width="full">
                <Text fontSize="sm" color="gray.600" textAlign="right">
                  {isOnline 
                    ? 'Disable this user account?' 
                    : 'Enable this user account?'}
                </Text>
                <HStack spacing={2} width="full">
                  <Button
                    onClick={() => setShowConfirm(false)}
                    isLoading={isUpdating}
                    variant="ghost"
                    size="sm"
                    colorScheme="gray"
                    flex={1}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleToggleStatus}
                    isLoading={isUpdating}
                    colorScheme={isOnline ? 'red' : 'green'}
                    size="sm"
                    flex={1}
                  >
                    {isUpdating ? 'Processing...' : 'Confirm'}
                  </Button>
                </HStack>
              </VStack>
            )}
            
            {isDriver && vehicleNumber !== 'N/A' && (
              <Tooltip label="Vehicle Number">
                <HStack spacing={2} p={2} bg="gray.50" borderRadius="md">
                  <Icon as={FaCar} color="gray.600" />
                  <Text fontSize="sm" color="gray.700">{vehicleNumber}</Text>
                </HStack>
              </Tooltip>
            )}
          </VStack>
        </Flex>
        
        {/* Status Alerts */}
        {isDriver && verificationStatus === 'pending' && !isDriverApproved && (
          <Alert status="warning" borderRadius="md" mt={4}>
            <AlertIcon as={FaExclamationTriangle} />
            <Box flex="1">
              <AlertTitle fontSize="sm">Driver Pending Approval</AlertTitle>
              <AlertDescription fontSize="xs">
                This driver is pending verification. Go to Drivers page to review their documents.
              </AlertDescription>
            </Box>
          </Alert>
        )}
        
        {isDriverSuspended && (
          <Alert status="error" borderRadius="md" mt={4}>
            <AlertIcon as={FaTimesCircle} />
            <Box flex="1">
              <AlertTitle fontSize="sm">Driver Suspended</AlertTitle>
              <AlertDescription fontSize="xs">
                This driver account has been suspended. They cannot accept new rides.
              </AlertDescription>
            </Box>
          </Alert>
        )}
        
        {isOnline === false && (
          <Alert status="error" borderRadius="md" mt={4}>
            <AlertIcon as={FaTimesCircle} />
            <Box flex="1">
              <AlertTitle fontSize="sm">Account Disabled</AlertTitle>
              <AlertDescription fontSize="xs">
                This account is disabled. User cannot login or request rides.
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default UserCard;