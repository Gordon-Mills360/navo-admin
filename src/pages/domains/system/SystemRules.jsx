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
  Radio,
  RadioGroup,
  Stack,
  Code,
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
  AddIcon,
  DeleteIcon,
  CopyIcon,
  ChevronRightIcon,
  CalendarIcon,
  WarningIcon,
  PlayIcon,
} from '@chakra-ui/icons';
import { FaCode, FaPercentage, FaMoneyBillWave, FaClock, FaStar, FaExchangeAlt } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useSystemSettings from '../../../hooks/useSystemSettings';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const SystemRules = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { getSystemRules, updateSystemRule, testSystemRule } = useSystemSettings();
  
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [testForm, setTestForm] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [ruleCategories, setRuleCategories] = useState([]);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const { 
    isOpen: isTestOpen, 
    onOpen: onTestOpen, 
    onClose: onTestClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });

  // Fetch system rules
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getSystemRules();
      
      if (fetchError) throw fetchError;
      
      // Organize rules by category
      const organizedRules = {};
      const categories = new Set();
      
      data.forEach(rule => {
        if (!organizedRules[rule.category]) {
          organizedRules[rule.category] = [];
        }
        organizedRules[rule.category].push(rule);
        categories.add(rule.category);
      });
      
      setRules(organizedRules);
      setRuleCategories(Array.from(categories));
      
    } catch (err) {
      console.error('Error fetching system rules:', err);
      setError('Failed to load system rules');
      toast({
        title: 'Error',
        description: 'Failed to load system rules',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getSystemRules, toast]);

  // Initial fetch
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Handle rule edit
  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setEditForm({
      name: rule.name,
      description: rule.description || '',
      rule_condition: rule.rule_condition,
      rule_action: rule.rule_action,
      priority: rule.priority,
      is_active: rule.is_active,
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

  // Save rule
  const handleSaveRule = async () => {
    if (!editingRule) return;
    
    setActionLoading(true);
    try {
      const { error } = await updateSystemRule(
        editingRule.id,
        editForm.rule_condition,
        editForm.rule_action,
        editForm.priority,
        editForm.is_active,
        editForm.notes
      );
      
      if (error) throw error;
      
      toast({
        title: 'Rule updated',
        description: `${editingRule.name} has been updated successfully`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh rules
      fetchRules();
      onEditClose();
      setEditingRule(null);
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'update_system_rule',
        resource_type: 'system_rule',
        resource_id: editingRule.id,
        details: { 
          rule_name: editingRule.name,
          category: editingRule.category,
          is_active: editForm.is_active 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to update rule',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle rule toggle
  const handleToggleRule = async (ruleId, currentStatus) => {
    setActionLoading(true);
    try {
      const { error } = await updateSystemRule(
        ruleId,
        null,
        null,
        null,
        !currentStatus,
        `Toggled by ${user.email}`
      );
      
      if (error) throw error;
      
      toast({
        title: 'Rule toggled',
        description: `Rule has been ${!currentStatus ? 'enabled' : 'disabled'}`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh rules
      fetchRules();
      
    } catch (err) {
      toast({
        title: 'Failed to toggle rule',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle test rule
  const handleTestRule = (rule) => {
    setSelectedRule(rule);
    setTestForm({
      test_input: '{}',
      expected_output: '',
    });
    setTestResult(null);
    onTestOpen();
  };

  // Run rule test
  const handleRunTest = async () => {
    if (!selectedRule) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await testSystemRule(
        selectedRule.id,
        testForm.test_input
      );
      
      if (error) throw error;
      
      setTestResult({
        success: true,
        output: data.output,
        execution_time: data.execution_time,
        matched: data.matched,
      });
      
      toast({
        title: 'Test completed',
        description: 'Rule test executed successfully',
        status: 'success',
        duration: 3000,
      });
      
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message,
      });
      
      toast({
        title: 'Test failed',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle duplicate rule
  const handleDuplicateRule = (rule) => {
    setSelectedRule(rule);
    setModalConfig({
      title: 'Duplicate Rule',
      message: `Are you sure you want to duplicate "${rule.name}"? A new rule with the same configuration will be created.`,
      action: 'duplicate',
      type: 'confirm',
    });
    onOpen();
  };

  // Handle delete rule
  const handleDeleteRule = (rule) => {
    setSelectedRule(rule);
    setModalConfig({
      title: 'Delete Rule',
      message: `Are you sure you want to delete "${rule.name}"? This action cannot be undone.`,
      action: 'delete',
      type: 'warning',
    });
    onOpen();
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category.toLowerCase()) {
      case 'pricing':
        return <FaMoneyBillWave />;
      case 'commission':
        return <FaPercentage />;
      case 'cancellation':
        return <FaClock />;
      case 'rating':
        return <FaStar />;
      case 'surge':
        return <FaExchangeAlt />;
      default:
        return <FaCode />;
    }
  };

  // Parse rule condition for display
  const parseRuleCondition = (condition) => {
    try {
      const parsed = JSON.parse(condition);
      return (
        <Code fontSize="xs" p={2} borderRadius="md" whiteSpace="pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </Code>
      );
    } catch {
      return (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          Invalid JSON
        </Text>
      );
    }
  };

  // Calculate rule statistics
  const calculateStats = () => {
    const allRules = Object.values(rules).flat();
    
    return {
      total: allRules.length,
      active: allRules.filter(r => r.is_active).length,
      pricing: allRules.filter(r => r.category === 'Pricing').length,
      commission: allRules.filter(r => r.category === 'Commission').length,
    };
  };

  const stats = calculateStats();

  if (loading && Object.keys(rules).length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading system rules...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load rules</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchRules} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Business Rules</Heading>
          <Text color="gray.600" mt={1}>
            Configure and manage business logic and automation rules
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchRules}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          {hasPermission('system', 'create') && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => {
                toast({
                  title: 'Feature coming soon',
                  description: 'Create new rule functionality will be available in the next update',
                  status: 'info',
                  duration: 3000,
                });
              }}
            >
              New Rule
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Rule Statistics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Rules</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
              <StatHelpText>
                {stats.active} active • {stats.total - stats.active} inactive
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pricing Rules</StatLabel>
              <StatNumber color="green.600">{stats.pricing}</StatNumber>
              <StatHelpText>
                Fare calculation and pricing
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Commission Rules</StatLabel>
              <StatNumber color="blue.600">{stats.commission}</StatNumber>
              <StatHelpText>
                Platform commission rates
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
                  const allRules = Object.values(rules).flat();
                  const lastUpdated = allRules.reduce((latest, rule) => {
                    const updated = new Date(rule.updated_at);
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

      {/* Rules by Category */}
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab>All Rules</Tab>
          {ruleCategories.map(category => (
            <Tab key={category}>
              <HStack spacing={2}>
                {getCategoryIcon(category)}
                <Text>{category}</Text>
              </HStack>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {/* All Rules Tab */}
          <TabPanel>
            {ruleCategories.map(category => (
              <Box key={category} mb={8}>
                <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}>
                  {getCategoryIcon(category)}
                  {category} Rules ({rules[category]?.length || 0})
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {rules[category]?.map(rule => (
                    <Card key={rule.id} borderLeft="4px solid" borderLeftColor={rule.is_active ? 'green.500' : 'gray.300'}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">{rule.name}</Text>
                            <Badge colorScheme={rule.is_active ? 'green' : 'gray'}>
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </HStack>
                          
                          <Text fontSize="sm" color="gray.500">
                            {rule.description}
                          </Text>
                          
                          <Box>
                            <Text fontSize="xs" color="gray.600">Priority</Text>
                            <Badge colorScheme="blue">P{rule.priority}</Badge>
                          </Box>
                          
                          <Box>
                            <Text fontSize="xs" color="gray.600">Last Executed</Text>
                            <Text fontSize="sm">
                              {rule.last_executed 
                                ? new Date(rule.last_executed).toLocaleDateString()
                                : 'Never'
                              }
                            </Text>
                          </Box>
                          
                          <Box>
                            <Text fontSize="xs" color="gray.600">Execution Count</Text>
                            <Progress 
                              value={Math.min((rule.execution_count || 0) / 100 * 100, 100)} 
                              size="xs" 
                              colorScheme="green"
                            />
                            <Text fontSize="xs" color="gray.500" textAlign="right">
                              {rule.execution_count || 0} times
                            </Text>
                          </Box>
                          
                          <Divider />
                          
                          <HStack spacing={2}>
                            <Tooltip label="Test Rule">
                              <IconButton
                                icon={<PlayIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTestRule(rule)}
                              />
                            </Tooltip>
                            {hasPermission('system', 'edit') && (
                              <Tooltip label="Edit Rule">
                                <IconButton
                                  icon={<EditIcon />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditRule(rule)}
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Duplicate Rule">
                              <IconButton
                                icon={<CopyIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDuplicateRule(rule)}
                              />
                            </Tooltip>
                            {hasPermission('system', 'delete') && (
                              <Tooltip label="Delete Rule">
                                <IconButton
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteRule(rule)}
                                />
                              </Tooltip>
                            )}
                            {hasPermission('system', 'toggle') && (
                              <Switch
                                size="sm"
                                isChecked={rule.is_active}
                                onChange={() => handleToggleRule(rule.id, rule.is_active)}
                              />
                            )}
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            ))}
          </TabPanel>

          {/* Individual Category Tabs */}
          {ruleCategories.map(category => (
            <TabPanel key={category}>
              <Box mb={4}>
                <Heading size="lg" mb={2}>{category} Rules</Heading>
                <Text color="gray.600" mb={6}>
                  Configure {category.toLowerCase()} related business rules
                </Text>
              </Box>
              
              <Card>
                <CardBody p={0}>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Rule Name</Th>
                        <Th>Condition</Th>
                        <Th>Action</Th>
                        <Th>Priority</Th>
                        <Th>Status</Th>
                        <Th>Executions</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {rules[category]?.map(rule => (
                        <Tr key={rule.id} _hover={{ bg: 'gray.50' }}>
                          <Td>
                            <Box>
                              <Text fontWeight="medium">{rule.name}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {rule.description}
                              </Text>
                            </Box>
                          </Td>
                          <Td>
                            <Box maxW="200px" overflow="hidden">
                              {parseRuleCondition(rule.rule_condition)}
                            </Box>
                          </Td>
                          <Td>
                            <Box maxW="200px" overflow="hidden">
                              <Code fontSize="xs" p={2} borderRadius="md" whiteSpace="pre-wrap">
                                {rule.rule_action}
                              </Code>
                            </Box>
                          </Td>
                          <Td>
                            <Badge colorScheme="blue">P{rule.priority}</Badge>
                          </Td>
                          <Td>
                            <HStack>
                              <Badge colorScheme={rule.is_active ? 'green' : 'gray'}>
                                {rule.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {hasPermission('system', 'toggle') && (
                                <Switch
                                  size="sm"
                                  isChecked={rule.is_active}
                                  onChange={() => handleToggleRule(rule.id, rule.is_active)}
                                  isDisabled={actionLoading}
                                />
                              )}
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm">{rule.execution_count || 0}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {rule.last_executed 
                                  ? new Date(rule.last_executed).toLocaleDateString()
                                  : 'Never'
                                }
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <Tooltip label="Test Rule">
                                <IconButton
                                  icon={<PlayIcon />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTestRule(rule)}
                                />
                              </Tooltip>
                              {hasPermission('system', 'edit') && (
                                <Tooltip label="Edit Rule">
                                  <IconButton
                                    icon={<EditIcon />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditRule(rule)}
                                  />
                                </Tooltip>
                              )}
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

      {/* Edit Rule Modal */}
      {editingRule && (
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <EditIcon />
                <Text>Edit Rule: {editingRule.name}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Rule Info */}
                <Card variant="outline">
                  <CardBody>
                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Category</Text>
                        <Badge>{editingRule.category}</Badge>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Created</Text>
                        <Text fontSize="sm">{new Date(editingRule.created_at).toLocaleDateString()}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Execution Count</Text>
                        <Text fontSize="sm">{editingRule.execution_count || 0}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Success Rate</Text>
                        <Text fontSize="sm">{editingRule.success_rate || 0}%</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Edit Form */}
                <FormControl>
                  <FormLabel>Rule Name</FormLabel>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    isReadOnly
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    rows={2}
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>Priority (1-100)</FormLabel>
                    <NumberInput
                      value={editForm.priority}
                      onChange={(value) => handleEditChange('priority', parseInt(value) || 1)}
                      min={1}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={editForm.is_active ? 'true' : 'false'}
                      onChange={(e) => handleEditChange('is_active', e.target.value === 'true')}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Rule Condition (JSON)</FormLabel>
                  <Textarea
                    value={editForm.rule_condition}
                    onChange={(e) => handleEditChange('rule_condition', e.target.value)}
                    fontFamily="mono"
                    fontSize="sm"
                    rows={6}
                    placeholder='{"field": "trip_distance", "operator": ">", "value": 10}'
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Use valid JSON format for rule conditions
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Rule Action (JavaScript)</FormLabel>
                  <Textarea
                    value={editForm.rule_action}
                    onChange={(e) => handleEditChange('rule_action', e.target.value)}
                    fontFamily="mono"
                    fontSize="sm"
                    rows={6}
                    placeholder="return baseFare * 1.2;"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    JavaScript code that returns the result
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Change Notes (Optional)</FormLabel>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => handleEditChange('notes', e.target.value)}
                    placeholder="Explain why you're changing this rule"
                    rows={3}
                  />
                </FormControl>

                {/* Validation */}
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Rule Validation</AlertTitle>
                    <AlertDescription>
                      Rules are validated before saving. Make sure your JSON condition and JavaScript action are valid.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSaveRule}
                isLoading={actionLoading}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Test Rule Modal */}
      {selectedRule && (
        <Modal isOpen={isTestOpen} onClose={onTestClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <PlayIcon />
                <Text>Test Rule: {selectedRule.name}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Rule Info */}
                <Card variant="outline">
                  <CardBody>
                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Condition</Text>
                        <Code fontSize="xs" p={1} borderRadius="md">
                          {selectedRule.rule_condition?.substring(0, 50)}...
                        </Code>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Action</Text>
                        <Code fontSize="xs" p={1} borderRadius="md">
                          {selectedRule.rule_action?.substring(0, 50)}...
                        </Code>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Test Input */}
                <FormControl>
                  <FormLabel>Test Input (JSON)</FormLabel>
                  <Textarea
                    value={testForm.test_input}
                    onChange={(e) => setTestForm({...testForm, test_input: e.target.value})}
                    fontFamily="mono"
                    fontSize="sm"
                    rows={6}
                    placeholder='{"trip_distance": 15, "base_fare": 10, "time_of_day": "peak"}'
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Enter JSON input data to test against the rule
                  </Text>
                </FormControl>

                {testResult && (
                  <Card borderColor={testResult.success ? 'green.200' : 'red.200'}>
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Test Result</Text>
                          <Badge colorScheme={testResult.success ? 'green' : 'red'}>
                            {testResult.success ? 'SUCCESS' : 'FAILED'}
                          </Badge>
                        </HStack>
                        
                        {testResult.success ? (
                          <>
                            <HStack justify="space-between">
                              <Text fontSize="sm">Condition Matched:</Text>
                              <Badge colorScheme={testResult.matched ? 'green' : 'gray'}>
                                {testResult.matched ? 'YES' : 'NO'}
                              </Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="sm">Execution Time:</Text>
                              <Text fontSize="sm">{testResult.execution_time}ms</Text>
                            </HStack>
                            <Box>
                              <Text fontSize="sm" color="gray.600">Output:</Text>
                              <Code fontSize="xs" p={2} borderRadius="md" display="block" whiteSpace="pre-wrap">
                                {JSON.stringify(testResult.output, null, 2)}
                              </Code>
                            </Box>
                          </>
                        ) : (
                          <Box>
                            <Text fontSize="sm" color="gray.600">Error:</Text>
                            <Code fontSize="xs" p={2} borderRadius="md" display="block" colorScheme="red">
                              {testResult.error}
                            </Code>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Example Inputs */}
                <Accordion allowToggle>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontSize="sm">Example Test Inputs</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Pricing Rule:</Text>
                          <Code fontSize="xs" p={2} borderRadius="md" display="block">
                            {`{
  "trip_distance": 15,
  "base_fare": 10,
  "time_of_day": "peak",
  "vehicle_type": "premium"
}`}
                          </Code>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Commission Rule:</Text>
                          <Code fontSize="xs" p={2} borderRadius="md" display="block">
                            {`{
  "driver_rating": 4.8,
  "total_rides": 150,
  "monthly_earnings": 2500
}`}
                          </Code>
                        </Box>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onTestClose}>
                Close
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleRunTest}
                isLoading={actionLoading}
                leftIcon={<PlayIcon />}
              >
                Run Test
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => {
          if (modalConfig.action === 'delete') {
            toast({
              title: 'Feature coming soon',
              description: 'Delete rule functionality will be available in the next update',
              status: 'info',
              duration: 3000,
            });
          } else if (modalConfig.action === 'duplicate') {
            toast({
              title: 'Feature coming soon',
              description: 'Duplicate rule functionality will be available in the next update',
              status: 'info',
              duration: 3000,
            });
          }
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

export default SystemRules;