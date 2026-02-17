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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Alert,
  AlertIcon,
  Progress,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaClock,
  FaIdCard,
  FaCar,
  FaShieldAlt,
  FaFileAlt,
  FaUser,
  FaExclamationTriangle,
  FaEllipsisV,
  FaDownload,
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserManagement } from '../../../hooks/useUserManagement';
import { supabase } from '../../../services/supabase';
import Layout from '../../../components/layout/Layout';

const Verifications = () => {
  const { admin } = useAuth();
  const { approveDriver, rejectDriver } = useUserManagement();
  const [verifications, setVerifications] = useState([]);
  const [filteredVerifications, setFilteredVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rejectionReason, setRejectionReason] = useState('');
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_documents')
        .select(`
          *,
          driver:driver_id (
            id,
            full_name,
            email,
            phone,
            status,
            profile:profiles (avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setVerifications(data || []);
      setFilteredVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
    
    const subscription = supabase
      .channel('verifications_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_documents' }, fetchVerifications)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let filtered = verifications;
    
    if (searchTerm) {
      filtered = filtered.filter(verification =>
        verification.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.driver?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.document_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(verification => verification.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(verification => verification.document_type === typeFilter);
    }
    
    setFilteredVerifications(filtered);
  }, [verifications, searchTerm, statusFilter, typeFilter]);

  const handleViewDocument = (verification) => {
    setSelectedVerification(verification);
    onOpen();
  };

  const handleApprove = async (verification) => {
    if (window.confirm(`Approve ${verification.document_type} for ${verification.driver?.full_name}?`)) {
      await approveDriver(verification.driver_id, { adminId: admin.id });
      fetchVerifications();
    }
  };

  const handleReject = async (verification) => {
    setSelectedVerification(verification);
    onRejectOpen();
  };

  const confirmReject = async () => {
    if (rejectionReason && selectedVerification) {
      await rejectDriver(selectedVerification.driver_id, rejectionReason, admin.id);
      setRejectionReason('');
      onRejectClose();
      fetchVerifications();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'green';
      case 'pending': return 'orange';
      case 'rejected': return 'red';
      case 'expired': return 'gray';
      default: return 'gray';
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'license': return FaIdCard;
      case 'insurance': return FaShieldAlt;
      case 'vehicle_registration': return FaCar;
      case 'id_card': return FaIdCard;
      case 'profile_photo': return FaUser;
      case 'background_check': return FaFileAlt;
      default: return FaFileAlt;
    }
  };

  const getDocumentTypeLabel = (type) => {
    return type.replace('_', ' ').toUpperCase();
  };

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    verified: verifications.filter(v => v.status === 'verified').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
    expired: verifications.filter(v => v.status === 'expired').length,
  };

  const documentTypes = [
    { type: 'license', label: 'Driver License', count: verifications.filter(v => v.document_type === 'license').length },
    { type: 'insurance', label: 'Insurance', count: verifications.filter(v => v.document_type === 'insurance').length },
    { type: 'vehicle_registration', label: 'Vehicle Registration', count: verifications.filter(v => v.document_type === 'vehicle_registration').length },
    { type: 'id_card', label: 'ID Card', count: verifications.filter(v => v.document_type === 'id_card').length },
    { type: 'profile_photo', label: 'Profile Photo', count: verifications.filter(v => v.document_type === 'profile_photo').length },
    { type: 'background_check', label: 'Background Check', count: verifications.filter(v => v.document_type === 'background_check').length },
  ];

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Document Verification
            </Heading>
            <Text color="gray.600" mt={1}>
              Review and verify driver documents
            </Text>
          </Box>
          <Button
            leftIcon={<FaDownload />}
            colorScheme="brand"
            size="sm"
            onClick={() => alert('Exporting verification data...')}
          >
            Export Reports
          </Button>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                {stats.total}
              </Text>
              <Text fontSize="sm" color="gray.600">Total Documents</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {stats.pending}
              </Text>
              <Text fontSize="sm" color="gray.600">Pending Review</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {stats.verified}
              </Text>
              <Text fontSize="sm" color="gray.600">Verified</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="red.600">
                {stats.rejected}
              </Text>
              <Text fontSize="sm" color="gray.600">Rejected</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="gray.600">
                {stats.expired}
              </Text>
              <Text fontSize="sm" color="gray.600">Expired</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Document Type Breakdown */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Document Type Breakdown</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {documentTypes.map((doc) => (
                <Box key={doc.type} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg">
                  <HStack justify="space-between" mb={2}>
                    <HStack spacing={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="lg"
                        bg="brand.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={getDocumentIcon(doc.type)} color="brand.600" />
                      </Box>
                      <Box>
                        <Text fontWeight="medium">{doc.label}</Text>
                        <Text fontSize="sm" color="gray.600">{doc.count} documents</Text>
                      </Box>
                    </HStack>
                  </HStack>
                  <Progress
                    value={(doc.count / Math.max(stats.total, 1)) * 100}
                    colorScheme="brand"
                    size="sm"
                    borderRadius="full"
                  />
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Filters */}
        <Flex gap={4} wrap="wrap">
          <InputGroup flex={1} minW="300px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by driver name, email, or document type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
            />
          </InputGroup>
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            width="150px"
            borderRadius="lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </Select>
          
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            width="200px"
            borderRadius="lg"
          >
            <option value="all">All Documents</option>
            <option value="license">Driver License</option>
            <option value="insurance">Insurance</option>
            <option value="vehicle_registration">Vehicle Registration</option>
            <option value="id_card">ID Card</option>
            <option value="profile_photo">Profile Photo</option>
            <option value="background_check">Background Check</option>
          </Select>
          
          <Button
            leftIcon={<FaFilter />}
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('pending');
              setTypeFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </Flex>

        {/* Pending Verifications Alert */}
        {stats.pending > 0 && (
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>{stats.pending} Documents Pending Review</AlertTitle>
              <AlertDescription>
                These documents require your attention for verification
              </AlertDescription>
            </Box>
            <Button
              size="sm"
              colorScheme="orange"
              variant="outline"
              onClick={() => setStatusFilter('pending')}
            >
              Review Now
            </Button>
          </Alert>
        )}

        {/* Verifications Grid */}
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[...Array(6)].map((_, i) => (
              <Card key={i} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Box height="200px" bg="gray.200" borderRadius="lg" mb={4} />
                  <Box height="20px" bg="gray.200" borderRadius="md" mb={2} />
                  <Box height="16px" bg="gray.200" borderRadius="md" width="60%" />
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : filteredVerifications.length === 0 ? (
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody textAlign="center" py={10}>
              <FaFileAlt size={48} style={{ margin: '0 auto 16px', color: '#CBD5E0' }} />
              <Text color="gray.500">No documents found matching your filters</Text>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredVerifications.map((verification) => {
              const Icon = getDocumentIcon(verification.document_type);
              return (
                <Card
                  key={verification.id}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
                  transition="all 0.3s"
                >
                  <CardHeader pb={2}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Box
                          w={10}
                          h={10}
                          borderRadius="lg"
                          bg="brand.100"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon color="brand.600" />
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">
                            {getDocumentTypeLabel(verification.document_type)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(verification.created_at).toLocaleDateString()}
                          </Text>
                        </Box>
                      </HStack>
                      <Badge
                        colorScheme={getStatusColor(verification.status)}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {verification.status}
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    <Box mb={4}>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Driver
                      </Text>
                      <Text fontWeight="medium">
                        {verification.driver?.full_name || 'Unknown'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {verification.driver?.email}
                      </Text>
                    </Box>
                    
                    {verification.expires_at && (
                      <Box mb={4}>
                        <Text fontSize="sm" color="gray.600" mb={1}>
                          Expires
                        </Text>
                        <Text fontSize="sm">
                          {new Date(verification.expires_at).toLocaleDateString()}
                        </Text>
                      </Box>
                    )}
                    
                    {verification.rejection_reason && (
                      <Box mb={4}>
                        <Text fontSize="sm" color="gray.600" mb={1}>
                          Rejection Reason
                        </Text>
                        <Text fontSize="sm" color="red.600" fontStyle="italic">
                          {verification.rejection_reason}
                        </Text>
                      </Box>
                    )}
                    
                    <Box
                      as="button"
                      w="100%"
                      h="150px"
                      bg="gray.100"
                      borderRadius="lg"
                      overflow="hidden"
                      mb={4}
                      onClick={() => handleViewDocument(verification)}
                      _hover={{ opacity: 0.9 }}
                    >
                      <Image
                        src={verification.document_url}
                        alt={verification.document_type}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        fallback={
                          <Box
                            w="100%"
                            h="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexDirection="column"
                          >
                            <FaEye size={32} color="#CBD5E0" />
                            <Text mt={2} color="gray.500" fontSize="sm">
                              Click to view document
                            </Text>
                          </Box>
                        }
                      />
                    </Box>
                  </CardBody>
                  <CardFooter pt={0}>
                    {verification.status === 'pending' ? (
                      <HStack spacing={2} w="100%">
                        <Button
                          leftIcon={<FaCheckCircle />}
                          colorScheme="green"
                          size="sm"
                          flex={1}
                          onClick={() => handleApprove(verification)}
                        >
                          Approve
                        </Button>
                        <Button
                          leftIcon={<FaTimesCircle />}
                          colorScheme="red"
                          size="sm"
                          flex={1}
                          onClick={() => handleReject(verification)}
                        >
                          Reject
                        </Button>
                      </HStack>
                    ) : (
                      <HStack spacing={2} w="100%">
                        <Button
                          leftIcon={<FaEye />}
                          variant="outline"
                          size="sm"
                          flex={1}
                          onClick={() => handleViewDocument(verification)}
                        >
                          View
                        </Button>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FaEllipsisV />}
                            size="sm"
                            variant="ghost"
                          />
                          <MenuList minW="150px">
                            <MenuItem icon={<FaDownload />}>
                              Download
                            </MenuItem>
                            <MenuItem icon={<FaFileAlt />}>
                              View History
                            </MenuItem>
                            {verification.status === 'verified' && (
                              <MenuItem icon={<FaTimesCircle />} color="red.500">
                                Revoke
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      </HStack>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </VStack>

      {/* Document Viewer Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedVerification && (
              <Text>
                {getDocumentTypeLabel(selectedVerification.document_type)} -{' '}
                {selectedVerification.driver?.full_name}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedVerification && (
              <VStack spacing={6} align="stretch">
                <Box
                  bg="gray.100"
                  borderRadius="lg"
                  overflow="hidden"
                  h="70vh"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image
                    src={selectedVerification.document_url}
                    alt={selectedVerification.document_type}
                    maxH="100%"
                    maxW="100%"
                    objectFit="contain"
                  />
                </Box>
                
                <SimpleGrid columns={2} spacing={6}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Driver Information
                    </Text>
                    <Text fontWeight="medium">{selectedVerification.driver?.full_name}</Text>
                    <Text fontSize="sm" color="gray.500">{selectedVerification.driver?.email}</Text>
                    <Text fontSize="sm" color="gray.500">{selectedVerification.driver?.phone}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Document Information
                    </Text>
                    <Text fontWeight="medium">{getDocumentTypeLabel(selectedVerification.document_type)}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Uploaded: {new Date(selectedVerification.created_at).toLocaleDateString()}
                    </Text>
                    {selectedVerification.expires_at && (
                      <Text fontSize="sm" color="gray.500">
                        Expires: {new Date(selectedVerification.expires_at).toLocaleDateString()}
                      </Text>
                    )}
                  </Box>
                </SimpleGrid>
                
                {selectedVerification.status === 'pending' && (
                  <Alert status="info" borderRadius="lg">
                    <AlertIcon />
                    <Box flex="1">
                      <AlertTitle>Action Required</AlertTitle>
                      <AlertDescription>
                        This document is pending verification. Please review and take action.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedVerification?.status === 'pending' && (
              <>
                <Button
                  leftIcon={<FaCheckCircle />}
                  colorScheme="green"
                  mr={3}
                  onClick={() => {
                    handleApprove(selectedVerification);
                    onClose();
                  }}
                >
                  Approve Document
                </Button>
                <Button
                  leftIcon={<FaTimesCircle />}
                  colorScheme="red"
                  onClick={() => {
                    onClose();
                    onRejectOpen();
                  }}
                >
                  Reject Document
                </Button>
              </>
            )}
            <Button variant="ghost" ml={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Document</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Reason for Rejection</FormLabel>
              <Textarea
                placeholder="Enter detailed reason for rejecting this document..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                minH="120px"
                required
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRejectClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmReject}>
              Reject Document
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Verifications;