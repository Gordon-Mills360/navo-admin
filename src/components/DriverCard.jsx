import React, { useState } from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useToast,
  Icon,
  Collapse,
  Divider,
  Image,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Progress,
  Stack,
} from '@chakra-ui/react';
import {
  FaPhone,
  FaEnvelope,
  FaMotorcycle,
  FaPalette,
  FaCalendar,
  FaStar,
  FaStarHalfAlt,
  FaStar as FaStarOutline,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaPauseCircle,
  FaPlayCircle,
  FaChevronDown,
  FaChevronUp,
  FaIdCard,
  FaCircle,
  FaUser,
  FaCar,
  FaMoneyBillWave,
  FaRoute,
} from 'react-icons/fa';

export default function DriverCard({ driver, onSuspend, onActivate }) {
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const toast = useToast();
  
  // Extract driver information
  const driverName = driver.full_name || driver.name || 'Unknown Driver';
  const driverPhone = driver.phone || 'No phone';
  const driverEmail = driver.email || 'No email';
  const driverId = driver.id || driver.user_id;
  const isSuspended = driver.suspended || false;
  const isOnline = driver.online || false;
  const rating = driver.rating || 0;
  const totalRides = driver.total_rides || 0;
  const totalEarnings = driver.total_earnings || 0;
  const completedRides = driver.completed_rides || 0;
  
  // Vehicle information
  const vehicleInfo = driver.vehicle ? 
    `${driver.vehicle.plate_number || 'No plate'} • ${driver.vehicle.vehicle_type || 'Tricycle'}` : 
    'No vehicle info';
  
  const vehicleColor = driver.vehicle?.color || 'Not specified';
  const vehicleYear = driver.vehicle?.year || 'Unknown';
  
  // Format currency
  const formatCurrency = (amount) => {
    return `₵${parseFloat(amount || 0).toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSuspend = () => {
    setShowSuspendModal(true);
  };

  const confirmSuspend = () => {
    if (!suspensionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for suspension',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    if (onSuspend) {
      onSuspend(suspensionReason);
      setShowSuspendModal(false);
      setSuspensionReason('');
      toast({
        title: 'Success',
        description: 'Driver suspended successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Suspension handler not provided',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleActivate = () => {
    if (window.confirm(`Are you sure you want to activate ${driverName}?`)) {
      if (onActivate) {
        onActivate();
        toast({
          title: 'Success',
          description: 'Driver activated successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    }
  };

  const getStatusColor = () => {
    if (isSuspended) return 'red.500';
    if (isOnline) return 'green.500';
    return 'gray.500';
  };

  const getStatusBadgeColor = () => {
    if (isSuspended) return { bg: 'red.100', color: 'red.800', border: 'red.200' };
    if (isOnline) return { bg: 'green.100', color: 'green.800', border: 'green.200' };
    return { bg: 'gray.100', color: 'gray.800', border: 'gray.200' };
  };

  const getStatusText = () => {
    if (isSuspended) return 'SUSPENDED';
    if (isOnline) return 'ONLINE';
    return 'OFFLINE';
  };

  const getRatingStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Icon key={i} as={FaStar} boxSize="14px" color="yellow.500" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<Icon key={i} as={FaStarHalfAlt} boxSize="14px" color="yellow.500" />);
      } else {
        stars.push(<Icon key={i} as={FaStarOutline} boxSize="14px" color="gray.300" />);
      }
    }
    
    return stars;
  };

  const getCompletionRate = () => {
    if (totalRides === 0) return 0;
    return Math.round((completedRides / totalRides) * 100);
  };

  const statusBadge = getStatusBadgeColor();

  return (
    <Card 
      borderRadius="xl" 
      boxShadow="sm" 
      borderWidth="1px" 
      borderColor="gray.200"
      _hover={{ 
        boxShadow: 'lg',
        transform: 'translateY(-2px)',
        transition: 'all 0.3s',
      }}
      transition="all 0.3s"
      overflow="hidden"
    >
      {/* Card Header with Status */}
      <Box 
        position="relative" 
        bg={isSuspended ? 'red.50' : isOnline ? 'green.50' : 'gray.50'}
        py={4}
        px={6}
        borderBottomWidth="1px"
        borderBottomColor="gray.200"
      >
        <Flex align="center">
          <Box mr={4}>
            {driver.avatar_url ? (
              <Image
                src={driver.avatar_url}
                alt={driverName}
                boxSize="60px"
                borderRadius="full"
                objectFit="cover"
                border="3px solid"
                borderColor="white"
                boxShadow="sm"
              />
            ) : (
              <Box
                boxSize="60px"
                borderRadius="full"
                bg="brand.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="3px solid"
                borderColor="white"
                boxShadow="sm"
              >
                <Icon as={FaUser} boxSize={8} color="brand.500" />
              </Box>
            )}
          </Box>
          
          <Box flex="1">
            <Heading size="md" color="gray.800" mb={1}>
              {driverName}
            </Heading>
            
            <HStack spacing={3} mb={2}>
              <HStack spacing={1}>
                <Icon as={FaPhone} color="gray.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600">
                  {driverPhone}
                </Text>
              </HStack>
              
              <HStack spacing={1}>
                <Icon as={FaEnvelope} color="gray.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600">
                  {driverEmail}
                </Text>
              </HStack>
            </HStack>
            
            <Flex align="center" justify="space-between">
              <Badge
                bg={statusBadge.bg}
                color={statusBadge.color}
                fontSize="xs"
                fontWeight="semibold"
                px={3}
                py={1}
                borderRadius="full"
                borderWidth="1px"
                borderColor={statusBadge.border}
              >
                {getStatusText()}
              </Badge>
              
              <HStack spacing={1}>
                {getRatingStars()}
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" ml={1}>
                  {rating.toFixed(1)}
                </Text>
              </HStack>
            </Flex>
          </Box>
        </Flex>
      </Box>

      <CardBody p={6}>
        {/* Performance Stats */}
        <VStack spacing={4} mb={6}>
          <HStack justify="space-between" w="100%">
            <Box textAlign="center" flex={1}>
              <VStack spacing={1}>
                <Icon as={FaRoute} color="blue.500" boxSize={5} />
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  {totalRides}
                </Text>
                <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                  Total Rides
                </Text>
              </VStack>
            </Box>
            
            <Divider orientation="vertical" height="40px" borderColor="gray.200" />
            
            <Box textAlign="center" flex={1}>
              <VStack spacing={1}>
                <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  {completedRides}
                </Text>
                <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                  Completed
                </Text>
              </VStack>
            </Box>
            
            <Divider orientation="vertical" height="40px" borderColor="gray.200" />
            
            <Box textAlign="center" flex={1}>
              <VStack spacing={1}>
                <Icon as={FaMoneyBillWave} color="yellow.500" boxSize={5} />
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  {formatCurrency(totalEarnings)}
                </Text>
                <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                  Earnings
                </Text>
              </VStack>
            </Box>
          </HStack>

          {/* Completion Rate */}
          <Box w="100%">
            <Flex justify="space-between" mb={1}>
              <Text fontSize="xs" color="gray.600">Completion Rate</Text>
              <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                {getCompletionRate()}%
              </Text>
            </Flex>
            <Progress 
              value={getCompletionRate()} 
              colorScheme="brand" 
              size="sm" 
              borderRadius="full"
              bg="brand.50"
            />
          </Box>
        </VStack>

        {/* Vehicle Information */}
        <VStack align="start" spacing={3} mb={4}>
          <HStack spacing={2}>
            <Icon as={FaCar} color="brand.500" boxSize={5} />
            <Text fontWeight="semibold" color="gray.700">
              Vehicle Information
            </Text>
          </HStack>
          
          <SimpleGrid columns={3} spacing={4} w="100%">
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>Vehicle</Text>
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {vehicleInfo}
              </Text>
            </Box>
            
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>Color</Text>
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {vehicleColor}
              </Text>
            </Box>
            
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>Year</Text>
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {vehicleYear}
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>

        {/* Details Toggle */}
        <Button
          variant="ghost"
          size="sm"
          w="100%"
          onClick={() => setShowDetails(!showDetails)}
          mb={showDetails ? 4 : 0}
          color="brand.500"
          _hover={{ bg: 'brand.50' }}
        >
          <HStack spacing={2}>
            <Icon as={showDetails ? FaChevronUp : FaChevronDown} />
            <Text fontSize="sm" fontWeight="medium">
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Text>
          </HStack>
        </Button>

        {/* Detailed Information */}
        <Collapse in={showDetails}>
          <Box
            bg="gray.50"
            borderRadius="lg"
            p={4}
            borderWidth="1px"
            borderColor="gray.200"
          >
            <VStack spacing={3} align="stretch">
              <HStack>
                <Icon as={FaEnvelope} color="gray.500" boxSize={4} />
                <Text fontSize="sm" color="gray.600">
                  <Text as="span" fontWeight="medium">Email:</Text> {driverEmail}
                </Text>
              </HStack>
              
              {driver.approved_at && (
                <HStack>
                  <Icon as={FaCheckCircle} color="green.500" boxSize={4} />
                  <Text fontSize="sm" color="gray.600">
                    <Text as="span" fontWeight="medium">Approved:</Text> {formatDate(driver.approved_at)}
                  </Text>
                </HStack>
              )}
              
              {driver.last_active && (
                <HStack>
                  <Icon as={FaClock} color="blue.500" boxSize={4} />
                  <Text fontSize="sm" color="gray.600">
                    <Text as="span" fontWeight="medium">Last Active:</Text> {formatDate(driver.last_active)}
                  </Text>
                </HStack>
              )}
              
              {isSuspended && driver.suspension_reason && (
                <HStack align="flex-start">
                  <Icon as={FaCircle} color="red.500" boxSize={4} mt={1} />
                  <Text fontSize="sm" color="red.600" fontStyle="italic">
                    <Text as="span" fontWeight="medium">Suspension Reason:</Text> {driver.suspension_reason}
                  </Text>
                </HStack>
              )}
              
              {isSuspended && driver.suspended_at && (
                <HStack>
                  <Icon as={FaCalendar} color="red.500" boxSize={4} />
                  <Text fontSize="sm" color="red.600">
                    <Text as="span" fontWeight="medium">Suspended On:</Text> {formatDate(driver.suspended_at)}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>
        </Collapse>
      </CardBody>

      {/* Action Buttons */}
      <CardFooter pt={0}>
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} w="100%">
          {!isSuspended ? (
            <Button
              leftIcon={<FaPauseCircle />}
              colorScheme="red"
              variant="solid"
              flex={1}
              onClick={handleSuspend}
              borderRadius="lg"
              size="md"
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: 'md',
              }}
            >
              Suspend
            </Button>
          ) : (
            <Button
              leftIcon={<FaPlayCircle />}
              colorScheme="green"
              variant="solid"
              flex={1}
              onClick={handleActivate}
              borderRadius="lg"
              size="md"
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: 'md',
              }}
            >
              Activate
            </Button>
          )}
          
          <Button
            leftIcon={<FaEye />}
            variant="outline"
            colorScheme="brand"
            flex={1}
            onClick={() => setShowDetails(!showDetails)}
            borderRadius="lg"
            size="md"
            _hover={{
              bg: 'brand.50',
              transform: 'translateY(-1px)',
            }}
          >
            {showDetails ? 'Hide' : 'View'}
          </Button>
        </Stack>
      </CardFooter>

      {/* Suspension Modal */}
      <Modal isOpen={showSuspendModal} onClose={() => setShowSuspendModal(false)}>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl" borderWidth="1px" borderColor="gray.200">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.200">
            Suspend Driver
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Suspending: <strong style={{ color: '#333' }}>{driverName}</strong>
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Please provide a reason for suspension (optional):
              </Text>
              <Textarea
                placeholder="Enter reason for suspension..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
                borderRadius="lg"
                borderColor="gray.300"
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px brand.500',
                }}
              />
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.200">
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setShowSuspendModal(false);
                setSuspensionReason('');
              }}
              borderRadius="lg"
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmSuspend}
              borderRadius="lg"
            >
              Confirm Suspend
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}