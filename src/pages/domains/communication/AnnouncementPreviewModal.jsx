import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Divider,
  SimpleGrid,
  Tag,
  TagLabel,
  TagLeftIcon,
  useColorModeValue
} from '@chakra-ui/react';
import {
  CalendarIcon,
  TimeIcon,
  UserIcon,
  BellIcon,
  CheckCircleIcon,
  ViewIcon,
  CopyIcon
} from '@chakra-ui/icons';
import { formatDate } from '../../../utils/formatters';

const AnnouncementPreviewModal = ({ isOpen, onClose, announcement }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!announcement) return null;

  const getAudienceLabel = (type) => {
    const labels = {
      all_users: 'All Users (Drivers & Passengers)',
      drivers: 'Drivers Only',
      passengers: 'Passengers Only',
      all_admins: 'All Admins',
      specific_roles: 'Specific Admin Roles'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'gray',
      active: 'green',
      scheduled: 'blue',
      expired: 'orange',
      archived: 'red'
    };
    return colors[status] || 'gray';
  };

  const getChannelIcon = (channel) => {
    const icons = {
      in_app: BellIcon,
      push: BellIcon,
      email: CopyIcon,
      sms: CopyIcon
    };
    return icons[channel] || BellIcon;
  };

  const getChannelLabel = (channel) => {
    const labels = {
      in_app: 'In-App',
      push: 'Push',
      email: 'Email',
      sms: 'SMS'
    };
    return labels[channel] || channel;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <ViewIcon />
            <Text>Announcement Preview</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Header with status and date */}
            <Box
              p={4}
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
            >
              <HStack justify="space-between" mb={3}>
                <Badge colorScheme={getStatusColor(announcement.status)} fontSize="sm">
                  {announcement.status.toUpperCase()}
                </Badge>
                <Text fontSize="sm" color="gray.500">
                  Created: {formatDate(announcement.created_at, 'datetime')}
                </Text>
              </HStack>
              
              <Text fontSize="xl" fontWeight="bold" mb={2}>
                {announcement.title}
              </Text>
              
              <Text fontSize="sm" color="gray.600">
                by {announcement.created_by_admin?.name || 'Unknown Admin'}
              </Text>
            </Box>

            {/* Message content */}
            <Box
              p={4}
              bg="gray.50"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              minH="200px"
            >
              <Text fontSize="md" whiteSpace="pre-wrap">
                {announcement.message}
              </Text>
            </Box>

            <Divider />

            {/* Audience and Delivery Info */}
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={2}>Target Audience</Text>
                <HStack>
                  <UserIcon color="blue.500" />
                  <Text>{getAudienceLabel(announcement.audience_type)}</Text>
                </HStack>
                
                {announcement.specific_roles && announcement.specific_roles.length > 0 && (
                  <VStack align="start" mt={2} spacing={1}>
                    <Text fontSize="sm" fontWeight="medium">Specific Roles:</Text>
                    <HStack wrap="wrap">
                      {announcement.specific_roles.map((role) => (
                        <Badge key={role} colorScheme="teal" fontSize="xs">
                          {role.replace('_', ' ')}
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                )}
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Delivery Channels</Text>
                <VStack align="start" spacing={2}>
                  {announcement.delivery_channels?.map((channel) => {
                    const Icon = getChannelIcon(channel);
                    return (
                      <HStack key={channel}>
                        <Icon color="green.500" boxSize={4} />
                        <Text fontSize="sm">{getChannelLabel(channel)}</Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            </SimpleGrid>

            {/* Scheduling Info */}
            {announcement.scheduled_at && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="bold" mb={2}>Scheduled Delivery</Text>
                  <HStack>
                    <CalendarIcon color="purple.500" />
                    <Text>{formatDate(announcement.scheduled_at, 'full')}</Text>
                  </HStack>
                  {announcement.scheduled_at > new Date().toISOString() ? (
                    <HStack mt={2}>
                      <TimeIcon color="orange.500" />
                      <Text fontSize="sm" color="orange.600">
                        Will be delivered on schedule
                      </Text>
                    </HStack>
                  ) : (
                    <HStack mt={2}>
                      <CheckCircleIcon color="green.500" />
                      <Text fontSize="sm" color="green.600">
                        Already delivered
                      </Text>
                    </HStack>
                  )}
                </Box>
              </>
            )}

            {/* Delivery Stats (if available) */}
            {announcement.delivery_stats && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="bold" mb={2}>Delivery Statistics</Text>
                  <SimpleGrid columns={3} spacing={4}>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                        {announcement.delivery_stats.sent || 0}
                      </Text>
                      <Text fontSize="sm">Sent</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {announcement.delivery_stats.delivered || 0}
                      </Text>
                      <Text fontSize="sm">Delivered</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="red.500">
                        {announcement.delivery_stats.failed || 0}
                      </Text>
                      <Text fontSize="sm">Failed</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {announcement.status === 'draft' && (
              <Button colorScheme="blue">
                Publish Now
              </Button>
            )}
            {announcement.status === 'scheduled' && (
              <Button colorScheme="orange">
                Send Immediately
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AnnouncementPreviewModal;