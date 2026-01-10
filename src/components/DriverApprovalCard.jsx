import React, { useState } from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useToast,
  Badge,
  Flex,
  Icon,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
} from '@chakra-ui/react';
import {
  FaPhone,
  FaEnvelope,
  FaMotorcycle,
  FaPalette,
  FaCalendar,
  FaStar,
  FaFileAlt,
  FaIdCard,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaUser,
  FaCar,
  FaClipboardCheck,
} from 'react-icons/fa';
import { supabase } from "../services/supabase";

const DriverApprovalCard = ({ driver, onApprove, onReject, refreshList }) => {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const toast = useToast();

  // Extract driver information
  const driverName = driver.full_name || driver.name || 'Unknown Driver';
  const driverPhone = driver.phone || 'No phone';
  const driverEmail = driver.email || 'No email';
  const driverId = driver.id || driver.user_id;
  const vehicleInfo = driver.vehicle
    ? `${driver.vehicle.plate_number || 'No plate'} • ${driver.vehicle.vehicle_type || 'Tricycle'}`
    : 'No vehicle info';

  // Document URLs
  const documents = driver.documents || {};
  const idDocumentUrl = driver.id_document_url || documents.id_document;
  const licenseUrl = driver.license_url || documents.license;
  const registrationUrl = driver.vehicle_registration_url || documents.vehicle_registration;
  const insuranceUrl = driver.insurance_url || documents.insurance;

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (onApprove) {
        await onApprove(driverId);
      } else {
        const { error } = await supabase
          .from('drivers')
          .update({
            approved: true,
            approved_at: new Date().toISOString(),
            rejected: false,
            rejection_reason: null,
            suspended: false,
            suspension_reason: null,
          })
          .eq('user_id', driverId);

        if (error) throw error;

        await supabase
          .from('profiles')
          .update({
            is_driver_approved: true,
            is_active: true,
          })
          .eq('id', driverId);

        toast({
          title: 'Success',
          description: 'Driver approved successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });

        if (refreshList) refreshList();
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve driver',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    setLoading(true);
    try {
      if (onReject) {
        await onReject(rejectionReason);
      } else {
        const { error } = await supabase
          .from('drivers')
          .update({
            approved: false,
            rejected: true,
            rejection_reason: rejectionReason,
            rejected_at: new Date().toISOString(),
          })
          .eq('user_id', driverId);

        if (error) throw error;

        await supabase
          .from('profiles')
          .update({
            is_driver_approved: false,
            is_active: false,
          })
          .eq('id', driverId);

        toast({
          title: 'Success',
          description: 'Driver rejected successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });

        if (refreshList) refreshList();
      }

      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject driver',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocuments = () => {
    if (idDocumentUrl || licenseUrl || registrationUrl || insuranceUrl) {
      setShowDocuments(true);
    } else {
      toast({
        title: 'No Documents',
        description: 'This driver has not uploaded any documents yet.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const openDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'No Document',
        description: 'This document is not available.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const getDocumentStatus = () => {
    const docs = [
      { name: 'ID Document', has: idDocumentUrl },
      { name: 'License', has: licenseUrl },
      { name: 'Registration', has: registrationUrl },
      { name: 'Insurance', has: insuranceUrl },
    ];

    const uploaded = docs.filter((doc) => doc.has).length;
    return `${uploaded}/4 documents`;
  };

  const getUploadedDocsCount = () => {
    const docs = [idDocumentUrl, licenseUrl, registrationUrl, insuranceUrl];
    return docs.filter(Boolean).length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
    >
      <CardBody p={6}>
        {/* Driver Header */}
        <Flex mb={6} align="center">
          <Box mr={4}>
            {driver.avatar_url ? (
              <Image
                src={driver.avatar_url}
                alt={driverName}
                boxSize="80px"
                borderRadius="full"
                objectFit="cover"
                border="3px solid"
                borderColor="brand.100"
              />
            ) : (
              <Box
                boxSize="80px"
                borderRadius="full"
                bg="brand.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="3px solid"
                borderColor="brand.100"
              >
                <Icon as={FaUser} boxSize={10} color="brand.500" />
              </Box>
            )}
          </Box>

          <VStack align="start" spacing={2} flex={1}>
            <Heading size="md" color="gray.800">
              {driverName}
            </Heading>

            <HStack spacing={4}>
              <HStack spacing={2}>
                <Icon as={FaPhone} color="gray.500" boxSize={4} />
                <Text fontSize="sm" color="gray.600">
                  {driverPhone}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Icon as={FaEnvelope} color="gray.500" boxSize={4} />
                <Text fontSize="sm" color="gray.600">
                  {driverEmail}
                </Text>
              </HStack>
            </HStack>

            <HStack spacing={3}>
              <Badge 
                colorScheme="orange" 
                variant="subtle" 
                borderRadius="full" 
                px={3} 
                py={1}
                fontSize="xs"
                fontWeight="semibold"
              >
                Pending Approval
              </Badge>

              <Button
                size="xs"
                variant="outline"
                colorScheme="blue"
                leftIcon={<FaFileAlt />}
                onClick={handleViewDocuments}
                borderRadius="full"
              >
                {getDocumentStatus()}
              </Button>
            </HStack>
          </VStack>
        </Flex>

        <Divider borderColor="gray.200" my={4} />

        {/* Vehicle Information */}
        <VStack align="start" spacing={3} mb={4}>
          <HStack spacing={2}>
            <Icon as={FaCar} color="brand.500" boxSize={5} />
            <Text fontWeight="semibold" color="gray.700">
              Vehicle Information
            </Text>
          </HStack>
          
          <HStack spacing={3}>
            <Icon as={FaMotorcycle} color="gray.500" boxSize={4} />
            <Text fontSize="sm" color="gray.600">
              {vehicleInfo}
            </Text>
          </HStack>
          
          {driver.vehicle?.color && (
            <HStack spacing={3}>
              <Icon as={FaPalette} color="gray.500" boxSize={4} />
              <Text fontSize="sm" color="gray.600">
                Color: {driver.vehicle.color}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Application Details */}
        <VStack align="start" spacing={3} mb={6}>
          <HStack spacing={2}>
            <Icon as={FaClipboardCheck} color="brand.500" boxSize={5} />
            <Text fontWeight="semibold" color="gray.700">
              Application Details
            </Text>
          </HStack>
          
          <HStack spacing={3}>
            <Icon as={FaCalendar} color="gray.500" boxSize={4} />
            <Text fontSize="sm" color="gray.600">
              Applied: {formatDate(driver.created_at)}
            </Text>
          </HStack>
          
          {driver.rating && (
            <HStack spacing={3}>
              <Icon as={FaStar} color="yellow.500" boxSize={4} />
              <Text fontSize="sm" color="gray.600">
                Rating: {driver.rating.toFixed(1)}/5.0
              </Text>
            </HStack>
          )}
        </VStack>

        <Divider borderColor="gray.200" my={4} />

        {/* Actions */}
        <HStack spacing={4}>
          <Button
            leftIcon={<FaTimesCircle />}
            colorScheme="red"
            variant="solid"
            flex={1}
            onClick={handleReject}
            isLoading={loading}
            isDisabled={loading}
            borderRadius="lg"
            size="md"
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: 'md',
            }}
          >
            Reject
          </Button>

          <Button
            leftIcon={<FaCheckCircle />}
            colorScheme="green"
            variant="solid"
            flex={1}
            onClick={handleApprove}
            isLoading={loading}
            isDisabled={loading}
            borderRadius="lg"
            size="md"
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: 'md',
            }}
          >
            Approve
          </Button>
        </HStack>
      </CardBody>

      {/* Rejection Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl" borderWidth="1px" borderColor="gray.200">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.200">
            Reject Driver Application
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Rejecting: <strong style={{ color: '#333' }}>{driverName}</strong>
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Please provide a reason for rejection:
              </Text>
              <Textarea
                placeholder="Enter reason for rejection (e.g., incomplete documents, invalid information, etc.)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
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
              onClick={() => setShowRejectModal(false)}
              borderRadius="lg"
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmReject}
              isLoading={loading}
              isDisabled={!rejectionReason.trim()}
              borderRadius="lg"
            >
              Confirm Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Documents Modal */}
      <Modal isOpen={showDocuments} onClose={() => setShowDocuments(false)} size="lg">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl" borderWidth="1px" borderColor="gray.200">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.200">
            Driver Documents
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="400px" overflowY="auto" py={6}>
            <VStack spacing={4} align="stretch">
              {idDocumentUrl && (
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  borderColor="blue.200"
                  bg="blue.50"
                  _hover={{ 
                    bg: 'blue.100', 
                    cursor: 'pointer',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s'
                  }}
                  transition="all 0.2s"
                  onClick={() => openDocument(idDocumentUrl)}
                >
                  <HStack justify="space-between">
                    <HStack spacing={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="blue.100"
                      >
                        <Icon as={FaIdCard} color="blue.600" boxSize={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" color="gray.800">ID Document</Text>
                        <Text fontSize="sm" color="gray.500">
                          Government issued ID card
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FaExternalLinkAlt} color="blue.500" />
                  </HStack>
                </Box>
              )}

              {licenseUrl && (
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  borderColor="green.200"
                  bg="green.50"
                  _hover={{ 
                    bg: 'green.100', 
                    cursor: 'pointer',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s'
                  }}
                  transition="all 0.2s"
                  onClick={() => openDocument(licenseUrl)}
                >
                  <HStack justify="space-between">
                    <HStack spacing={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="green.100"
                      >
                        <Icon as={FaFileAlt} color="green.600" boxSize={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" color="gray.800">Driver's License</Text>
                        <Text fontSize="sm" color="gray.500">
                          Valid driving license
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FaExternalLinkAlt} color="green.500" />
                  </HStack>
                </Box>
              )}

              {registrationUrl && (
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  borderColor="purple.200"
                  bg="purple.50"
                  _hover={{ 
                    bg: 'purple.100', 
                    cursor: 'pointer',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s'
                  }}
                  transition="all 0.2s"
                  onClick={() => openDocument(registrationUrl)}
                >
                  <HStack justify="space-between">
                    <HStack spacing={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="purple.100"
                      >
                        <Icon as={FaFileAlt} color="purple.600" boxSize={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" color="gray.800">Vehicle Registration</Text>
                        <Text fontSize="sm" color="gray.500">
                          Official vehicle registration
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FaExternalLinkAlt} color="purple.500" />
                  </HStack>
                </Box>
              )}

              {insuranceUrl && (
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  borderColor="orange.200"
                  bg="orange.50"
                  _hover={{ 
                    bg: 'orange.100', 
                    cursor: 'pointer',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s'
                  }}
                  transition="all 0.2s"
                  onClick={() => openDocument(insuranceUrl)}
                >
                  <HStack justify="space-between">
                    <HStack spacing={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="orange.100"
                      >
                        <Icon as={FaShieldAlt} color="orange.600" boxSize={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" color="gray.800">Insurance Document</Text>
                        <Text fontSize="sm" color="gray.500">
                          Vehicle insurance coverage
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FaExternalLinkAlt} color="orange.500" />
                  </HStack>
                </Box>
              )}

              {getUploadedDocsCount() === 0 && (
                <Box textAlign="center" py={8}>
                  <Box
                    p={4}
                    borderRadius="lg"
                    bg="gray.100"
                    display="inline-flex"
                    mb={4}
                  >
                    <Icon as={FaFileAlt} boxSize={8} color="gray.400" />
                  </Box>
                  <Text color="gray.500" fontWeight="medium" mb={2}>
                    No documents uploaded
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    This driver has not uploaded any required documents yet.
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.200">
            <Button 
              colorScheme="brand" 
              onClick={() => setShowDocuments(false)}
              borderRadius="lg"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default DriverApprovalCard;