import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  IconButton,
  Badge,
  HStack,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  useToast,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Avatar,
  Divider,
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Image,
  Wrap,
  WrapItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RepeatIcon,
  CheckIcon,
  CloseIcon,
  TimeIcon,
  EyeIcon,
  AttachmentIcon,
  ChatIcon,
  ChevronRightIcon,
  CalendarIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { FaGavel, FaMoneyBillWave, FaExclamationTriangle, FaUser, FaCar } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useFinance from '../../../hooks/useFinance';
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const Disputes = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { getDisputes, resolveDispute, getDisputeStats } = useFinance();
  
  const toast = useToast();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  const { 
    isOpen: isResolveOpen, 
    onOpen: onResolveOpen, 
    onClose: onResolveClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });
  const [resolveForm, setResolveForm] = useState({
    decision: '',
    refund_amount: '',
    notes: '',
    penalty: 'none',
  });

  // Fetch disputes data
  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: searchQuery || undefined,
      };
      
      const { data, error: fetchError } = await getDisputes(filters);
      
      if (fetchError) throw fetchError;
      
      setDisputes(data || []);
      
      // Fetch stats
      const { data: statsData } = await getDisputeStats();
      setStats(statsData);
      
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError('Failed to load disputes data');
      toast({
        title: 'Error',
        description: 'Failed to load disputes data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getDisputes, getDisputeStats, statusFilter, typeFilter, searchQuery, toast]);

  // Initial fetch
  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Handle dispute resolution
  const handleResolveDispute = async () => {
    if (!resolveForm.decision) {
      toast({
        title: 'Decision required',
        description: 'Please select a resolution decision',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await resolveDispute(
        selectedDispute.id,
        resolveForm.decision,
        resolveForm.refund_amount ? parseFloat(resolveForm.refund_amount) : null,
        resolveForm.notes,
        resolveForm.penalty
      );
      
      if (error) throw error;
      
      toast({
        title: 'Dispute resolved',
        description: `Dispute has been resolved as ${resolveForm.decision}`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh data
      fetchDisputes();
      onResolveClose();
      setSelectedDispute(null);
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'resolve_dispute',
        resource_type: 'dispute',
        resource_id: selectedDispute.id,
        details: { 
          dispute_id: selectedDispute.dispute_code,
          decision: resolveForm.decision,
          refund_amount: resolveForm.refund_amount,
          notes: resolveForm.notes 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to resolve dispute',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (dispute) => {
    setSelectedDispute(dispute);
    onDetailOpen();
  };

  // Handle open resolve modal
  const handleOpenResolve = (dispute) => {
    setSelectedDispute(dispute);
    setResolveForm({
      decision: '',
      refund_amount: dispute.amount?.toString() || '',
      notes: '',
      penalty: 'none',
    });
    onResolveOpen();
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle export
  const handleExport = () => {
    toast({
      title: 'Exporting disputes',
      description: 'Dispute data will be exported to CSV',
      status: 'info',
      duration: 3000,
    });
  };

  // Filtered disputes
  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = searchQuery === '' || 
      dispute.dispute_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.trip_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Table columns configuration
  const columns = [
    {
      header: 'Dispute ID',
      accessor: 'dispute_code',
      cell: (row) => (
        <Text fontWeight="medium" fontFamily="mono">
          #{row.dispute_code}
        </Text>
      ),
    },
    {
      header: 'User',
      accessor: 'user',
      cell: (row) => (
        <HStack>
          <Avatar
            size="sm"
            name={row.user_name}
            src={row.user_profile_picture}
          />
          <Box>
            <Text fontWeight="medium">{row.user_name}</Text>
            <Text fontSize="xs" color="gray.500">
              {row.user_type === 'driver' ? 'Driver' : 'Passenger'}
            </Text>
          </Box>
        </HStack>
      ),
    },
    {
      header: 'Trip',
      accessor: 'trip',
      cell: (row) => (
        <VStack align="start" spacing={0}>
          <Text fontSize="sm">#{row.trip_code}</Text>
          <Text fontSize="xs" color="gray.500">
            {new Date(row.trip_date).toLocaleDateString()}
          </Text>
        </VStack>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => (
        <Text fontWeight="bold" color="orange.600">
          ${row.amount?.toFixed(2)}
        </Text>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => {
        let colorScheme = 'gray';
        let icon = <FaExclamationTriangle />;
        
        switch(row.type) {
          case 'overcharge':
            colorScheme = 'red';
            break;
          case 'service_quality':
            colorScheme = 'yellow';
            break;
          case 'cancellation':
            colorScheme = 'orange';
            break;
          case 'safety':
            colorScheme = 'purple';
            break;
          case 'other':
            colorScheme = 'gray';
            break;
        }
        
        return (
          <Badge colorScheme={colorScheme} textTransform="capitalize">
            {row.type?.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        let colorScheme = 'gray';
        let icon = <TimeIcon />;
        
        switch(row.status) {
          case 'open':
            colorScheme = 'yellow';
            icon = <TimeIcon />;
            break;
          case 'under_review':
            colorScheme = 'blue';
            icon = <EyeIcon />;
            break;
          case 'resolved':
            colorScheme = 'green';
            icon = <CheckIcon />;
            break;
          case 'closed':
            colorScheme = 'gray';
            icon = <CloseIcon />;
            break;
          case 'escalated':
            colorScheme = 'red';
            icon = <WarningIcon />;
            break;
        }
        
        return (
          <Badge colorScheme={colorScheme} display="flex" alignItems="center" gap={1} w="fit-content">
            {icon}
            {row.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Created',
      accessor: 'created_at',
      cell: (row) => (
        <Text fontSize="sm">
          {new Date(row.created_at).toLocaleDateString()}
        </Text>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <HStack spacing={1}>
          <Tooltip label="View Details">
            <IconButton
              icon={<EyeIcon />}
              size="sm"
              variant="ghost"
              onClick={() => handleViewDetails(row)}
            />
          </Tooltip>
          {row.status === 'open' || row.status === 'under_review' ? (
            hasPermission('dispute', 'resolve') && (
              <Tooltip label="Resolve Dispute">
                <IconButton
                  icon={<FaGavel />}
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  onClick={() => handleOpenResolve(row)}
                />
              </Tooltip>
            )
          ) : null}
        </HStack>
      ),
    },
  ];

  // Stats cards
  const renderStatsCards = () => (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Open Disputes</StatLabel>
            <StatNumber color="yellow.600">
              {stats?.open_count || 0}
            </StatNumber>
            <StatHelpText>
              ${stats?.open_amount?.toFixed(2) || '0.00'} at stake
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Under Review</StatLabel>
            <StatNumber color="blue.600">
              {stats?.review_count || 0}
            </StatNumber>
            <StatHelpText>
              {stats?.avg_review_time || 0} hours avg
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Resolved Today</StatLabel>
            <StatNumber color="green.600">
              {stats?.today_resolved || 0}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              12% from yesterday
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Avg. Resolution Time</StatLabel>
            <StatNumber>{stats?.avg_resolution_hours || 0}h</StatNumber>
            <StatHelpText>
            
              less than 48 hours{"< 10 min"}&lt; 48 hours
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  if (loading && disputes.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading disputes data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load disputes</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchDisputes} leftIcon={<RepeatIcon />}>
            Retry
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Payment Disputes</Heading>
          <Text color="gray.600" mt={1}>
            Review and resolve payment disputes and refund requests
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchDisputes}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={handleExport}
          >
            Export
          </Button>
        </HStack>
      </Flex>

      {renderStatsCards()}

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Search</FormLabel>
              <InputGroup size="sm">
                <InputLeftAddon>
                  <SearchIcon />
                </InputLeftAddon>
                <Input
                  placeholder="Search by ID, user, or trip"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Status</FormLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="escalated">Escalated</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Dispute Type</FormLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Types</option>
                <option value="overcharge">Overcharge</option>
                <option value="service_quality">Service Quality</option>
                <option value="cancellation">Cancellation</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Amount Range</FormLabel>
              <HStack>
                <Input
                  placeholder="Min"
                  size="sm"
                />
                <Text fontSize="sm">to</Text>
                <Input
                  placeholder="Max"
                  size="sm"
                />
              </HStack>
            </FormControl>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Open ({stats?.open_count || 0})</Tab>
          <Tab>Under Review ({stats?.review_count || 0})</Tab>
          <Tab>Resolved ({stats?.resolved_count || 0})</Tab>
          <Tab>All Disputes ({disputes.length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredDisputes.filter(d => d.status === 'open')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredDisputes.filter(d => d.status === 'under_review')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredDisputes.filter(d => d.status === 'resolved')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredDisputes}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <FaGavel />
                <Text>Dispute #{selectedDispute.dispute_code}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Status Banner */}
                <Alert 
                  status={
                    selectedDispute.status === 'open' ? 'warning' :
                    selectedDispute.status === 'under_review' ? 'info' :
                    selectedDispute.status === 'resolved' ? 'success' : 'error'
                  }
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle textTransform="capitalize">
                      {selectedDispute.status.replace('_', ' ')}
                    </AlertTitle>
                    <AlertDescription>
                      {selectedDispute.status_message || 'No additional information'}
                    </AlertDescription>
                  </Box>
                </Alert>

                {/* Basic Information */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Dispute Amount
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                      ${selectedDispute.amount?.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Dispute Type
                    </Text>
                    <Badge 
                      colorScheme={
                        selectedDispute.type === 'overcharge' ? 'red' :
                        selectedDispute.type === 'service_quality' ? 'yellow' :
                        selectedDispute.type === 'cancellation' ? 'orange' :
                        selectedDispute.type === 'safety' ? 'purple' : 'gray'
                      }
                      fontSize="md"
                      px={3}
                      py={1}
                      textTransform="capitalize"
                    >
                      {selectedDispute.type?.replace('_', ' ')}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Created Date
                    </Text>
                    <Text>
                      {new Date(selectedDispute.created_at).toLocaleString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Last Updated
                    </Text>
                    <Text>
                      {new Date(selectedDispute.updated_at).toLocaleString()}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* User Information */}
                <Card>
                  <CardHeader pb={2}>
                    <Heading size="sm">Complainant Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <HStack spacing={4}>
                      <Avatar
                        size="lg"
                        name={selectedDispute.user_name}
                        src={selectedDispute.user_profile_picture}
                      />
                      <Box flex={1}>
                        <Text fontWeight="bold">{selectedDispute.user_name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {selectedDispute.user_type === 'driver' ? 'Driver' : 'Passenger'} • {selectedDispute.user_id}
                        </Text>
                        <Text fontSize="sm">Email: {selectedDispute.user_email}</Text>
                        <Text fontSize="sm">Phone: {selectedDispute.user_phone}</Text>
                      </Box>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = selectedDispute.user_type === 'driver' 
                            ? `/accounts/driver/${selectedDispute.user_id}`
                            : `/accounts/passenger/${selectedDispute.user_id}`;
                          window.open(url, '_blank');
                        }}
                      >
                        View Profile
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Trip Information */}
                <Card>
                  <CardHeader pb={2}>
                    <Heading size="sm">Trip Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trip Code</Text>
                        <Text fontWeight="medium">#{selectedDispute.trip_code}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trip Date</Text>
                        <Text>{new Date(selectedDispute.trip_date).toLocaleString()}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Driver</Text>
                        <Text>{selectedDispute.driver_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Vehicle</Text>
                        <Text>{selectedDispute.vehicle_plate}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Pickup Location</Text>
                        <Text>{selectedDispute.pickup_location}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Dropoff Location</Text>
                        <Text>{selectedDispute.dropoff_location}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trip Fare</Text>
                        <Text fontWeight="bold">${selectedDispute.trip_fare?.toFixed(2)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trip Status</Text>
                        <Badge colorScheme={
                          selectedDispute.trip_status === 'completed' ? 'green' :
                          selectedDispute.trip_status === 'cancelled' ? 'red' : 'blue'
                        }>
                          {selectedDispute.trip_status}
                        </Badge>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Dispute Details */}
                <Accordion allowToggle>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Heading size="sm">Dispute Details & Evidence</Heading>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={4}>
                        {/* User's Complaint */}
                        <Box>
                          <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                            User's Complaint
                          </Text>
                          <Card variant="outline">
                            <CardBody>
                              <Text whiteSpace="pre-wrap">{selectedDispute.description}</Text>
                            </CardBody>
                          </Card>
                        </Box>

                        {/* Evidence */}
                        {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                          <Box>
                            <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                              Submitted Evidence
                            </Text>
                            <Wrap spacing={4}>
                              {selectedDispute.evidence.map((evidence, idx) => (
                                <WrapItem key={idx}>
                                  <Card width="200px">
                                    <CardBody>
                                      <VStack spacing={2}>
                                        {evidence.type === 'image' ? (
                                          <Image
                                            src={evidence.url}
                                            alt="Evidence"
                                            borderRadius="md"
                                            height="100px"
                                            objectFit="cover"
                                          />
                                        ) : (
                                          <Box
                                            width="100%"
                                            height="100px"
                                            bg="gray.100"
                                            borderRadius="md"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                          >
                                            <AttachmentIcon fontSize="2xl" color="gray.400" />
                                          </Box>
                                        )}
                                        <Text fontSize="xs" color="gray.500">
                                          {evidence.type} • {new Date(evidence.uploaded_at).toLocaleDateString()}
                                        </Text>
                                      </VStack>
                                    </CardBody>
                                  </Card>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </Box>
                        )}

                        {/* Driver's Response */}
                        {selectedDispute.driver_response && (
                          <Box>
                            <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                              Driver's Response
                            </Text>
                            <Card variant="outline">
                              <CardBody>
                                <Text whiteSpace="pre-wrap">{selectedDispute.driver_response}</Text>
                                <Text fontSize="sm" color="gray.500" mt={2}>
                                  Responded: {new Date(selectedDispute.driver_response_date).toLocaleString()}
                                </Text>
                              </CardBody>
                            </Card>
                          </Box>
                        )}

                        {/* Previous Communications */}
                        {selectedDispute.communications && selectedDispute.communications.length > 0 && (
                          <Box>
                            <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                              Previous Communications
                            </Text>
                            <VStack align="stretch" spacing={2}>
                              {selectedDispute.communications.slice(0, 5).map((comm, idx) => (
                                <Card key={idx} variant="outline">
                                  <CardBody py={2}>
                                    <HStack justify="space-between">
                                      <Text fontSize="sm">{comm.message}</Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {new Date(comm.sent_at).toLocaleDateString()}
                                      </Text>
                                    </HStack>
                                  </CardBody>
                                </Card>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>

                {/* Resolution History */}
                {selectedDispute.resolution_history && selectedDispute.resolution_history.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                      Resolution History
                    </Text>
                    <Card variant="outline">
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          {selectedDispute.resolution_history.map((history, idx) => (
                            <Box key={idx} pb={2} borderBottom={idx < selectedDispute.resolution_history.length - 1 ? '1px solid' : 'none'} borderColor="gray.200">
                              <HStack justify="space-between">
                                <Text fontWeight="medium">{history.action}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  {new Date(history.date).toLocaleString()}
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color="gray.600">{history.by}</Text>
                              {history.notes && (
                                <Text fontSize="sm" fontStyle="italic" mt={1}>
                                  {history.notes}
                                </Text>
                              )}
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDetailClose}>
                Close
              </Button>
              {(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && 
               hasPermission('dispute', 'resolve') && (
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    onDetailClose();
                    handleOpenResolve(selectedDispute);
                  }}
                >
                  Resolve Dispute
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Resolve Dispute Modal */}
      {selectedDispute && (
        <Modal isOpen={isResolveOpen} onClose={onResolveClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Resolve Dispute #{selectedDispute.dispute_code}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {/* Dispute Summary */}
                <Card width="100%" variant="outline">
                  <CardBody>
                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">User</Text>
                        <Text fontWeight="medium">{selectedDispute.user_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Amount</Text>
                        <Text fontWeight="bold" color="orange.600">
                          ${selectedDispute.amount?.toFixed(2)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trip</Text>
                        <Text>#{selectedDispute.trip_code}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Type</Text>
                        <Text textTransform="capitalize">
                          {selectedDispute.type?.replace('_', ' ')}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Resolution Form */}
                <FormControl>
                  <FormLabel>Resolution Decision</FormLabel>
                  <Select
                    value={resolveForm.decision}
                    onChange={(e) => setResolveForm({...resolveForm, decision: e.target.value})}
                    required
                  >
                    <option value="">Select decision</option>
                    <option value="refund_full">Full Refund to User</option>
                    <option value="refund_partial">Partial Refund</option>
                    <option value="no_refund">No Refund - Dispute Rejected</option>
                    <option value="refund_driver">Refund to Driver</option>
                    <option value="compromise">Compromise Settlement</option>
                  </Select>
                </FormControl>

                {resolveForm.decision === 'refund_partial' || resolveForm.decision === 'compromise' ? (
                  <FormControl>
                    <FormLabel>Refund Amount</FormLabel>
                    <Input
                      type="number"
                      value={resolveForm.refund_amount}
                      onChange={(e) => setResolveForm({...resolveForm, refund_amount: e.target.value})}
                      placeholder="Enter refund amount"
                      min="0"
                      max={selectedDispute.amount}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Maximum: ${selectedDispute.amount?.toFixed(2)}
                    </Text>
                  </FormControl>
                ) : null}

                <FormControl>
                  <FormLabel>Apply Penalty</FormLabel>
                  <Select
                    value={resolveForm.penalty}
                    onChange={(e) => setResolveForm({...resolveForm, penalty: e.target.value})}
                  >
                    <option value="none">No Penalty</option>
                    <option value="warning">Warning</option>
                    <option value="suspension_1d">1-Day Suspension</option>
                    <option value="suspension_7d">7-Day Suspension</option>
                    <option value="rating_deduction">Rating Deduction</option>
                    <option value="permanent_ban">Permanent Ban</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Resolution Notes</FormLabel>
                  <Textarea
                    value={resolveForm.notes}
                    onChange={(e) => setResolveForm({...resolveForm, notes: e.target.value})}
                    placeholder="Enter detailed notes about the resolution"
                    rows={4}
                    required
                  />
                </FormControl>

                {/* Preview */}
                {resolveForm.decision && (
                  <Card width="100%" borderColor="blue.200">
                    <CardBody>
                      <VStack spacing={2}>
                        <Text fontWeight="bold">Resolution Preview</Text>
                        <HStack justify="space-between" width="100%">
                          <Text>Decision:</Text>
                          <Badge colorScheme={
                            resolveForm.decision.includes('refund') ? 'green' : 
                            resolveForm.decision === 'no_refund' ? 'red' : 'blue'
                          }>
                            {resolveForm.decision.replace('_', ' ')}
                          </Badge>
                        </HStack>
                        {resolveForm.refund_amount && (
                          <HStack justify="space-between" width="100%">
                            <Text>Refund Amount:</Text>
                            <Text fontWeight="bold" color="green.600">
                              ${resolveForm.refund_amount}
                            </Text>
                          </HStack>
                        )}
                        {resolveForm.penalty !== 'none' && (
                          <HStack justify="space-between" width="100%">
                            <Text>Penalty:</Text>
                            <Badge colorScheme="red">
                              {resolveForm.penalty.replace('_', ' ')}
                            </Badge>
                          </HStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onResolveClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleResolveDispute}
                isLoading={actionLoading}
                isDisabled={!resolveForm.decision || !resolveForm.notes}
              >
                Submit Resolution
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default Disputes;