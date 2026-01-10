import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Switch,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
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
  Badge,
  Icon,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Code,
} from '@chakra-ui/react';
import { 
  FaCog, 
  FaGlobe, 
  FaMoneyBillWave, 
  FaMapMarkerAlt, 
  FaBell, 
  FaSave,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUserPlus,
  FaMotorcycle,
  FaDatabase,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaHistory,
  FaUndo,
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer';
import SettingsMenu from '../../components/SettingsMenu';
import { supabase } from '../../services/supabase';

const PlatformSettings = () => {
  const toast = useToast();
  
  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    app_name: 'NAVO',
    maintenance_mode: false,
    registrations_enabled: true,
    driver_signup_enabled: true,
    default_currency: 'GHS',
    default_country: 'Ghana',
    timezone: 'Africa/Accra',
    map_provider: 'google_maps',
    max_ride_distance: 50,
    min_ride_distance: 1,
    base_fare: 5,
    per_km_rate: 2,
    per_minute_rate: 0.5,
    platform_email: 'support@navo.com',
    platform_phone: '+233 123 456 789',
    support_hours: '24/7',
    terms_url: 'https://navo.com/terms',
    privacy_url: 'https://navo.com/privacy',
  });
  
  // Countries and currencies
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [timezones, setTimezones] = useState([]);
  
  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real-time connection status
  const [realtimeStatus, setRealtimeStatus] = useState('connected');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Modals
  const { isOpen: isResetModalOpen, onOpen: onResetModalOpen, onClose: onResetModalClose } = useDisclosure();
  const { isOpen: isHistoryModalOpen, onOpen: onHistoryModalOpen, onClose: onHistoryModalClose } = useDisclosure();
  
  // Settings history
  const [settingsHistory, setSettingsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Fetch platform settings from database
  const fetchPlatformSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setPlatformSettings(data);
        setLastUpdated(new Date(data.updated_at || data.created_at));
      }
      
      // Fetch reference data
      await Promise.all([
        fetchCountries(),
        fetchCurrencies(),
        fetchTimezones(),
      ]);
      
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch countries list
  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('code, name')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setCountries(data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };
  
  // Fetch currencies list
  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('code, name, symbol')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setCurrencies(data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };
  
  // Fetch timezones list
  const fetchTimezones = async () => {
    try {
      const { data, error } = await supabase
        .from('timezones')
        .select('name, offset')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setTimezones(data);
      }
    } catch (error) {
      console.error('Error fetching timezones:', error);
    }
  };
  
  // Fetch settings history
  const fetchSettingsHistory = async () => {
    try {
      setHistoryLoading(true);
      
      const { data, error } = await supabase
        .from('platform_settings_history')
        .select(`
          *,
          changed_by:changed_by (
            email,
            full_name
          )
        `)
        .order('changed_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setSettingsHistory(data);
      }
    } catch (error) {
      console.error('Error fetching settings history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Save platform settings
  const savePlatformSettings = async () => {
    try {
      setSaving(true);
      
      const user = await supabase.auth.getUser();
      const adminId = user.data.user?.id;
      
      // Get current settings to compare
      const { data: currentData } = await supabase
        .from('platform_settings')
        .select('*')
        .single();
      
      // Prepare settings for save
      const settingsToSave = {
        ...platformSettings,
        updated_at: new Date().toISOString(),
        updated_by: adminId,
      };
      
      const { error } = await supabase
        .from('platform_settings')
        .upsert(settingsToSave);
      
      if (error) throw error;
      
      // Log changes to history if there were changes
      if (currentData) {
        const changes = {};
        Object.keys(platformSettings).forEach(key => {
          if (platformSettings[key] !== currentData[key]) {
            changes[key] = {
              from: currentData[key],
              to: platformSettings[key]
            };
          }
        });
        
        if (Object.keys(changes).length > 0) {
          await supabase
            .from('platform_settings_history')
            .insert({
              changed_by: adminId,
              changes: changes,
              ip_address: await getClientIP(),
              user_agent: navigator.userAgent,
            });
        }
      }
      
      // Update real-time status
      setRealtimeStatus('saved');
      setLastUpdated(new Date());
      
      toast({
        title: 'Success',
        description: 'Platform settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Apply real-time changes to mobile apps
      await applyRealtimeChanges();
      
    } catch (error) {
      console.error('Error saving platform settings:', error);
      setRealtimeStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to save platform settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Apply real-time changes to mobile apps
  const applyRealtimeChanges = async () => {
    try {
      // Broadcast changes via Supabase realtime
      const { error } = await supabase
        .channel('platform_updates')
        .send({
          type: 'broadcast',
          event: 'platform_settings_updated',
          payload: {
            settings: platformSettings,
            timestamp: new Date().toISOString(),
          }
        });
      
      if (error) throw error;
      
      // Update mobile app configs (this would be handled by backend in production)
      console.log('Real-time changes applied to mobile apps');
      
    } catch (error) {
      console.error('Error applying real-time changes:', error);
    }
  };
  
  // Reset to default settings
  const resetToDefaults = async () => {
    try {
      const defaultSettings = {
        app_name: 'NAVO',
        maintenance_mode: false,
        registrations_enabled: true,
        driver_signup_enabled: true,
        default_currency: 'GHS',
        default_country: 'Ghana',
        timezone: 'Africa/Accra',
        map_provider: 'google_maps',
        max_ride_distance: 50,
        min_ride_distance: 1,
        base_fare: 5,
        per_km_rate: 2,
        per_minute_rate: 0.5,
        platform_email: 'support@navo.com',
        platform_phone: '+233 123 456 789',
        support_hours: '24/7',
        terms_url: 'https://navo.com/terms',
        privacy_url: 'https://navo.com/privacy',
      };
      
      setPlatformSettings(defaultSettings);
      
      toast({
        title: 'Settings Reset',
        description: 'Platform settings reset to defaults',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      onResetModalClose();
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle setting change
  const handleSettingChange = (key, value) => {
    setPlatformSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Update real-time status
    setRealtimeStatus('pending');
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
  
  // Refresh all data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlatformSettings();
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchPlatformSettings();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('platform_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'platform_settings' }, 
        (payload) => {
          console.log('Platform settings changed:', payload);
          fetchPlatformSettings();
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return (
      <PageContainer title="Platform Settings" subtitle="Configure platform-wide settings and preferences">
        <Flex gap={6}>
          <SettingsMenu />
          <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="400px">
            <Text>Loading platform settings...</Text>
          </Box>
        </Flex>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      title="Platform Settings" 
      subtitle="Configure platform-wide settings, currency, timezone, and real-time behavior"
    >
      <Flex gap={6}>
        <SettingsMenu />
        
        <Box flex={1}>
          {/* Header with status */}
          <Card mb={6} borderColor="gray.200">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="md" color="gray.800">
                    Platform Configuration
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Changes apply instantly to mobile apps via Supabase realtime
                  </Text>
                </Box>
                <HStack spacing={3}>
                  <Badge
                    colorScheme={
                      realtimeStatus === 'connected' ? 'green' :
                      realtimeStatus === 'pending' ? 'yellow' :
                      realtimeStatus === 'saved' ? 'blue' : 'red'
                    }
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    <HStack spacing={1}>
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={
                          realtimeStatus === 'connected' ? 'green.500' :
                          realtimeStatus === 'pending' ? 'yellow.500' :
                          realtimeStatus === 'saved' ? 'blue.500' : 'red.500'
                        }
                      />
                      <Text fontSize="xs" textTransform="uppercase">
                        {realtimeStatus}
                      </Text>
                    </HStack>
                  </Badge>
                  
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
                  
                  <Button
                    leftIcon={<FaHistory />}
                    colorScheme="gray"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchSettingsHistory();
                      onHistoryModalOpen();
                    }}
                  >
                    History
                  </Button>
                </HStack>
              </Flex>
              
              {lastUpdated && (
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Last updated: {lastUpdated.toLocaleString()}
                </Text>
              )}
            </CardBody>
          </Card>
          
          <Tabs colorScheme="brand">
            <TabList>
              <Tab fontWeight="semibold">
                <Icon as={FaCog} mr={2} />
                Basic Settings
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaGlobe} mr={2} />
                Regional Settings
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaMapMarkerAlt} mr={2} />
                Map & Location
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaMoneyBillWave} mr={2} />
                Fare Settings
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaBell} mr={2} />
                Contact & Legal
              </Tab>
            </TabList>
            
            <TabPanels>
              {/* Tab 1: Basic Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Platform Configuration</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">Platform Name</FormLabel>
                          <Input
                            value={platformSettings.app_name}
                            onChange={(e) => handleSettingChange('app_name', e.target.value)}
                            placeholder="Enter platform name"
                          />
                          <FormHelperText>
                            Display name shown in mobile apps and website
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Maintenance Mode
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              When ON, mobile apps show maintenance screen
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={platformSettings.maintenance_mode}
                            onChange={(e) => handleSettingChange('maintenance_mode', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        {platformSettings.maintenance_mode && (
                          <Alert status="warning" borderRadius="md">
                            <AlertIcon />
                            <AlertTitle>Maintenance Mode Active!</AlertTitle>
                            <AlertDescription>
                              Users will see maintenance screen until you turn this off.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Enable New User Registrations
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Allow new passengers to sign up
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={platformSettings.registrations_enabled}
                            onChange={(e) => handleSettingChange('registrations_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Enable Driver Onboarding
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Allow new drivers to sign up and apply
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={platformSettings.driver_signup_enabled}
                            onChange={(e) => handleSettingChange('driver_signup_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        {!platformSettings.registrations_enabled && !platformSettings.driver_signup_enabled && (
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>
                              Both registrations are disabled. Only existing users can login.
                            </AlertDescription>
                          </Alert>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 2: Regional Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Regional & Localization</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">Default Country</FormLabel>
                          <Select
                            value={platformSettings.default_country}
                            onChange={(e) => handleSettingChange('default_country', e.target.value)}
                          >
                            {countries.length > 0 ? (
                              countries.map((country) => (
                                <option key={country.code} value={country.name}>
                                  {country.name}
                                </option>
                              ))
                            ) : (
                              <option value={platformSettings.default_country}>
                                {platformSettings.default_country}
                              </option>
                            )}
                          </Select>
                          <FormHelperText>
                            Primary country for operations
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Default Currency</FormLabel>
                          <Select
                            value={platformSettings.default_currency}
                            onChange={(e) => handleSettingChange('default_currency', e.target.value)}
                          >
                            {currencies.length > 0 ? (
                              currencies.map((currency) => (
                                <option key={currency.code} value={currency.code}>
                                  {currency.name} ({currency.symbol} {currency.code})
                                </option>
                              ))
                            ) : (
                              <option value={platformSettings.default_currency}>
                                {platformSettings.default_currency}
                              </option>
                            )}
                          </Select>
                          <FormHelperText>
                            Currency for fares and payments
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Platform Timezone</FormLabel>
                          <Select
                            value={platformSettings.timezone}
                            onChange={(e) => handleSettingChange('timezone', e.target.value)}
                          >
                            {timezones.length > 0 ? (
                              timezones.map((tz) => (
                                <option key={tz.name} value={tz.name}>
                                  {tz.name} (UTC{tz.offset})
                                </option>
                              ))
                            ) : (
                              <option value={platformSettings.timezone}>
                                {platformSettings.timezone}
                              </option>
                            )}
                          </Select>
                          <FormHelperText>
                            Server timezone for logs and scheduling
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Support Hours</FormLabel>
                          <Input
                            value={platformSettings.support_hours}
                            onChange={(e) => handleSettingChange('support_hours', e.target.value)}
                            placeholder="e.g., 9AM - 6PM, Monday to Friday"
                          />
                          <FormHelperText>
                            Displayed to users for support expectations
                          </FormHelperText>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 3: Map & Location */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Map & Location Services</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">Map Provider</FormLabel>
                          <Select
                            value={platformSettings.map_provider}
                            onChange={(e) => handleSettingChange('map_provider', e.target.value)}
                          >
                            <option value="google_maps">Google Maps</option>
                            <option value="mapbox">Mapbox</option>
                            <option value="openstreetmap">OpenStreetMap</option>
                          </Select>
                          <FormHelperText>
                            Map service for location and navigation
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Maximum Ride Distance (km)</FormLabel>
                          <NumberInput
                            value={platformSettings.max_ride_distance}
                            onChange={(value) => handleSettingChange('max_ride_distance', parseInt(value) || 50)}
                            min={1}
                            max={1000}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Maximum allowed distance for a single ride
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Minimum Ride Distance (km)</FormLabel>
                          <NumberInput
                            value={platformSettings.min_ride_distance}
                            onChange={(value) => handleSettingChange('min_ride_distance', parseInt(value) || 1)}
                            min={0.1}
                            max={50}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Minimum distance for fare calculation
                          </FormHelperText>
                        </FormControl>
                        
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Real-time Updates</AlertTitle>
                            <AlertDescription>
                              Map provider changes require mobile app update. Distance limits apply immediately.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 4: Fare Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Fare Calculation</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">Base Fare ({platformSettings.default_currency})</FormLabel>
                          <NumberInput
                            value={platformSettings.base_fare}
                            onChange={(value) => handleSettingChange('base_fare', parseFloat(value) || 5)}
                            min={0}
                            max={100}
                            step={0.5}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Fixed amount charged for every ride
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Per Kilometer Rate ({platformSettings.default_currency}/km)</FormLabel>
                          <NumberInput
                            value={platformSettings.per_km_rate}
                            onChange={(value) => handleSettingChange('per_km_rate', parseFloat(value) || 2)}
                            min={0.1}
                            max={20}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Rate charged for each kilometer traveled
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Per Minute Rate ({platformSettings.default_currency}/min)</FormLabel>
                          <NumberInput
                            value={platformSettings.per_minute_rate}
                            onChange={(value) => handleSettingChange('per_minute_rate', parseFloat(value) || 0.5)}
                            min={0}
                            max={5}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Rate charged for waiting time and traffic delays
                          </FormHelperText>
                        </FormControl>
                        
                        <Box p={4} bg="gray.50" borderRadius="md">
                          <Text fontWeight="medium" mb={2}>Fare Calculation Example:</Text>
                          <Text fontSize="sm" color="gray.600">
                            For a 10km ride taking 20 minutes:
                          </Text>
                          <Text fontSize="sm" color="gray.700" mt={1}>
                            Base Fare: {platformSettings.base_fare} {platformSettings.default_currency}
                            <br />
                            Distance: 10km × {platformSettings.per_km_rate} = {10 * platformSettings.per_km_rate} {platformSettings.default_currency}
                            <br />
                            Time: 20min × {platformSettings.per_minute_rate} = {20 * platformSettings.per_minute_rate} {platformSettings.default_currency}
                            <br />
                            <Text fontWeight="bold" mt={1}>
                              Total: {platformSettings.base_fare + (10 * platformSettings.per_km_rate) + (20 * platformSettings.per_minute_rate)} {platformSettings.default_currency}
                            </Text>
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 5: Contact & Legal */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Contact Information & Legal</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">Platform Email</FormLabel>
                          <Input
                            type="email"
                            value={platformSettings.platform_email}
                            onChange={(e) => handleSettingChange('platform_email', e.target.value)}
                            placeholder="support@example.com"
                          />
                          <FormHelperText>
                            Official contact email for support
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Platform Phone</FormLabel>
                          <Input
                            value={platformSettings.platform_phone}
                            onChange={(e) => handleSettingChange('platform_phone', e.target.value)}
                            placeholder="+233 XXX XXX XXX"
                          />
                          <FormHelperText>
                            Official contact phone number
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Terms of Service URL</FormLabel>
                          <Input
                            value={platformSettings.terms_url}
                            onChange={(e) => handleSettingChange('terms_url', e.target.value)}
                            placeholder="https://example.com/terms"
                          />
                          <FormHelperText>
                            Link to terms and conditions
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Privacy Policy URL</FormLabel>
                          <Input
                            value={platformSettings.privacy_url}
                            onChange={(e) => handleSettingChange('privacy_url', e.target.value)}
                            placeholder="https://example.com/privacy"
                          />
                          <FormHelperText>
                            Link to privacy policy
                          </FormHelperText>
                        </FormControl>
                        
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Legal Compliance</AlertTitle>
                            <AlertDescription>
                              Ensure URLs are valid and documents are up to date with local regulations.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {/* Save and Reset Buttons */}
          <Card mt={6} borderColor="gray.200">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="medium">Save Platform Settings</Text>
                  <Text fontSize="sm" color="gray.600">
                    Changes apply instantly to mobile apps
                  </Text>
                </Box>
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FaUndo />}
                    colorScheme="gray"
                    variant="outline"
                    onClick={onResetModalOpen}
                  >
                    Reset Defaults
                  </Button>
                  <Button
                    leftIcon={<FaSave />}
                    colorScheme="brand"
                    isLoading={saving}
                    onClick={savePlatformSettings}
                    size="lg"
                    px={8}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
        </Box>
      </Flex>
      
      {/* Modal for resetting to defaults */}
      <Modal isOpen={isResetModalOpen} onClose={onResetModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Platform Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Warning!</AlertTitle>
                <AlertDescription>
                  This will reset all platform settings to their default values. This action cannot be undone.
                </AlertDescription>
              </Box>
            </Alert>
            <Text color="gray.600" fontSize="sm">
              All custom configurations will be lost. Mobile apps will be updated in real-time.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onResetModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={resetToDefaults}
              leftIcon={<FaUndo />}
            >
              Reset to Defaults
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for settings history */}
      <Modal isOpen={isHistoryModalOpen} onClose={onHistoryModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Settings Change History</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {historyLoading ? (
              <Box textAlign="center" py={8}>
                <Text>Loading history...</Text>
              </Box>
            ) : settingsHistory.length === 0 ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>No history found</AlertTitle>
                  <AlertDescription>
                    Settings change history will appear here.
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Timestamp</Th>
                    <Th>Changed By</Th>
                    <Th>Changes</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {settingsHistory.map((history) => (
                    <Tr key={history.id}>
                      <Td>
                        <Text fontSize="xs" color="gray.600">
                          {new Date(history.changed_at).toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {history.changed_by?.email || 'System'}
                        </Text>
                      </Td>
                      <Td>
                        <Box maxW="300px" maxH="100px" overflowY="auto">
                          <Code fontSize="xs" whiteSpace="pre-wrap">
                            {JSON.stringify(history.changes, null, 2)}
                          </Code>
                        </Box>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onHistoryModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default PlatformSettings;