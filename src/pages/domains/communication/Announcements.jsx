import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Box,
  Switch,
  Text,
  RadioGroup,
  Radio,
  Stack,
  useToast,
  Badge,
  SimpleGrid,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatDate } from '../../../utils/formatters';

const AnnouncementForm = ({ isOpen, onClose, onSubmit, onUpdate, announcement }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audienceType, setAudienceType] = useState('all_users');
  const [specificRoles, setSpecificRoles] = useState([]);
  const [deliveryChannels, setDeliveryChannels] = useState(['in_app']);
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  // Available audience types
  const audienceOptions = [
    { value: 'all_users', label: 'All Users (Drivers & Passengers)' },
    { value: 'drivers', label: 'Drivers Only' },
    { value: 'passengers', label: 'Passengers Only' },
    { value: 'specific_roles', label: 'Specific Admin Roles' },
    { value: 'all_admins', label: 'All Admins' }
  ];

  // Available admin roles for targeting
  const adminRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'OPERATIONS',
    'FINANCE',
    'SUPPORT',
    'ANALYTICS'
  ];

  // Delivery channel options
  const channelOptions = [
    { value: 'in_app', label: 'In-App Notification', enabled: true },
    { value: 'push', label: 'Push Notification', enabled: false },
    { value: 'email', label: 'Email', enabled: false },
    { value: 'sms', label: 'SMS', enabled: false }
  ];

  // Status options
  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'scheduled', label: 'Scheduled', color: 'blue' },
    { value: 'archived', label: 'Archived', color: 'orange' }
  ];

  // Initialize form with announcement data if editing
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || '');
      setMessage(announcement.message || '');
      setAudienceType(announcement.audience_type || 'all_users');
      setSpecificRoles(announcement.specific_roles || []);
      setDeliveryChannels(announcement.delivery_channels || ['in_app']);
      setScheduleType(announcement.scheduled_at ? 'schedule' : 'now');
      setScheduledDate(announcement.scheduled_at ? new Date(announcement.scheduled_at) : null);
      setScheduledTime(announcement.scheduled_at ? formatDate(announcement.scheduled_at, 'time') : '');
      setStatus(announcement.status || 'draft');
    } else {
      resetForm();
    }
  }, [announcement]);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setAudienceType('all_users');
    setSpecificRoles([]);
    setDeliveryChannels(['in_app']);
    setScheduleType('now');
    setScheduledDate(null);
    setScheduledTime('');
    setStatus('draft');
  };

  const handleChannelToggle = (channel) => {
    if (deliveryChannels.includes(channel)) {
      setDeliveryChannels(deliveryChannels.filter(c => c !== channel));
    } else {
      setDeliveryChannels([...deliveryChannels, channel]);
    }
  };

  const handleRoleToggle = (role) => {
    if (specificRoles.includes(role)) {
      setSpecificRoles(specificRoles.filter(r => r !== role));
    } else {
      setSpecificRoles([...specificRoles, role]);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        status: 'error',
        duration: 3000,
      });
      return false;
    }

    if (!message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Message is required',
        status: 'error',
        duration: 3000,
      });
      return false;
    }

    if (audienceType === 'specific_roles' && specificRoles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one admin role',
        status: 'error',
        duration: 3000,
      });
      return false;
    }

    if (scheduleType === 'schedule' && !scheduledDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select a date for scheduling',
        status: 'error',
        duration: 3000,
      });
      return false;
    }

    if (deliveryChannels.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one delivery channel',
        status: 'error',
        duration: 3000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare announcement data
      const announcementData = {
        title: title.trim(),
        message: message.trim(),
        audience_type: audienceType,
        specific_roles: audienceType === 'specific_roles' ? specificRoles : null,
        delivery_channels: deliveryChannels,
        status: status
      };

      // Handle scheduling
      if (scheduleType === 'schedule' && scheduledDate) {
        let scheduledDateTime = scheduledDate;
        if (scheduledTime) {
          const [hours, minutes] = scheduledTime.split(':');
          scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
        }
        announcementData.scheduled_at = scheduledDateTime.toISOString();
        announcementData.status = 'scheduled';
      } else {
        announcementData.scheduled_at = null;
        if (status === 'active') {
          announcementData.published_at = new Date().toISOString();
        }
      }

      // Submit or update
      if (announcement) {
        await onUpdate(announcement.id, announcementData);
      } else {
        await onSubmit(announcementData);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {announcement ? 'Edit Announcement' : 'Create New Announcement'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Basic Information</Text>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    maxLength={100}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter announcement message (supports basic HTML)"
                    rows={6}
                    resize="vertical"
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    You can use basic HTML tags like &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;
                  </Text>
                </FormControl>
              </VStack>
            </Box>

            {/* Target Audience */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Target Audience</Text>
              <RadioGroup value={audienceType} onChange={setAudienceType}>
                <Stack spacing={3}>
                  {audienceOptions.map((option) => (
                    <Radio key={option.value} value={option.value}>
                      {option.label}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>

              {audienceType === 'specific_roles' && (
                <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                  <FormLabel mb={3}>Select Admin Roles</FormLabel>
                  <SimpleGrid columns={2} spacing={2}>
                    {adminRoles.map((role) => (
                      <Button
                        key={role}
                        size="sm"
                        variant={specificRoles.includes(role) ? "solid" : "outline"}
                        colorScheme={specificRoles.includes(role) ? "blue" : "gray"}
                        onClick={() => handleRoleToggle(role)}
                      >
                        {role.replace('_', ' ')}
                      </Button>
                    ))}
                  </SimpleGrid>
                  {specificRoles.length > 0 && (
                    <Text mt={3} fontSize="sm">
                      Selected: {specificRoles.map(r => r.replace('_', ' ')).join(', ')}
                    </Text>
                  )}
                </Box>
              )}
            </Box>

            {/* Delivery Channels */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Delivery Channels</Text>
              <VStack spacing={3} align="stretch">
                {channelOptions.map((channel) => (
                  <HStack key={channel.value} justify="space-between">
                    <Box>
                      <Text fontWeight="medium">{channel.label}</Text>
                      {!channel.enabled && (
                        <Badge colorScheme="yellow" fontSize="xs">Coming Soon</Badge>
                      )}
                    </Box>
                    <Switch
                      isChecked={deliveryChannels.includes(channel.value)}
                      onChange={() => handleChannelToggle(channel.value)}
                      isDisabled={!channel.enabled}
                    />
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Scheduling */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Scheduling</Text>
              <RadioGroup value={scheduleType} onChange={setScheduleType}>
                <Stack spacing={3} mb={4}>
                  <Radio value="now">Send Immediately</Radio>
                  <Radio value="schedule">Schedule for Later</Radio>
                </Stack>
              </RadioGroup>

              {scheduleType === 'schedule' && (
                <VStack spacing={4} p={4} bg="blue.50" borderRadius="md">
                  <FormControl>
                    <FormLabel>Select Date</FormLabel>
                    <HStack>
                      <CalendarIcon />
                      <DatePicker
                        selected={scheduledDate}
                        onChange={setScheduledDate}
                        minDate={new Date()}
                        dateFormat="MMMM d, yyyy"
                        placeholderText="Select date"
                        className="chakra-input"
                        style={{ width: '100%' }}
                      />
                    </HStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Select Time (Optional)</FormLabel>
                    <HStack>
                      <TimeIcon />
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        placeholder="HH:MM"
                      />
                    </HStack>
                  </FormControl>

                  {scheduledDate && (
                    <Alert status="info" variant="subtle" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Scheduled for: {scheduledDate.toLocaleDateString()}{scheduledTime ? ` at ${scheduledTime}` : ''}
                      </Text>
                    </Alert>
                  )}
                </VStack>
              )}
            </Box>

            {/* Status */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Status</Text>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                isDisabled={scheduleType === 'schedule'}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {scheduleType === 'schedule' 
                  ? 'Status will be set to "Scheduled" automatically' 
                  : 'Set the initial status of this announcement'}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText={announcement ? "Updating..." : "Creating..."}
            >
              {announcement ? 'Update Announcement' : 'Create Announcement'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AnnouncementForm;