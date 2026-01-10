import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Switch,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  FormControl,
  FormLabel,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tag,
  TagLabel,
  TagCloseButton,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
} from '@chakra-ui/react';
import { 
  FaShieldAlt, 
  FaClock, 
  FaBan, 
  FaDesktop, 
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaTrash,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer';
import SettingsMenu from '../../components/SettingsMenu';
import { supabase } from '../../services/supabase';

const SecuritySettings = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    forceAdmin2FA: false,
    forceDriverVerification: true,
    forceDocumentReVerification: false,
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumbers: true,
    autoBlockSuspicious: true,
  });
  
  // IP Blocking state
  const [ipAddresses, setIpAddresses] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [ipReason, setIpReason] = useState('');
  
  // Device blacklist state
  const [blacklistedDevices, setBlacklistedDevices] = useState([]);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [deviceReason, setDeviceReason] = useState('');
  
  // Compliance logs state
  const [complianceLogs, setComplianceLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Modals
  const { isOpen: isIpModalOpen, onOpen: onIpModalOpen, onClose: onIpModalClose } = useDisclosure();
  const { isOpen: isDeviceModalOpen, onOpen: onDeviceModalOpen, onClose: onDeviceModalClose } = useDisclosure();
  
  // Fetch security settings from database
  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      
      // Fetch from security_settings table
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      if (data) {
        setSecuritySettings({
          forceAdmin2FA: data.force_admin_2fa || false,
          forceDriverVerification: data.force_driver_verification || true,
          forceDocumentReVerification: data.force_document_reverification || false,
          sessionTimeout: data.session_timeout || 30,
          maxLoginAttempts: data.max_login_attempts || 5,
          passwordMinLength: data.password_min_length || 8,
          requireSpecialChar: data.require_special_char || true,
          requireNumbers: data.require_numbers || true,
          autoBlockSuspicious: data.auto_block_suspicious || true,
        });
      }
      
      // Fetch IP blocks
      const { data: ipData, error: ipError } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!ipError && ipData) {
        setIpAddresses(ipData);
      }
      
      // Fetch blacklisted devices
      const { data: deviceData, error: deviceError } = await supabase
        .from('blacklisted_devices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!deviceError && deviceData) {
        setBlacklistedDevices(deviceData);
      }
      
      // Fetch compliance logs
      fetchComplianceLogs();
      
    } catch (error) {
      console.error('Error fetching security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch compliance logs
  const fetchComplianceLogs = async () => {
    try {
      setLogsLoading(true);
      
      const { data, error } = await supabase
        .from('compliance_logs')
        .select(`
          *,
          admin:admin_id (
            email,
            full_name
          ),
          target_user:target_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setComplianceLogs(data);
      }
    } catch (error) {
      console.error('Error fetching compliance logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };
  
  // Save security settings
  const saveSecuritySettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('security_settings')
        .upsert({
          force_admin_2fa: securitySettings.forceAdmin2FA,
          force_driver_verification: securitySettings.forceDriverVerification,
          force_document_reverification: securitySettings.forceDocumentReVerification,
          session_timeout: securitySettings.sessionTimeout,
          max_login_attempts: securitySettings.maxLoginAttempts,
          password_min_length: securitySettings.passwordMinLength,
          require_special_char: securitySettings.requireSpecialChar,
          require_numbers: securitySettings.requireNumbers,
          auto_block_suspicious: securitySettings.autoBlockSuspicious,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Log the action
      await logComplianceAction('UPDATE_SECURITY_SETTINGS', null, {
        settings: securitySettings
      });
      
      toast({
        title: 'Success',
        description: 'Security settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save security settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Add IP to blocklist
  const addIpAddress = async () => {
    if (!newIp.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid IP address',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: newIp.trim(),
          reason: ipReason.trim() || 'Security violation',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (error) throw error;
      
      // Log the action
      await logComplianceAction('BLOCK_IP', null, {
        ip_address: newIp,
        reason: ipReason
      });
      
      toast({
        title: 'Success',
        description: `IP address ${newIp} blocked successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setNewIp('');
      setIpReason('');
      onIpModalClose();
      fetchSecuritySettings(); // Refresh data
      
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast({
        title: 'Error',
        description: 'Failed to block IP address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Remove IP from blocklist
  const removeIpAddress = async (id, ipAddress) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Log the action
      await logComplianceAction('UNBLOCK_IP', null, {
        ip_address: ipAddress
      });
      
      toast({
        title: 'Success',
        description: `IP address ${ipAddress} unblocked`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchSecuritySettings(); // Refresh data
      
    } catch (error) {
      console.error('Error unblocking IP:', error);
      toast({
        title: 'Error',
        description: 'Failed to unblock IP address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Add device to blacklist
  const addDeviceToBlacklist = async () => {
    if (!newDeviceId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a device ID',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('blacklisted_devices')
        .insert({
          device_id: newDeviceId.trim(),
          reason: deviceReason.trim() || 'Security violation',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (error) throw error;
      
      // Log the action
      await logComplianceAction('BLACKLIST_DEVICE', null, {
        device_id: newDeviceId,
        reason: deviceReason
      });
      
      toast({
        title: 'Success',
        description: `Device ${newDeviceId} blacklisted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setNewDeviceId('');
      setDeviceReason('');
      onDeviceModalClose();
      fetchSecuritySettings(); // Refresh data
      
    } catch (error) {
      console.error('Error blacklisting device:', error);
      toast({
        title: 'Error',
        description: 'Failed to blacklist device',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Remove device from blacklist
  const removeDeviceFromBlacklist = async (id, deviceId) => {
    try {
      const { error } = await supabase
        .from('blacklisted_devices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Log the action
      await logComplianceAction('UNBLACKLIST_DEVICE', null, {
        device_id: deviceId
      });
      
      toast({
        title: 'Success',
        description: `Device ${deviceId} removed from blacklist`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchSecuritySettings(); // Refresh data
      
    } catch (error) {
      console.error('Error removing device from blacklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove device from blacklist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Log compliance action
  const logComplianceAction = async (action, targetId = null, metadata = {}) => {
    try {
      const user = await supabase.auth.getUser();
      const adminId = user.data.user?.id;
      
      await supabase
        .from('compliance_logs')
        .insert({
          admin_id: adminId,
          action: action,
          target_id: targetId,
          metadata: metadata,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
        });
    } catch (error) {
      console.error('Error logging compliance action:', error);
    }
  };
  
  // Get client IP (simplified)
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };
  
  // Handle setting change
  const handleSettingChange = (key, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Refresh all data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSecuritySettings();
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchSecuritySettings();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('security_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'security_settings' }, 
        () => {
          fetchSecuritySettings();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocked_ips' }, 
        () => {
          fetchSecuritySettings();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blacklisted_devices' }, 
        () => {
          fetchSecuritySettings();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return (
      <PageContainer title="Security & Compliance" subtitle="Manage security settings and compliance logs">
        <Flex gap={6}>
          <SettingsMenu />
          <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="400px">
            <Text>Loading security settings...</Text>
          </Box>
        </Flex>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      title="Security & Compliance" 
      subtitle="Manage security settings, IP blocking, device management, and compliance logs"
    >
      <Flex gap={6}>
        <SettingsMenu />
        
        <Box flex={1}>
          {/* Header with refresh button */}
          <Card mb={6} borderColor="gray.200">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="md" color="gray.800">
                    Security Dashboard
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Real-time security monitoring and configuration
                  </Text>
                </Box>
                <Button
                  leftIcon={<FaSync />}
                  colorScheme="gray"
                  variant="outline"
                  size="sm"
                  isLoading={refreshing}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </Flex>
            </CardBody>
          </Card>
          
          <Tabs colorScheme="brand">
            <TabList>
              <Tab fontWeight="semibold">
                <Icon as={FaShieldAlt} mr={2} />
                Security Settings
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaBan} mr={2} />
                IP Blocking
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaDesktop} mr={2} />
                Device Management
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaHistory} mr={2} />
                Compliance Logs
              </Tab>
            </TabList>
            
            <TabPanels>
              {/* Tab 1: Security Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* Authentication Settings */}
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Authentication & Session</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Force 2FA for Admins
                            </FormLabel>
                            <FormHelperText fontSize="xs" color="gray.600">
                              Require all admin users to enable two-factor authentication
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={securitySettings.forceAdmin2FA}
                            onChange={(e) => handleSettingChange('forceAdmin2FA', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Force Driver Phone Verification
                            </FormLabel>
                            <FormHelperText fontSize="xs" color="gray.600">
                              Require phone verification for all drivers
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={securitySettings.forceDriverVerification}
                            onChange={(e) => handleSettingChange('forceDriverVerification', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Force Document Re-verification
                            </FormLabel>
                            <FormHelperText fontSize="xs" color="gray.600">
                              Periodically require drivers to re-upload documents
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={securitySettings.forceDocumentReVerification}
                            onChange={(e) => handleSettingChange('forceDocumentReVerification', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Session Timeout (minutes)
                          </FormLabel>
                          <NumberInput
                            value={securitySettings.sessionTimeout}
                            onChange={(value) => handleSettingChange('sessionTimeout', parseInt(value) || 30)}
                            min={5}
                            max={1440}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText fontSize="xs" color="gray.600">
                            Automatically logout inactive users after this time
                          </FormHelperText>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  {/* Password Policy */}
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Password Policy</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Minimum Password Length
                          </FormLabel>
                          <NumberInput
                            value={securitySettings.passwordMinLength}
                            onChange={(value) => handleSettingChange('passwordMinLength', parseInt(value) || 8)}
                            min={6}
                            max={32}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Require Special Characters
                            </FormLabel>
                            <FormHelperText fontSize="xs" color="gray.600">
                              Passwords must include !@#$%^&* etc.
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={securitySettings.requireSpecialChar}
                            onChange={(e) => handleSettingChange('requireSpecialChar', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Require Numbers
                            </FormLabel>
                            <FormHelperText fontSize="xs" color="gray.600">
                              Passwords must include at least one number
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={securitySettings.requireNumbers}
                            onChange={(e) => handleSettingChange('requireNumbers', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Maximum Login Attempts
                          </FormLabel>
                          <NumberInput
                            value={securitySettings.maxLoginAttempts}
                            onChange={(value) => handleSettingChange('maxLoginAttempts', parseInt(value) || 5)}
                            min={3}
                            max={10}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText fontSize="xs" color="gray.600">
                            Block IP after failed attempts
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Auto-block Suspicious Activity
                            </FormLabel>
                            <FormHelperText fontSize="xs" color="gray.600">
                              Automatically block IPs with suspicious patterns
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={securitySettings.autoBlockSuspicious}
                            onChange={(e) => handleSettingChange('autoBlockSuspicious', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                      </VStack>
                    </CardBody>
                    <CardFooter pt={3}>
                      <Button
                        colorScheme="brand"
                        size="lg"
                        width="full"
                        isLoading={saving}
                        onClick={saveSecuritySettings}
                        leftIcon={<FaCheckCircle />}
                      >
                        Save Security Settings
                      </Button>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 2: IP Blocking */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Blocked IP Addresses</Heading>
                        <Button
                          leftIcon={<FaPlus />}
                          colorScheme="brand"
                          size="sm"
                          onClick={onIpModalOpen}
                        >
                          Block New IP
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {ipAddresses.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No blocked IP addresses</AlertTitle>
                            <AlertDescription>
                              Add IP addresses to block them from accessing the platform.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>IP Address</Th>
                              <Th>Reason</Th>
                              <Th>Blocked On</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {ipAddresses.map((ip) => (
                              <Tr key={ip.id}>
                                <Td>
                                  <Tag colorScheme="red" size="md">
                                    {ip.ip_address}
                                  </Tag>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600">
                                    {ip.reason}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {new Date(ip.created_at).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <IconButton
                                    icon={<FaTrash />}
                                    colorScheme="red"
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Unblock IP"
                                    onClick={() => removeIpAddress(ip.id, ip.ip_address)}
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 3: Device Management */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Blacklisted Devices</Heading>
                        <Button
                          leftIcon={<FaPlus />}
                          colorScheme="brand"
                          size="sm"
                          onClick={onDeviceModalOpen}
                        >
                          Blacklist Device
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {blacklistedDevices.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No blacklisted devices</AlertTitle>
                            <AlertDescription>
                              Add device IDs to prevent them from accessing the platform.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Device ID</Th>
                              <Th>Reason</Th>
                              <Th>Blacklisted On</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {blacklistedDevices.map((device) => (
                              <Tr key={device.id}>
                                <Td>
                                  <Text fontFamily="mono" fontSize="sm">
                                    {device.device_id.substring(0, 20)}...
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600">
                                    {device.reason}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {new Date(device.created_at).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <IconButton
                                    icon={<FaTrash />}
                                    colorScheme="red"
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Remove from blacklist"
                                    onClick={() => removeDeviceFromBlacklist(device.id, device.device_id)}
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 4: Compliance Logs */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Compliance Activity Logs</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {logsLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading compliance logs...</Text>
                        </Box>
                      ) : complianceLogs.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No compliance logs</AlertTitle>
                            <AlertDescription>
                              Security actions will appear here.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Timestamp</Th>
                              <Th>Admin</Th>
                              <Th>Action</Th>
                              <Th>Target</Th>
                              <Th>Details</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {complianceLogs.map((log) => (
                              <Tr key={log.id}>
                                <Td>
                                  <Text fontSize="xs" color="gray.600">
                                    {new Date(log.created_at).toLocaleString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {log.admin?.email || 'System'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      log.action.includes('BLOCK') || log.action.includes('BLACKLIST')
                                        ? 'red'
                                        : log.action.includes('UPDATE')
                                        ? 'blue'
                                        : 'gray'
                                    }
                                    fontSize="xs"
                                  >
                                    {log.action.replace(/_/g, ' ')}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {log.target_user?.email || 'N/A'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color="gray.600" maxW="200px" isTruncated>
                                    {JSON.stringify(log.metadata)}
                                  </Text>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                    <CardFooter pt={3}>
                      <Button
                        variant="outline"
                        size="sm"
                        width="full"
                        onClick={fetchComplianceLogs}
                        isLoading={logsLoading}
                      >
                        Load More Logs
                      </Button>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
      
      {/* Modal for adding IP address */}
      <Modal isOpen={isIpModalOpen} onClose={onIpModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Block IP Address</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>IP Address</FormLabel>
                <Input
                  placeholder="e.g., 192.168.1.1 or 10.0.0.0/24"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                />
                <FormHelperText>
                  Enter IP address or CIDR notation for IP range
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Reason for Blocking</FormLabel>
                <Textarea
                  placeholder="e.g., Multiple failed login attempts, Suspicious activity"
                  value={ipReason}
                  onChange={(e) => setIpReason(e.target.value)}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onIpModalClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={addIpAddress}>
              Block IP Address
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for adding device to blacklist */}
      <Modal isOpen={isDeviceModalOpen} onClose={onDeviceModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Blacklist Device</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Device ID</FormLabel>
                <Input
                  placeholder="e.g., device_abc123xyz or firebase_token"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                />
                <FormHelperText>
                  Enter the device identifier from mobile app or Firebase token
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Reason for Blacklisting</FormLabel>
                <Textarea
                  placeholder="e.g., Fraudulent activity, Account sharing violation"
                  value={deviceReason}
                  onChange={(e) => setDeviceReason(e.target.value)}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeviceModalClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={addDeviceToBlacklist}>
              Blacklist Device
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default SecuritySettings;