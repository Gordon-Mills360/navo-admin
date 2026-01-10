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
  InputRightElement,
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
  IconButton, // Added missing IconButton
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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Tag,
  TagLabel,
  TagCloseButton,
  Avatar,
  AvatarGroup,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Code,
  Textarea,
  Spinner, // Added Spinner in case you need it
  Center, // Added Center in case you need it
} from '@chakra-ui/react';
import { 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaPercent, 
  FaUsers,
  FaClock,
  FaCog,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHistory,
  FaFilter,
  FaSortAmountDown,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaChartLine,
  FaWallet,
  FaExchangeAlt,
  FaShieldAlt,
  FaRandom,
  FaUserCheck,
  FaSave, // Already added
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer';
import SettingsMenu from '../../components/SettingsMenu';
import { supabase } from '../../services/supabase';
const PaymentSettings = () => {
  const toast = useToast();
  
  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    default_commission: 15,
    auto_release_payments: true,
    manual_release_enabled: true,
    refunds_enabled: true,
    min_withdrawal_amount: 50,
    max_withdrawal_amount: 5000,
    withdrawal_fee: 0,
    tax_rate: 0,
    peak_hour_commission: 20,
    peak_hours_start: '17:00',
    peak_hours_end: '20:00',
    payment_timeout: 30,
    currency: 'GHS',
  });
  
  // Driver commissions state
  const [driverCommissions, setDriverCommissions] = useState([]);
  const [commissionRules, setCommissionRules] = useState([]);
  
  // Payout settings state
  const [payoutSettings, setPayoutSettings] = useState({
    auto_payout_enabled: true,
    payout_schedule: 'daily',
    payout_methods: ['bank_transfer', 'mobile_money'],
    min_balance_for_payout: 100,
    max_payout_per_day: 10000,
    processing_fee: 1.5,
  });
  
  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  
  // Selected driver for custom commission
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [customCommission, setCustomCommission] = useState(15);
  
  // Modals
  const { isOpen: isDriverModalOpen, onOpen: onDriverModalOpen, onClose: onDriverModalClose } = useDisclosure();
  const { isOpen: isRuleModalOpen, onOpen: onRuleModalOpen, onClose: onRuleModalClose } = useDisclosure();
  const { isOpen: isPayoutModalOpen, onOpen: onPayoutModalOpen, onClose: onPayoutModalClose } = useDisclosure();
  const { isOpen: isTestModalOpen, onOpen: onTestModalOpen, onClose: onTestModalClose } = useDisclosure();
  
  // New commission rule
  const [newRule, setNewRule] = useState({
    name: '',
    condition_type: 'ride_count',
    condition_value: 0,
    commission_rate: 15,
    is_active: true,
  });
  
  // Test payment data
  const [testPayment, setTestPayment] = useState({
    amount: 100,
    commission_rate: 15,
    tax_rate: 0,
    processing_fee: 0,
  });
  
  // Fetch all payment settings
  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      
      const [settingsResult, commissionRulesResult, payoutSettingsResult] = await Promise.all([
        supabase.from('payment_settings').select('*').single(),
        supabase.from('commission_rules').select('*').order('created_at', { ascending: false }),
        supabase.from('payout_settings').select('*').single(),
      ]);
      
      if (settingsResult.error && settingsResult.error.code !== 'PGRST116') throw settingsResult.error;
      if (payoutSettingsResult.error && payoutSettingsResult.error.code !== 'PGRST116') throw payoutSettingsResult.error;
      
      if (settingsResult.data) {
        setPaymentSettings(settingsResult.data);
      }
      
      if (commissionRulesResult.data) {
        setCommissionRules(commissionRulesResult.data);
      }
      
      if (payoutSettingsResult.data) {
        setPayoutSettings(payoutSettingsResult.data);
      }
      
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch driver commissions
  const fetchDriverCommissions = async () => {
    try {
      setDriversLoading(true);
      
      const { data, error } = await supabase
        .from('driver_commissions')
        .select(`
          *,
          driver:driver_id (
            id,
            full_name,
            email,
            phone,
            vehicle_number
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setDriverCommissions(data);
      }
    } catch (error) {
      console.error('Error fetching driver commissions:', error);
    } finally {
      setDriversLoading(false);
    }
  };
  
  // Save payment settings
  const savePaymentSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          ...paymentSettings,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Payment settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Save payout settings
  const savePayoutSettings = async () => {
    try {
      const { error } = await supabase
        .from('payout_settings')
        .upsert({
          ...payoutSettings,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Payout settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onPayoutModalClose();
      
    } catch (error) {
      console.error('Error saving payout settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payout settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Set custom commission for driver
  const setDriverCommission = async () => {
    if (!selectedDriver || customCommission < 0 || customCommission > 100) {
      toast({
        title: 'Validation Error',
        description: 'Please select a driver and enter a valid commission (0-100%)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('driver_commissions')
        .upsert({
          driver_id: selectedDriver.id,
          commission_rate: customCommission,
          is_custom: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'driver_id'
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Custom commission set to ${customCommission}% for ${selectedDriver.full_name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setSelectedDriver(null);
      setCustomCommission(15);
      onDriverModalClose();
      fetchDriverCommissions();
      
    } catch (error) {
      console.error('Error setting driver commission:', error);
      toast({
        title: 'Error',
        description: 'Failed to set custom commission',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Create new commission rule
  const createCommissionRule = async () => {
    if (!newRule.name.trim() || newRule.commission_rate < 0 || newRule.commission_rate > 100) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all fields with valid values',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('commission_rules')
        .insert({
          name: newRule.name.trim(),
          condition_type: newRule.condition_type,
          condition_value: newRule.condition_value,
          commission_rate: newRule.commission_rate,
          is_active: newRule.is_active,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Commission rule created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setNewRule({
        name: '',
        condition_type: 'ride_count',
        condition_value: 0,
        commission_rate: 15,
        is_active: true,
      });
      
      onRuleModalClose();
      fetchPaymentSettings();
      
    } catch (error) {
      console.error('Error creating commission rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create commission rule',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Toggle commission rule
  const toggleCommissionRule = async (ruleId, isActive) => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Commission rule ${!isActive ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchPaymentSettings();
      
    } catch (error) {
      console.error('Error toggling commission rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update commission rule',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Delete commission rule
  const deleteCommissionRule = async (ruleId) => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', ruleId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Commission rule deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchPaymentSettings();
      
    } catch (error) {
      console.error('Error deleting commission rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete commission rule',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Reset driver to default commission
  const resetDriverCommission = async (driverId, driverName) => {
    try {
      const { error } = await supabase
        .from('driver_commissions')
        .delete()
        .eq('driver_id', driverId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Commission reset to default for ${driverName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchDriverCommissions();
      
    } catch (error) {
      console.error('Error resetting driver commission:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset commission',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Calculate test payment breakdown
  const calculateTestPayment = () => {
    const amount = testPayment.amount || 0;
    const commission = (amount * (testPayment.commission_rate || 0)) / 100;
    const tax = (amount * (testPayment.tax_rate || 0)) / 100;
    const processingFee = testPayment.processing_fee || 0;
    const driverEarnings = amount - commission - tax - processingFee;
    
    return {
      amount,
      commission,
      tax,
      processingFee,
      driverEarnings,
      platformEarnings: commission + tax + processingFee,
    };
  };
  
  // Handle setting change
  const handleSettingChange = (key, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle payout setting change
  const handlePayoutSettingChange = (key, value) => {
    setPayoutSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Refresh all data
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchPaymentSettings(), fetchDriverCommissions()])
      .finally(() => setTimeout(() => setRefreshing(false), 1000));
  };
  
  // Load data on component mount
  useEffect(() => {
    Promise.all([fetchPaymentSettings(), fetchDriverCommissions()]);
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('payment_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_settings' }, 
        fetchPaymentSettings
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'driver_commissions' }, 
        fetchDriverCommissions
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return (
      <PageContainer title="Payments & Commission" subtitle="Configure payment settings and commission rules">
        <Flex gap={6}>
          <SettingsMenu />
          <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="400px">
            <Text>Loading payment settings...</Text>
          </Box>
        </Flex>
      </PageContainer>
    );
  }
  
  const testPaymentBreakdown = calculateTestPayment();
  
  return (
    <PageContainer 
      title="Payments & Commission" 
      subtitle="Configure payment settings, commission rules, and payout settings"
    >
      <Flex gap={6}>
        <SettingsMenu />
        
        <Box flex={1}>
          {/* Header with stats */}
          <Card mb={6} borderColor="gray.200">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="md" color="gray.800">
                    Payment Configuration
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Commission: {paymentSettings.default_commission}% • Min Withdrawal: {paymentSettings.min_withdrawal_amount} {paymentSettings.currency}
                  </Text>
                </Box>
                <HStack spacing={3}>
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
                    leftIcon={<FaChartLine />}
                    colorScheme="brand"
                    size="sm"
                    onClick={onTestModalOpen}
                  >
                    Test Calculator
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
          
          <Tabs colorScheme="brand">
            <TabList>
              <Tab fontWeight="semibold">
                <Icon as={FaPercent} mr={2} />
                Commission Settings
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaUsers} mr={2} />
                Driver Commissions
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaWallet} mr={2} />
                Payout Settings
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaRandom} mr={2} />
                Commission Rules
              </Tab>
            </TabList>
            
            <TabPanels>
              {/* Tab 1: Commission Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Commission Configuration</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Default Commission Rate (%)
                          </FormLabel>
                          <NumberInput
                            value={paymentSettings.default_commission}
                            onChange={(value) => handleSettingChange('default_commission', parseInt(value) || 15)}
                            min={0}
                            max={50}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Percentage taken from each ride fare
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Peak Hour Commission Rate (%)
                          </FormLabel>
                          <NumberInput
                            value={paymentSettings.peak_hour_commission}
                            onChange={(value) => handleSettingChange('peak_hour_commission', parseInt(value) || 20)}
                            min={0}
                            max={50}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Applied during peak hours ({paymentSettings.peak_hours_start} - {paymentSettings.peak_hours_end})
                          </FormHelperText>
                        </FormControl>
                        
                        <HStack spacing={6}>
                          <FormControl flex={1}>
                            <FormLabel fontWeight="medium">Peak Hours Start</FormLabel>
                            <Input
                              type="time"
                              value={paymentSettings.peak_hours_start}
                              onChange={(e) => handleSettingChange('peak_hours_start', e.target.value)}
                            />
                          </FormControl>
                          
                          <FormControl flex={1}>
                            <FormLabel fontWeight="medium">Peak Hours End</FormLabel>
                            <Input
                              type="time"
                              value={paymentSettings.peak_hours_end}
                              onChange={(e) => handleSettingChange('peak_hours_end', e.target.value)}
                            />
                          </FormControl>
                        </HStack>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Tax Rate (%)</FormLabel>
                          <NumberInput
                            value={paymentSettings.tax_rate}
                            onChange={(value) => handleSettingChange('tax_rate', parseFloat(value) || 0)}
                            min={0}
                            max={30}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Tax applied to each ride (collected by platform)
                          </FormHelperText>
                        </FormControl>
                        
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Commission Calculation</AlertTitle>
                            <AlertDescription>
                              Total Platform Earnings = Commission + Tax + Processing Fees
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Payment Processing</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Auto-release Payments
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Automatically release payments to drivers after ride completion
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={paymentSettings.auto_release_payments}
                            onChange={(e) => handleSettingChange('auto_release_payments', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Manual Release Option
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Allow admins to manually release payments
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={paymentSettings.manual_release_enabled}
                            onChange={(e) => handleSettingChange('manual_release_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Enable Refunds
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Allow admins to issue refunds to passengers
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={paymentSettings.refunds_enabled}
                            onChange={(e) => handleSettingChange('refunds_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">Payment Timeout (minutes)</FormLabel>
                          <NumberInput
                            value={paymentSettings.payment_timeout}
                            onChange={(value) => handleSettingChange('payment_timeout', parseInt(value) || 30)}
                            min={1}
                            max={1440}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Time before pending payment is automatically cancelled
                          </FormHelperText>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Withdrawal Limits</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Minimum Withdrawal Amount ({paymentSettings.currency})
                          </FormLabel>
                          <NumberInput
                            value={paymentSettings.min_withdrawal_amount}
                            onChange={(value) => handleSettingChange('min_withdrawal_amount', parseFloat(value) || 50)}
                            min={0}
                            max={10000}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Minimum balance required for withdrawal request
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Maximum Withdrawal Amount ({paymentSettings.currency})
                          </FormLabel>
                          <NumberInput
                            value={paymentSettings.max_withdrawal_amount}
                            onChange={(value) => handleSettingChange('max_withdrawal_amount', parseFloat(value) || 5000)}
                            min={0}
                            max={50000}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Maximum amount per withdrawal transaction
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Withdrawal Fee ({paymentSettings.currency})
                          </FormLabel>
                          <NumberInput
                            value={paymentSettings.withdrawal_fee}
                            onChange={(value) => handleSettingChange('withdrawal_fee', parseFloat(value) || 0)}
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
                            Fixed fee charged per withdrawal (optional)
                          </FormHelperText>
                        </FormControl>
                      </VStack>
                    </CardBody>
                    <CardFooter pt={3}>
                      <Button
                        colorScheme="brand"
                        size="lg"
                        width="full"
                        isLoading={saving}
                        onClick={savePaymentSettings}
                        leftIcon={<FaSave />}
                      >
                        Save Payment Settings
                      </Button>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 2: Driver Commissions */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Driver Commission Overrides</Heading>
                        <Button
                          leftIcon={<FaPlus />}
                          colorScheme="brand"
                          size="sm"
                          onClick={onDriverModalOpen}
                        >
                          Set Custom Commission
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {driversLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading driver commissions...</Text>
                        </Box>
                      ) : driverCommissions.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No custom commissions</AlertTitle>
                            <AlertDescription>
                              All drivers use the default commission rate of {paymentSettings.default_commission}%
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Driver</Th>
                              <Th>Default Rate</Th>
                              <Th>Custom Rate</Th>
                              <Th>Status</Th>
                              <Th>Last Updated</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {driverCommissions.map((commission) => (
                              <Tr key={commission.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <Box>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {commission.driver?.full_name || 'Unknown Driver'}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      {commission.driver?.vehicle_number || 'No vehicle'}
                                    </Text>
                                  </Box>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {paymentSettings.default_commission}%
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      commission.commission_rate > paymentSettings.default_commission
                                        ? 'red'
                                        : commission.commission_rate < paymentSettings.default_commission
                                        ? 'green'
                                        : 'blue'
                                    }
                                    fontSize="sm"
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                  >
                                    {commission.commission_rate}%
                                  </Badge>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={commission.is_custom ? 'purple' : 'gray'}
                                    fontSize="xs"
                                  >
                                    {commission.is_custom ? 'Custom' : 'Default'}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color="gray.600">
                                    {new Date(commission.updated_at).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack spacing={2}>
                                    <Tooltip label="Reset to Default">
                                      <IconButton
                                        icon={<FaUndo />}
                                        colorScheme="gray"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Reset Commission"
                                        onClick={() => resetDriverCommission(commission.driver_id, commission.driver?.full_name)}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                    <CardFooter pt={3}>
                      <Text fontSize="sm" color="gray.600">
                        Showing {driverCommissions.length} drivers with custom commission rates
                      </Text>
                    </CardFooter>
                  </Card>
                  
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Commission Override Rules</AlertTitle>
                      <AlertDescription>
                        Custom commissions override default rates. Driver-specific rates apply to all their rides.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </TabPanel>
              
              {/* Tab 3: Payout Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Payout Configuration</Heading>
                        <Button
                          leftIcon={<FaCog />}
                          colorScheme="brand"
                          size="sm"
                          onClick={onPayoutModalOpen}
                        >
                          Configure Payouts
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <StatGroup>
                          <Stat>
                            <StatLabel>Auto Payout</StatLabel>
                            <StatNumber>
                              {payoutSettings.auto_payout_enabled ? 'Enabled' : 'Disabled'}
                            </StatNumber>
                            <StatHelpText>
                              {payoutSettings.payout_schedule}
                            </StatHelpText>
                          </Stat>
                          
                          <Stat>
                            <StatLabel>Min Balance</StatLabel>
                            <StatNumber>
                              {payoutSettings.min_balance_for_payout} {paymentSettings.currency}
                            </StatNumber>
                            <StatHelpText>
                              For payout request
                            </StatHelpText>
                          </Stat>
                          
                          <Stat>
                            <StatLabel>Processing Fee</StatLabel>
                            <StatNumber>
                              {payoutSettings.processing_fee}%
                            </StatNumber>
                            <StatHelpText>
                              Per transaction
                            </StatHelpText>
                          </Stat>
                        </StatGroup>
                        
                        <Divider />
                        
                        <Box>
                          <Text fontWeight="medium" mb={2}>Available Payout Methods:</Text>
                          <HStack spacing={2}>
                            {payoutSettings.payout_methods?.map((method) => (
                              <Badge key={method} colorScheme="green" px={2} py={1}>
                                {method.replace('_', ' ').toUpperCase()}
                              </Badge>
                            ))}
                          </HStack>
                        </Box>
                        
                        <Box>
                          <Text fontWeight="medium" mb={2}>Daily Payout Limit:</Text>
                          <Text fontSize="lg" color="brand.500">
                            {payoutSettings.max_payout_per_day} {paymentSettings.currency}
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Payout Schedule</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Text fontWeight="medium" mb={2}>
                            Current Schedule: <Badge colorScheme="blue">{payoutSettings.payout_schedule}</Badge>
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {payoutSettings.payout_schedule === 'daily' && 'Payouts processed every day at 2 AM'}
                            {payoutSettings.payout_schedule === 'weekly' && 'Payouts processed every Monday at 2 AM'}
                            {payoutSettings.payout_schedule === 'biweekly' && 'Payouts processed every 1st and 15th at 2 AM'}
                            {payoutSettings.payout_schedule === 'monthly' && 'Payouts processed on the 1st of each month at 2 AM'}
                          </Text>
                        </Box>
                        
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Processing Time</AlertTitle>
                            <AlertDescription>
                              Payouts typically take 1-3 business days to reach driver accounts.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 4: Commission Rules */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Dynamic Commission Rules</Heading>
                        <Button
                          leftIcon={<FaPlus />}
                          colorScheme="brand"
                          size="sm"
                          onClick={onRuleModalOpen}
                        >
                          Create Rule
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {commissionRules.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No commission rules</AlertTitle>
                            <AlertDescription>
                              Create rules to dynamically adjust commission rates based on conditions.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Rule Name</Th>
                              <Th>Condition</Th>
                              <Th>Commission</Th>
                              <Th>Status</Th>
                              <Th>Created</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {commissionRules.map((rule) => (
                              <Tr key={rule.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <Text fontWeight="medium" fontSize="sm">
                                    {rule.name}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {rule.condition_type === 'ride_count' && `After ${rule.condition_value} rides`}
                                    {rule.condition_type === 'total_earnings' && `Earnings > ${rule.condition_value} ${paymentSettings.currency}`}
                                    {rule.condition_type === 'rating' && `Rating > ${rule.condition_value}`}
                                    {rule.condition_type === 'vehicle_type' && `Vehicle: ${rule.condition_value}`}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      rule.commission_rate > paymentSettings.default_commission
                                        ? 'red'
                                        : rule.commission_rate < paymentSettings.default_commission
                                        ? 'green'
                                        : 'blue'
                                    }
                                    fontSize="sm"
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                  >
                                    {rule.commission_rate}%
                                  </Badge>
                                </Td>
                                <Td>
                                  <Switch
                                    colorScheme="brand"
                                    isChecked={rule.is_active}
                                    onChange={() => toggleCommissionRule(rule.id, rule.is_active)}
                                    size="sm"
                                  />
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color="gray.600">
                                    {new Date(rule.created_at).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <IconButton
                                    icon={<FaTrash />}
                                    colorScheme="red"
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Delete Rule"
                                    onClick={() => deleteCommissionRule(rule.id)}
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="sm">Rule Examples</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack p={3} bg="gray.50" borderRadius="md">
                          <Icon as={FaChartLine} color="green.500" />
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">High Volume Discount</Text>
                            <Text fontSize="xs" color="gray.600">
                              Reduce commission to 10% for drivers with over 100 rides/month
                            </Text>
                          </Box>
                        </HStack>
                        
                        <HStack p={3} bg="gray.50" borderRadius="md">
                          <Icon as={FaUserCheck} color="blue.500" />
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Quality Bonus</Text>
                            <Text fontSize="xs" color="gray.600">
                              Reduce commission to 12% for drivers with rating above 4.8
                            </Text>
                          </Box>
                        </HStack>
                        
                        <HStack p={3} bg="gray.50" borderRadius="md">
                          <Icon as={FaShieldAlt} color="purple.500" />
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Vehicle Premium</Text>
                            <Text fontSize="xs" color="gray.600">
                              Increase commission to 18% for luxury/special vehicles
                            </Text>
                          </Box>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
      
      {/* Modal for setting custom driver commission */}
      <Modal isOpen={isDriverModalOpen} onClose={onDriverModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set Custom Driver Commission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Select Driver</FormLabel>
                <Select
                  placeholder="Search for driver..."
                  onChange={(e) => {
                    const driver = JSON.parse(e.target.value);
                    setSelectedDriver(driver);
                    setCustomCommission(driver.custom_commission || paymentSettings.default_commission);
                  }}
                >
                  <option value={JSON.stringify({ id: 'default', full_name: 'All Drivers', custom_commission: paymentSettings.default_commission })}>
                    Apply to All Drivers
                  </option>
                  {/* In production, you would fetch drivers from Supabase */}
                  <option disabled>Driver search integration required</option>
                </Select>
                <FormHelperText>
                  Select a driver to set custom commission rate
                </FormHelperText>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Commission Rate (%)</FormLabel>
                <Slider
                  value={customCommission}
                  onChange={setCustomCommission}
                  min={0}
                  max={50}
                  step={1}
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="brand.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={6}>
                    <Box color="brand.500" as={FaPercent} />
                  </SliderThumb>
                  <SliderMark value={customCommission} mt={3} ml={-5} fontSize="sm">
                    {customCommission}%
                  </SliderMark>
                </Slider>
                <HStack justify="space-between" mt={2}>
                  <Text fontSize="sm" color="gray.600">0%</Text>
                  <Text fontSize="sm" color="gray.600">Default: {paymentSettings.default_commission}%</Text>
                  <Text fontSize="sm" color="gray.600">50%</Text>
                </HStack>
              </FormControl>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  This will override the default commission rate for selected driver.
                </AlertDescription>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDriverModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={setDriverCommission}
              isDisabled={!selectedDriver}
            >
              Set Custom Commission
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for creating commission rule */}
      <Modal isOpen={isRuleModalOpen} onClose={onRuleModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Commission Rule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Rule Name</FormLabel>
                <Input
                  placeholder="e.g., High Volume Discount, Quality Bonus"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                />
              </FormControl>
              
              <HStack spacing={4} width="100%">
                <FormControl flex={1} isRequired>
                  <FormLabel>Condition Type</FormLabel>
                  <Select
                    value={newRule.condition_type}
                    onChange={(e) => setNewRule({...newRule, condition_type: e.target.value})}
                  >
                    <option value="ride_count">Ride Count</option>
                    <option value="total_earnings">Total Earnings</option>
                    <option value="rating">Driver Rating</option>
                    <option value="vehicle_type">Vehicle Type</option>
                  </Select>
                </FormControl>
                
                <FormControl flex={1} isRequired>
                  <FormLabel>Condition Value</FormLabel>
                  <NumberInput
                    value={newRule.condition_value}
                    onChange={(value) => setNewRule({...newRule, condition_value: parseFloat(value) || 0})}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>
              
              <FormControl isRequired>
                <FormLabel>Commission Rate (%)</FormLabel>
                <NumberInput
                  value={newRule.commission_rate}
                  onChange={(value) => setNewRule({...newRule, commission_rate: parseFloat(value) || 15})}
                  min={0}
                  max={50}
                  step={0.5}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={newRule.is_active}
                  onChange={(e) => setNewRule({...newRule, is_active: e.target.checked})}
                  colorScheme="brand"
                  mr={3}
                />
                <FormLabel mb={0}>Rule is Active</FormLabel>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRuleModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={createCommissionRule}
            >
              Create Rule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for payout settings */}
      <Modal isOpen={isPayoutModalOpen} onClose={onPayoutModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Configure Payout Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel mb={1} fontWeight="medium">
                    Enable Auto Payouts
                  </FormLabel>
                  <FormHelperText fontSize="sm" color="gray.600">
                    Automatically process payouts on schedule
                  </FormHelperText>
                </Box>
                <Switch
                  colorScheme="brand"
                  isChecked={payoutSettings.auto_payout_enabled}
                  onChange={(e) => handlePayoutSettingChange('auto_payout_enabled', e.target.checked)}
                  size="lg"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontWeight="medium">Payout Schedule</FormLabel>
                <Select
                  value={payoutSettings.payout_schedule}
                  onChange={(e) => handlePayoutSettingChange('payout_schedule', e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Monday)</option>
                  <option value="biweekly">Bi-weekly (1st & 15th)</option>
                  <option value="monthly">Monthly (1st)</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel fontWeight="medium">
                  Minimum Balance for Payout ({paymentSettings.currency})
                </FormLabel>
                <NumberInput
                  value={payoutSettings.min_balance_for_payout}
                  onChange={(value) => handlePayoutSettingChange('min_balance_for_payout', parseFloat(value) || 100)}
                  min={0}
                  max={10000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel fontWeight="medium">
                  Maximum Daily Payout ({paymentSettings.currency})
                </FormLabel>
                <NumberInput
                  value={payoutSettings.max_payout_per_day}
                  onChange={(value) => handlePayoutSettingChange('max_payout_per_day', parseFloat(value) || 10000)}
                  min={100}
                  max={50000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel fontWeight="medium">Processing Fee (%)</FormLabel>
                <NumberInput
                  value={payoutSettings.processing_fee}
                  onChange={(value) => handlePayoutSettingChange('processing_fee', parseFloat(value) || 1.5)}
                  min={0}
                  max={10}
                  step={0.1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPayoutModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={savePayoutSettings}
            >
              Save Payout Settings
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for test payment calculator */}
      <Modal isOpen={isTestModalOpen} onClose={onTestModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Payment Calculator</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Ride Amount ({paymentSettings.currency})</FormLabel>
                <NumberInput
                  value={testPayment.amount}
                  onChange={(value) => setTestPayment({...testPayment, amount: parseFloat(value) || 100})}
                  min={0}
                  max={10000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel>Commission Rate (%)</FormLabel>
                  <NumberInput
                    value={testPayment.commission_rate}
                    onChange={(value) => setTestPayment({...testPayment, commission_rate: parseFloat(value) || 15})}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Tax Rate (%)</FormLabel>
                  <NumberInput
                    value={testPayment.tax_rate}
                    onChange={(value) => setTestPayment({...testPayment, tax_rate: parseFloat(value) || 0})}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Processing Fee ({paymentSettings.currency})</FormLabel>
                  <NumberInput
                    value={testPayment.processing_fee}
                    onChange={(value) => setTestPayment({...testPayment, processing_fee: parseFloat(value) || 0})}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              
              <Divider />
              
              <Card width="100%" borderColor="gray.200">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Ride Fare:</Text>
                      <Text>{testPaymentBreakdown.amount} {paymentSettings.currency}</Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text color="gray.600">Platform Commission:</Text>
                      <Text color="red.500">-{testPaymentBreakdown.commission} {paymentSettings.currency}</Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text color="gray.600">Tax:</Text>
                      <Text color="orange.500">-{testPaymentBreakdown.tax} {paymentSettings.currency}</Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text color="gray.600">Processing Fee:</Text>
                      <Text color="purple.500">-{testPaymentBreakdown.processingFee} {paymentSettings.currency}</Text>
                    </HStack>
                    
                    <Divider />
                    
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Driver Earnings:</Text>
                      <Text fontWeight="bold" color="green.500">
                        {testPaymentBreakdown.driverEarnings} {paymentSettings.currency}
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Platform Earnings:</Text>
                      <Text fontWeight="bold" color="brand.500">
                        {testPaymentBreakdown.platformEarnings} {paymentSettings.currency}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onTestModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default PaymentSettings;