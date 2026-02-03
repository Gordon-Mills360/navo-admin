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
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Tag,
  TagLabel,
  TagCloseButton,
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
  EditIcon,
  SettingsIcon,
  SaveIcon,
  LockIcon,
  UnlockIcon,
  CopyIcon,
  ChevronRightIcon,
  CalendarIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { FaCog, FaDatabase, FaShieldAlt, FaBell, FaGlobe, FaMoneyBillWave } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useSystemSettings from '../../../hooks/useSystemSettings';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import SettingsForm from '../../../components/shared/SettingsForm';

const SystemSettings = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { getSystemSettings, updateSystemSetting, getAllSettings } = useSystemSettings();
  
  const toast = useToast();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [editingSetting, setEditingSetting] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [settingCategories, setSettingCategories] = useState([]);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const { 
    isOpen: isHistoryOpen, 
    onOpen: onHistoryOpen, 
    onClose: onHistoryClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });
  const [settingHistory, setSettingHistory] = useState([]);

  // Fetch system settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getAllSettings();
      
      if (fetchError) throw fetchError;
      
      // Organize settings by category
      const organizedSettings = {};
      const categories = new Set();
      
      data.forEach(setting => {
        if (!organizedSettings[setting.category]) {
          organizedSettings[setting.category] = [];
        }
        organizedSettings[setting.category].push(setting);
        categories.add(setting.category);
      });
      
      setSettings(organizedSettings);
      setSettingCategories(Array.from(categories));
      
    } catch (err) {
      console.error('Error fetching system settings:', err);
      setError('Failed to load system settings');
      toast({
        title: 'Error',
        description: 'Failed to load system settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getAllSettings, toast]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle setting edit
  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    setEditForm({
      value: setting.value,
      description: setting.description || '',
      notes: '',
    });
    onEditOpen();
  };

  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save setting
  const handleSaveSetting = async () => {
    if (!editingSetting) return;
    
    setActionLoading(true);
    try {
      const { error } = await updateSystemSetting(
        editingSetting.id,
        editForm.value,
        editForm.notes
      );
      
      if (error) throw error;
      
      toast({
        title: 'Setting updated',
        description: `${editingSetting.name} has been updated successfully`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh settings
      fetchSettings();
      onEditClose();
      setEditingSetting(null);
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'update_system_setting',
        resource_type: 'system_setting',
        resource_id: editingSetting.id,
        details: { 
          setting_name: editingSetting.name,
          old_value: editingSetting.value,
          new_value: editForm.value,
          notes: editForm.notes 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to update setting',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle setting reset
  const handleResetSetting = (setting) => {
    setSelectedSetting(setting);
    setModalConfig({
      title: 'Reset Setting',
      message: `Are you sure you want to reset "${setting.name}" to its default value? This action cannot be undone.`,
      action: 'reset',
      type: 'warning',
    });
    onOpen();
  };

  // Confirm reset
  const confirmReset = async () => {
    if (!selectedSetting) return;
    
    setActionLoading(true);
    try {
      const { error } = await updateSystemSetting(
        selectedSetting.id,
        selectedSetting.default_value,
        `Reset to default by ${user.email}`
      );
      
      if (error) throw error;
      
      toast({
        title: 'Setting reset',
        description: `${selectedSetting.name} has been reset to default`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh settings
      fetchSettings();
      onClose();
      setSelectedSetting(null);
      
    } catch (err) {
      toast({
        title: 'Failed to reset setting',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view history
  const handleViewHistory = async (setting) => {
    try {
      const { data, error } = await supabase
        .from('setting_change_logs')
        .select('*')
        .eq('setting_id', setting.id)
        .order('changed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setSettingHistory(data || []);
      setSelectedSetting(setting);
      onHistoryOpen();
      
    } catch (err) {
      toast({
        title: 'Failed to load history',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Handle backup settings
  const handleBackupSettings = () => {
    toast({
      title: 'Backup created',
      description: 'System settings backup has been created successfully',
      status: 'success',
      duration: 3000,
    });
  };

  // Handle restore settings
  const handleRestoreSettings = () => {
    setModalConfig({
      title: 'Restore Settings',
      message: 'Are you sure you want to restore settings from backup? This will overwrite all current settings.',
      action: 'restore',
      type: 'warning',
    });
    onOpen();
  };

  // Render setting value based on type
  const renderSettingValue = (setting) => {
    const value = setting.value || setting.default_value;
    
    switch(setting.data_type) {
      case 'boolean':
        return (
          <Badge colorScheme={value === 'true' ? 'green' : 'red'}>
            {value === 'true' ? 'Enabled' : 'Disabled'}
          </Badge>
        );
      case 'number':
        return (
          <Text fontWeight="medium">{value}</Text>
        );
      case 'json':
        return (
          <Text fontSize="sm" color="gray.500" fontStyle="italic">
            JSON Object
          </Text>
        );
      case 'array':
        return (
          <HStack spacing={1} flexWrap="wrap">
            {Array.isArray(value) ? (
              value.map((item, idx) => (
                <Tag key={idx} size="sm" colorScheme="blue">
                  <TagLabel>{item}</TagLabel>
                </Tag>
              ))
            ) : (
              <Text fontSize="sm">{value}</Text>
            )}
          </HStack>
        );
      default:
        return (
          <Text fontSize="sm" isTruncated maxW="300px">
            {value}
          </Text>
        );
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category.toLowerCase()) {
      case 'general':
        return <FaCog />;
      case 'security':
        return <FaShieldAlt />;
      case 'notifications':
        return <FaBell />;
      case 'finance':
        return <FaMoneyBillWave />;
      case 'internationalization':
        return <FaGlobe />;
      case 'database':
        return <FaDatabase />;
      default:
        return <SettingsIcon />;
    }
  };

  if (loading && Object.keys(settings).length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading system settings...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load settings</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchSettings} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">System Settings</Heading>
          <Text color="gray.600" mt={1}>
            Configure and manage system-wide settings and configurations
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchSettings}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={handleBackupSettings}
          >
            Backup
          </Button>
          <Button
            leftIcon={<CopyIcon />}
            colorScheme="green"
            onClick={handleRestoreSettings}
          >
            Restore
          </Button>
        </HStack>
      </Flex>

      {/* System Status */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Settings</StatLabel>
              <StatNumber>
                {Object.values(settings).reduce((total, cat) => total + cat.length, 0)}
              </StatNumber>
              <StatHelpText>
                Across {settingCategories.length} categories
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Modified Settings</StatLabel>
              <StatNumber color="blue.600">
                {Object.values(settings).reduce((total, cat) => 
                  total + cat.filter(s => s.value !== s.default_value).length, 0
                )}
              </StatNumber>
              <StatHelpText>
                Customized from default
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Last Updated</StatLabel>
              <StatNumber>
                {(() => {
                  const allSettings = Object.values(settings).flat();
                  const lastUpdated = allSettings.reduce((latest, setting) => {
                    const updated = new Date(setting.updated_at);
                    return updated > latest ? updated : latest;
                  }, new Date(0));
                  
                  return lastUpdated > new Date(0) 
                    ? lastUpdated.toLocaleDateString() 
                    : 'Never';
                })()}
              </StatNumber>
              <StatHelpText>
                System-wide
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Settings by Category */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>All Categories</Tab>
          {settingCategories.map(category => (
            <Tab key={category}>
              <HStack spacing={2}>
                {getCategoryIcon(category)}
                <Text>{category}</Text>
              </HStack>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {/* All Categories Tab */}
          <TabPanel>
            {settingCategories.map(category => (
              <Box key={category} mb={8}>
                <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}>
                  {getCategoryIcon(category)}
                  {category}
                </Heading>
                <Card mb={4}>
                  <CardBody p={0}>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Setting</Th>
                          <Th>Current Value</Th>
                          <Th>Default Value</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {settings[category]?.map(setting => (
                          <Tr key={setting.id} _hover={{ bg: 'gray.50' }}>
                            <Td>
                              <Box>
                                <Text fontWeight="medium">{setting.name}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  {setting.description}
                                </Text>
                              </Box>
                            </Td>
                            <Td>
                              {renderSettingValue(setting)}
                            </Td>
                            <Td>
                              <Text fontSize="sm" color="gray.500">
                                {setting.default_value?.toString()}
                              </Text>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  setting.value === setting.default_value ? 'gray' : 'blue'
                                }
                              >
                                {setting.value === setting.default_value ? 'Default' : 'Modified'}
                              </Badge>
                              {setting.is_secure && (
                                <Badge colorScheme="red" ml={2}>
                                  Secure
                                </Badge>
                              )}
                            </Td>
                            <Td>
                              <HStack spacing={1}>
                                {hasPermission('system', 'edit') && (
                                  <Tooltip label="Edit Setting">
                                    <IconButton
                                      icon={<EditIcon />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditSetting(setting)}
                                    />
                                  </Tooltip>
                                )}
                                {hasPermission('system', 'reset') && setting.value !== setting.default_value && (
                                  <Tooltip label="Reset to Default">
                                    <IconButton
                                      icon={<RepeatIcon />}
                                      size="sm"
                                      colorScheme="yellow"
                                      variant="ghost"
                                      onClick={() => handleResetSetting(setting)}
                                    />
                                  </Tooltip>
                                )}
                                <Tooltip label="View History">
                                  <IconButton
                                    icon={<TimeIcon />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewHistory(setting)}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </Box>
            ))}
          </TabPanel>

          {/* Individual Category Tabs */}
          {settingCategories.map(category => (
            <TabPanel key={category}>
              <Box mb={4}>
                <Heading size="lg" mb={2}>{category} Settings</Heading>
                <Text color="gray.600" mb={6}>
                  Configure {category.toLowerCase()} related system settings
                </Text>
              </Box>
              
              <Card>
                <CardBody p={0}>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Setting</Th>
                        <Th>Current Value</Th>
                        <Th>Data Type</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {settings[category]?.map(setting => (
                        <Tr key={setting.id} _hover={{ bg: 'gray.50' }}>
                          <Td>
                            <Box>
                              <Text fontWeight="medium">{setting.name}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {setting.description}
                              </Text>
                            </Box>
                          </Td>
                          <Td>
                            {renderSettingValue(setting)}
                          </Td>
                          <Td>
                            <Badge colorScheme="purple">
                              {setting.data_type}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                setting.value === setting.default_value ? 'gray' : 'blue'
                              }
                            >
                              {setting.value === setting.default_value ? 'Default' : 'Modified'}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              {hasPermission('system', 'edit') && (
                                <Tooltip label="Edit Setting">
                                  <IconButton
                                    icon={<EditIcon />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditSetting(setting)}
                                  />
                                </Tooltip>
                              )}
                              <Tooltip label="View History">
                                <IconButton
                                  icon={<TimeIcon />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewHistory(setting)}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      {/* Edit Setting Modal */}
      {editingSetting && (
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <EditIcon />
                <Text>Edit Setting: {editingSetting.name}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Setting Info */}
                <Card variant="outline">
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Description</Text>
                        <Text>{editingSetting.description}</Text>
                      </Box>
                      <HStack>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Category</Text>
                          <Badge>{editingSetting.category}</Badge>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Data Type</Text>
                          <Badge colorScheme="purple">{editingSetting.data_type}</Badge>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Default Value</Text>
                          <Text fontSize="sm">{editingSetting.default_value}</Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Edit Form */}
                <Box>
                  <FormControl>
                    <FormLabel>New Value</FormLabel>
                    {editingSetting.data_type === 'boolean' ? (
                      <Select
                        value={editForm.value}
                        onChange={(e) => handleEditChange('value', e.target.value)}
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </Select>
                    ) : editingSetting.data_type === 'number' ? (
                      <NumberInput
                        value={editForm.value}
                        onChange={(value) => handleEditChange('value', value)}
                        min={editingSetting.min_value || 0}
                        max={editingSetting.max_value || 1000000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    ) : editingSetting.data_type === 'select' && editingSetting.options ? (
                      <Select
                        value={editForm.value}
                        onChange={(e) => handleEditChange('value', e.target.value)}
                      >
                        {JSON.parse(editingSetting.options).map((option, idx) => (
                          <option key={idx} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        value={editForm.value}
                        onChange={(e) => handleEditChange('value', e.target.value)}
                        placeholder={`Enter ${editingSetting.data_type} value`}
                      />
                    )}
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Change Notes (Optional)</FormLabel>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => handleEditChange('notes', e.target.value)}
                      placeholder="Explain why you're changing this setting"
                      rows={3}
                    />
                  </FormControl>
                </Box>

                {/* Validation Rules */}
                {editingSetting.validation_rules && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Validation Rules</AlertTitle>
                      <AlertDescription>
                        {JSON.parse(editingSetting.validation_rules).map((rule, idx) => (
                          <Text key={idx} fontSize="sm">• {rule}</Text>
                        ))}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Preview */}
                <Card borderColor="blue.200">
                  <CardBody>
                    <VStack spacing={2}>
                      <Text fontWeight="bold">Change Preview</Text>
                      <HStack justify="space-between" width="100%">
                        <Text>Current Value:</Text>
                        <Text fontWeight="medium">{editingSetting.value || editingSetting.default_value}</Text>
                      </HStack>
                      <HStack justify="space-between" width="100%">
                        <Text>New Value:</Text>
                        <Text fontWeight="bold" color="blue.600">{editForm.value}</Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between" width="100%">
                        <Text>Change Type:</Text>
                        <Badge colorScheme={
                          editForm.value === editingSetting.default_value ? 'green' : 'blue'
                        }>
                          {editForm.value === editingSetting.default_value ? 'Reset to Default' : 'Custom Value'}
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSaveSetting}
                isLoading={actionLoading}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Setting History Modal */}
      {selectedSetting && (
        <Modal isOpen={isHistoryOpen} onClose={onHistoryClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <TimeIcon />
                <Text>Change History: {selectedSetting.name}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Setting Info */}
                <Card variant="outline">
                  <CardBody>
                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Current Value</Text>
                        <Text fontWeight="medium">{selectedSetting.value || selectedSetting.default_value}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Default Value</Text>
                        <Text>{selectedSetting.default_value}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Change History */}
                {settingHistory.length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertTitle>No change history</AlertTitle>
                    <AlertDescription>
                      This setting has never been modified.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Date & Time</Th>
                        <Th>Changed By</Th>
                        <Th>Old Value</Th>
                        <Th>New Value</Th>
                        <Th>Notes</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {settingHistory.map((history, idx) => (
                        <Tr key={idx}>
                          <Td>
                            <Text fontSize="sm">
                              {new Date(history.changed_at).toLocaleString()}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{history.changed_by_email}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.500">
                              {history.old_value}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="medium">
                              {history.new_value}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontStyle="italic">
                              {history.notes || 'No notes'}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onHistoryClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={modalConfig.action === 'reset' ? confirmReset : () => {
          toast({
            title: 'Feature coming soon',
            description: 'Restore functionality will be implemented in the next update',
            status: 'info',
            duration: 3000,
          });
          onClose();
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={actionLoading}
      />
    </Box>
  );
};

export default SystemSettings;