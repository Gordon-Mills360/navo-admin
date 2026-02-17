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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
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
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaUserCheck,
  FaUserTimes,
  FaBan,
  FaRedo,
  FaEye,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaCar,
  FaIdCard,
  FaStar,
  FaChartLine,
  FaEllipsisV,
  FaPlus,
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserManagement } from '../../../hooks/useUserManagement';
import { supabase } from '../../../services/supabase';
import Layout from '../../../components/layout/Layout';
import DataTable from '../../../components/shared/DataTable';

const Drivers = () => {
  const { admin } = useAuth();
  const { approveDriver, rejectDriver, suspendDriver, reinstateDriver } = useUserManagement();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSuspendOpen, onOpen: onSuspendOpen, onClose: onSuspendClose } = useDisclosure();
  const [suspendReason, setSuspendReason] = useState('');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles!inner (email, phone, avatar_url, created_at),
          vehicle:vehicles (model, color, license_plate, year),
          verifications:driver_documents (document_type, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDrivers(data || []);
      setFilteredDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    
    const subscription = supabase
      .channel('drivers_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetchDrivers)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let filtered = drivers;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.profile?.phone?.includes(searchTerm) ||
        driver.vehicle?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(driver => driver.status === statusFilter);
    }
    
    setFilteredDrivers(filtered);
  }, [drivers, searchTerm, statusFilter]);

  const handleViewDriver = (driver) => {
    setSelectedDriver(driver);
    onOpen();
  };

  const handleApprove = async (driver) => {
    if (window.confirm(`Approve driver ${driver.full_name}?`)) {
      await approveDriver(driver.id, { adminId: admin.id });
      fetchDrivers();
    }
  };

  const handleReject = async (driver) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      await rejectDriver(driver.id, reason, admin.id);
      fetchDrivers();
    }
  };

  const handleSuspend = async (driver) => {
    setSelectedDriver(driver);
    onSuspendOpen();
  };

  const confirmSuspend = async () => {
    if (suspendReason) {
      await suspendDriver(selectedDriver.id, suspendReason, admin.id);
      setSuspendReason('');
      onSuspendClose();
      fetchDrivers();
    }
  };

  const handleReinstate = async (driver) => {
    if (window.confirm(`Reinstate driver ${driver.full_name}?`)) {
      await reinstateDriver(driver.id, 'Reinstated by admin', admin.id);
      fetchDrivers();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending_approval': return 'orange';
      case 'rejected': return 'red';
      case 'suspended': return 'red';
      case 'banned': return 'red';
      case 'online': return 'green';
      case 'offline': return 'gray';
      default: return 'gray';
    }
  };

  const getVerificationStatus = (driver) => {
    const verifications = driver.verifications || [];
    const pending = verifications.filter(v => v.status === 'pending').length;
    const verified = verifications.filter(v => v.status === 'verified').length;
    
    if (verified === verifications.length) return 'verified';
    if (pending > 0) return 'pending';
    return 'incomplete';
  };

  const columns = [
    {
      key: 'driver',
      header: 'Driver',
      render: (value, driver) => (
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={driver.full_name}
            src={driver.profile?.avatar_url}
            bg="brand.500"
          />
          <Box>
            <Text fontWeight="medium" fontSize="sm">
              {driver.full_name || 'Unknown'}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {driver.profile?.email}
            </Text>
          </Box>
        </HStack>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (value, driver) => (
        <Box>
          <Text fontSize="sm">
            {driver.vehicle?.model || 'N/A'}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {driver.vehicle?.license_plate || 'No plate'}
          </Text>
        </Box>
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
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (value) => (
        <HStack spacing={1}>
          <FaStar color="#F6AD55" size={12} />
          <Text fontSize="sm" fontWeight="medium">
            {value?.toFixed(1) || 'N/A'}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'trips',
      header: 'Trips',
      render: (value) => (
        <Text fontSize="sm" fontWeight="medium">
          {value || 0}
        </Text>
      ),
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (value, driver) => {
        const status = getVerificationStatus(driver);
        return (
          <Badge
            colorScheme={status === 'verified' ? 'green' : status === 'pending' ? 'orange' : 'red'}
            variant="subtle"
            fontSize="xs"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value, driver) => (
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
              onClick={() => handleViewDriver(driver)}
            >
              View Details
            </MenuItem>
            {driver.status === 'pending_approval' && (
              <>
                <MenuItem
                  icon={<FaUserCheck />}
                  colorScheme="green"
                  onClick={() => handleApprove(driver)}
                >
                  Approve
                </MenuItem>
                <MenuItem
                  icon={<FaUserTimes />}
                  colorScheme="red"
                  onClick={() => handleReject(driver)}
                >
                  Reject
                </MenuItem>
              </>
            )}
            {driver.status === 'approved' && (
              <MenuItem
                icon={<FaBan />}
                colorScheme="red"
                onClick={() => handleSuspend(driver)}
              >
                Suspend
              </MenuItem>
            )}
            {driver.status === 'suspended' && (
              <MenuItem
                icon={<FaRedo />}
                colorScheme="green"
                onClick={() => handleReinstate(driver)}
              >
                Reinstate
              </MenuItem>
            )}
            <MenuItem
              icon={<FaPhone />}
              onClick={() => alert(`Calling ${driver.profile?.phone}`)}
            >
              Call Driver
            </MenuItem>
          </MenuList>
        </Menu>
      ),
    },
  ];

  const stats = {
    total: drivers.length,
    approved: drivers.filter(d => d.status === 'approved').length,
    pending: drivers.filter(d => d.status === 'pending_approval').length,
    online: drivers.filter(d => d.status === 'online').length,
    suspended: drivers.filter(d => d.status === 'suspended').length,
  };

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Driver Management
            </Heading>
            <Text color="gray.600" mt={1}>
              Manage driver accounts, verifications, and status
            </Text>
          </Box>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="brand"
            size="sm"
            onClick={() => window.location.href = '/accounts/drivers/create'}
          >
            Add Driver
          </Button>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} spacing={4}>
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
            <Text fontSize="sm" color="gray.600">Total Drivers</Text>
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
              {stats.approved}
            </Text>
            <Text fontSize="sm" color="gray.600">Approved</Text>
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
              {stats.pending}
            </Text>
            <Text fontSize="sm" color="gray.600">Pending</Text>
          </Box>
          
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {stats.online}
            </Text>
            <Text fontSize="sm" color="gray.600">Online</Text>
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
        </SimpleGrid>

        {/* Filters */}
        <Flex gap={4} wrap="wrap">
          <InputGroup flex={1} minW="300px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search drivers by name, email, phone, or license plate..."
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
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
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

        {/* Drivers Table */}
        <Box
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <DataTable
            columns={columns}
            data={filteredDrivers}
            isLoading={loading}
            searchable={false}
            pagination={true}
            pageSize={10}
          />
        </Box>
      </VStack>

      {/* Driver Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Driver Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDriver && (
              <VStack spacing={6} align="stretch">
                {/* Profile Header */}
                <Flex align="center" gap={4}>
                  <Avatar
                    size="xl"
                    name={selectedDriver.full_name}
                    src={selectedDriver.profile?.avatar_url}
                    bg="brand.500"
                  />
                  <Box flex={1}>
                    <Heading size="lg">{selectedDriver.full_name}</Heading>
                    <Text color="gray.600">{selectedDriver.profile?.email}</Text>
                    <HStack spacing={3} mt={2}>
                      <Badge
                        colorScheme={getStatusColor(selectedDriver.status)}
                        variant="subtle"
                        fontSize="sm"
                        px={3}
                        py={1}
                      >
                        {selectedDriver.status.replace('_', ' ')}
                      </Badge>
                      <HStack spacing={1}>
                        <FaStar color="#F6AD55" />
                        <Text fontWeight="medium">{selectedDriver.rating?.toFixed(1) || 'N/A'}</Text>
                      </HStack>
                    </HStack>
                  </Box>
                </Flex>

                <Tabs>
                  <TabList>
                    <Tab>Information</Tab>
                    <Tab>Vehicle</Tab>
                    <Tab>Documents</Tab>
                    <Tab>Activity</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Phone Number
                          </Text>
                          <Text fontWeight="medium">
                            {selectedDriver.profile?.phone || 'Not provided'}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Joined Date
                          </Text>
                          <Text fontWeight="medium">
                            {new Date(selectedDriver.profile?.created_at).toLocaleDateString()}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Total Trips
                          </Text>
                          <Text fontWeight="medium">
                            {selectedDriver.total_trips || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Completion Rate
                          </Text>
                          <Text fontWeight="medium">
                            {selectedDriver.completion_rate || 0}%
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </TabPanel>

                    <TabPanel>
                      {selectedDriver.vehicle ? (
                        <SimpleGrid columns={2} spacing={4}>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>
                              Vehicle Model
                            </Text>
                            <Text fontWeight="medium">
                              {selectedDriver.vehicle.model}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>
                              License Plate
                            </Text>
                            <Text fontWeight="medium">
                              {selectedDriver.vehicle.license_plate}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>
                              Color
                            </Text>
                            <Text fontWeight="medium">
                              {selectedDriver.vehicle.color}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>
                              Year
                            </Text>
                            <Text fontWeight="medium">
                              {selectedDriver.vehicle.year}
                            </Text>
                          </Box>
                        </SimpleGrid>
                      ) : (
                        <Text color="gray.500">No vehicle information</Text>
                      )}
                    </TabPanel>

                    <TabPanel>
                      {selectedDriver.verifications?.length > 0 ? (
                        <VStack spacing={3} align="stretch">
                          {selectedDriver.verifications.map((doc) => (
                            <Flex
                              key={doc.id}
                              justify="space-between"
                              align="center"
                              p={3}
                              borderRadius="lg"
                              borderWidth="1px"
                              borderColor="gray.200"
                            >
                              <Box>
                                <Text fontWeight="medium">
                                  {doc.document_type.replace('_', ' ')}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                                </Text>
                              </Box>
                              <Badge
                                colorScheme={doc.status === 'verified' ? 'green' : doc.status === 'pending' ? 'orange' : 'red'}
                                variant="subtle"
                              >
                                {doc.status}
                              </Badge>
                            </Flex>
                          ))}
                        </VStack>
                      ) : (
                        <Text color="gray.500">No documents uploaded</Text>
                      )}
                    </TabPanel>

                    <TabPanel>
                      <Text color="gray.500">Activity data will appear here</Text>
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
          <ModalHeader>Suspend Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Reason for Suspension</FormLabel>
              <Textarea
                placeholder="Enter reason for suspending this driver..."
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
              Suspend Driver
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Drivers;