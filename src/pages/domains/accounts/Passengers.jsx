import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Flex,
  useColorModeValue,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Avatar,
  Progress,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaUser,
  FaUserTimes,
  FaBan,
  FaRedo,
  FaEye,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaChartLine,
  FaEllipsisV,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserManagement } from '../../../hooks/useUserManagement';
import { supabase } from '../../../services/supabase';
import Layout from '../../../components/layout/Layout';
import DataTable from '../../../components/shared/DataTable';

const Passengers = () => {
  const { admin } = useAuth();
  const { suspendPassenger, reinstatePassenger, banUser } = useUserManagement();
  const [passengers, setPassengers] = useState([]);
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSuspendOpen, onOpen: onSuspendOpen, onClose: onSuspendClose } = useDisclosure();
  const [suspendReason, setSuspendReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const { isOpen: isBanOpen, onOpen: onBanOpen, onClose: onBanClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchPassengers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          passenger:passengers!inner (*),
          trips:trips (id, status),
          payments:payments (amount, status)
        `)
        .eq('role', 'passenger')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include passenger-specific info
      const transformedData = data.map(profile => ({
        ...profile,
        ...profile.passenger,
        total_trips: profile.trips?.length || 0,
        total_spent: profile.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        completed_trips: profile.trips?.filter(t => t.status === 'completed').length || 0,
      }));
      
      setPassengers(transformedData);
      setFilteredPassengers(transformedData);
    } catch (error) {
      console.error('Error fetching passengers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassengers();
    
    const subscription = supabase
      .channel('passengers_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchPassengers)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let filtered = passengers;
    
    if (searchTerm) {
      filtered = filtered.filter(passenger =>
        passenger.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        passenger.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        passenger.phone?.includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(passenger => passenger.status === statusFilter);
    }
    
    setFilteredPassengers(filtered);
  }, [passengers, searchTerm, statusFilter]);

  const handleViewPassenger = (passenger) => {
    setSelectedPassenger(passenger);
    onOpen();
  };

  const handleSuspend = async (passenger) => {
    setSelectedPassenger(passenger);
    onSuspendOpen();
  };

  const confirmSuspend = async () => {
    if (suspendReason && selectedPassenger) {
      await suspendPassenger(selectedPassenger.id, suspendReason, admin.id);
      setSuspendReason('');
      onSuspendClose();
      fetchPassengers();
    }
  };

  const handleReinstate = async (passenger) => {
    if (window.confirm(`Reinstate passenger ${passenger.full_name}?`)) {
      await reinstatePassenger(passenger.id, 'Reinstated by admin', admin.id);
      fetchPassengers();
    }
  };

  const handleBan = async (passenger) => {
    setSelectedPassenger(passenger);
    onBanOpen();
  };

  const confirmBan = async () => {
    if (banReason && selectedPassenger) {
      await banUser(selectedPassenger.id, 'passenger', banReason, admin.id);
      setBanReason('');
      onBanClose();
      fetchPassengers();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'suspended': return 'red';
      case 'banned': return 'red';
      case 'restricted': return 'orange';
      default: return 'gray';
    }
  };

  const getRiskLevel = (passenger) => {
    const cancelRate = passenger.cancellation_rate || 0;
    const complaints = passenger.complaint_count || 0;
    
    if (cancelRate > 30 || complaints > 5) return 'high';
    if (cancelRate > 15 || complaints > 2) return 'medium';
    return 'low';
  };

  const columns = [
    {
      key: 'passenger',
      header: 'Passenger',
      render: (value, passenger) => (
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={passenger.full_name}
            src={passenger.avatar_url}
            bg="green.500"
          />
          <Box>
            <Text fontWeight="medium" fontSize="sm">
              {passenger.full_name || 'Unknown'}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {passenger.email}
            </Text>
          </Box>
        </HStack>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => (
        <Text fontSize="sm">
          {value || 'Not provided'}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge
          colorScheme={getStatusColor(value)}
          variant="subtle"
          fontSize="xs"
          borderRadius="full"
          px={3}
          py={1}
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'total_trips',
      header: 'Trips',
      render: (value) => (
        <Text fontSize="sm" fontWeight="medium">
          {value}
        </Text>
      ),
    },
    {
      key: 'total_spent',
      header: 'Total Spent',
      render: (value) => (
        <Text fontSize="sm" fontWeight="medium">
          ${(value || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      key: 'risk',
      header: 'Risk Level',
      render: (value, passenger) => {
        const risk = getRiskLevel(passenger);
        return (
          <Badge
            colorScheme={risk === 'high' ? 'red' : risk === 'medium' ? 'orange' : 'green'}
            variant="subtle"
            fontSize="xs"
          >
            {risk.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value, passenger) => (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            size="sm"
            variant="ghost"
          />
          <MenuList minW="180px">
            <MenuItem
              icon={<FaEye />}
              onClick={() => handleViewPassenger(passenger)}
            >
              View Details
            </MenuItem>
            {passenger.status === 'active' && (
              <MenuItem
                icon={<FaUserTimes />}
                colorScheme="orange"
                onClick={() => handleSuspend(passenger)}
              >
                Suspend
              </MenuItem>
            )}
            {passenger.status === 'suspended' && (
              <MenuItem
                icon={<FaRedo />}
                colorScheme="green"
                onClick={() => handleReinstate(passenger)}
              >
                Reinstate
              </MenuItem>
            )}
            <MenuItem
              icon={<FaBan />}
              colorScheme="red"
              onClick={() => handleBan(passenger)}
            >
              Ban Permanently
            </MenuItem>
            <MenuItem
              icon={<FaPhone />}
              onClick={() => alert(`Calling ${passenger.phone}`)}
            >
              Call Passenger
            </MenuItem>
            <MenuItem
              icon={<FaEnvelope />}
              onClick={() => window.location.href = `mailto:${passenger.email}`}
            >
              Send Email
            </MenuItem>
          </MenuList>
        </Menu>
      ),
    },
  ];

  const stats = {
    total: passengers.length,
    active: passengers.filter(p => p.status === 'active').length,
    suspended: passengers.filter(p => p.status === 'suspended').length,
    highRisk: passengers.filter(p => getRiskLevel(p) === 'high').length,
    vip: passengers.filter(p => p.total_spent > 1000).length,
  };

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Passenger Management
            </Heading>
            <Text color="gray.600" mt={1}>
              Manage passenger accounts, safety, and behavior
            </Text>
          </Box>
          <Button
            leftIcon={<FaChartLine />}
            colorScheme="brand"
            size="sm"
            onClick={() => window.location.href = '/analytics/passengers'}
          >
            Analytics
          </Button>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              {stats.total}
            </Text>
            <Text fontSize="sm" color="gray.600">Total Passengers</Text>
          </Box>
          
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {stats.active}
            </Text>
            <Text fontSize="sm" color="gray.600">Active</Text>
          </Box>
          
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="red.600">
              {stats.suspended}
            </Text>
            <Text fontSize="sm" color="gray.600">Suspended</Text>
          </Box>
          
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="orange.600">
              {stats.highRisk}
            </Text>
            <Text fontSize="sm" color="gray.600">High Risk</Text>
          </Box>
          
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="purple.600">
              {stats.vip}
            </Text>
            <Text fontSize="sm" color="gray.600">VIP Passengers</Text>
          </Box>
        </SimpleGrid>

        {/* High Risk Alert */}
        {stats.highRisk > 0 && (
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>High Risk Passengers Detected</AlertTitle>
              <AlertDescription>
                {stats.highRisk} passengers have high cancellation rates or multiple complaints
              </AlertDescription>
            </Box>
            <Button size="sm" colorScheme="orange" variant="outline">
              Review Now
            </Button>
          </Alert>
        )}

        {/* Filters */}
        <Flex gap={4} wrap="wrap">
          <InputGroup flex={1} minW="300px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search passengers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
            />
          </InputGroup>
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            width="200px"
            borderRadius="lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="restricted">Restricted</option>
          </Select>
          
          <Button
            leftIcon={<FaFilter />}
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </Flex>

        {/* Passengers Table */}
        <Box
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <DataTable
            columns={columns}
            data={filteredPassengers}
            isLoading={loading}
            searchable={false}
            pagination={true}
            pageSize={10}
          />
        </Box>
      </VStack>

      {/* Passenger Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Passenger Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPassenger && (
              <VStack spacing={6} align="stretch">
                {/* Profile Header */}
                <Flex align="center" gap={4}>
                  <Avatar
                    size="xl"
                    name={selectedPassenger.full_name}
                    src={selectedPassenger.avatar_url}
                    bg="green.500"
                  />
                  <Box flex={1}>
                    <Heading size="lg">{selectedPassenger.full_name}</Heading>
                    <Text color="gray.600">{selectedPassenger.email}</Text>
                    <HStack spacing={3} mt={2}>
                      <Badge
                        colorScheme={getStatusColor(selectedPassenger.status)}
                        variant="subtle"
                        fontSize="sm"
                        px={3}
                        py={1}
                      >
                        {selectedPassenger.status}
                      </Badge>
                      <Badge
                        colorScheme={getRiskLevel(selectedPassenger) === 'high' ? 'red' : getRiskLevel(selectedPassenger) === 'medium' ? 'orange' : 'green'}
                        variant="subtle"
                        fontSize="sm"
                        px={3}
                        py={1}
                      >
                        {getRiskLevel(selectedPassenger).toUpperCase()} RISK
                      </Badge>
                    </HStack>
                  </Box>
                </Flex>

                <Tabs>
                  <TabList>
                    <Tab>Information</Tab>
                    <Tab>Trips History</Tab>
                    <Tab>Payments</Tab>
                    <Tab>Safety</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Phone Number
                          </Text>
                          <Text fontWeight="medium">
                            {selectedPassenger.phone || 'Not provided'}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Joined Date
                          </Text>
                          <Text fontWeight="medium">
                            {new Date(selectedPassenger.created_at).toLocaleDateString()}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Total Trips
                          </Text>
                          <Text fontWeight="medium">
                            {selectedPassenger.total_trips || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Total Spent
                          </Text>
                          <Text fontWeight="medium">
                            ${(selectedPassenger.total_spent || 0).toFixed(2)}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Avg Rating
                          </Text>
                          <HStack spacing={1}>
                            <FaStar color="#F6AD55" />
                            <Text fontWeight="medium">
                              {selectedPassenger.rating?.toFixed(1) || 'N/A'}
                            </Text>
                          </HStack>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Cancellation Rate
                          </Text>
                          <Text fontWeight="medium">
                            {selectedPassenger.cancellation_rate || 0}%
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </TabPanel>

                    <TabPanel>
                      <Text color="gray.500">Trip history will appear here</Text>
                    </TabPanel>

                    <TabPanel>
                      <Text color="gray.500">Payment history will appear here</Text>
                    </TabPanel>

                    <TabPanel>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Complaints Received
                          </Text>
                          <Text fontWeight="medium" color="red.600">
                            {selectedPassenger.complaint_count || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Emergency Triggers
                          </Text>
                          <Text fontWeight="medium" color="orange.600">
                            {selectedPassenger.emergency_count || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Last Safety Review
                          </Text>
                          <Text fontWeight="medium">
                            {selectedPassenger.last_safety_review || 'Never'}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Trust Score
                          </Text>
                          <Progress
                            value={selectedPassenger.trust_score || 100}
                            colorScheme={selectedPassenger.trust_score > 80 ? 'green' : selectedPassenger.trust_score > 60 ? 'orange' : 'red'}
                            size="sm"
                            borderRadius="full"
                          />
                        </Box>
                      </SimpleGrid>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="brand" onClick={onClose}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Suspend Modal */}
      <Modal isOpen={isSuspendOpen} onClose={onSuspendClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Suspend Passenger</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Reason for Suspension</FormLabel>
              <Textarea
                placeholder="Enter reason for suspending this passenger..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                minH="100px"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSuspendClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmSuspend}>
              Suspend Passenger
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ban Modal */}
      <Modal isOpen={isBanOpen} onClose={onBanClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ban Passenger Permanently</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="error" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Warning: Permanent Action</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. The passenger will be permanently banned from the platform.
                </AlertDescription>
              </Box>
            </Alert>
            <FormControl>
              <FormLabel>Reason for Permanent Ban</FormLabel>
              <Textarea
                placeholder="Enter detailed reason for permanent ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                minH="100px"
                required
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBanClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmBan}>
              Ban Permanently
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Passengers;