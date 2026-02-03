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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RepeatIcon,
  LockIcon,
  UnlockIcon,
  AddIcon,
  MinusIcon,
  EyeIcon,
  ChevronRightIcon,
  CalendarIcon,
  AttachmentIcon,
} from '@chakra-ui/icons';
import { FaWallet, FaMoneyBillWave, FaExchangeAlt, FaUser, FaCar } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useFinance from '../../../hooks/useFinance';
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const Wallets = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { getWallets, adjustWalletBalance, getWalletStats } = useFinance();
  
  const toast = useToast();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isAdjustOpen, 
    onOpen: onAdjustOpen, 
    onClose: onAdjustClose 
  } = useDisclosure();
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });
  const [adjustForm, setAdjustForm] = useState({
    amount: '',
    type: 'credit',
    reason: '',
    description: '',
  });

  // Fetch wallets data
  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        userType: userTypeFilter === 'all' ? undefined : userTypeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      };
      
      const { data, error: fetchError } = await getWallets(filters);
      
      if (fetchError) throw fetchError;
      
      setWallets(data || []);
      
      // Fetch stats
      const { data: statsData } = await getWalletStats();
      setStats(statsData);
      
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('Failed to load wallets data');
      toast({
        title: 'Error',
        description: 'Failed to load wallets data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getWallets, getWalletStats, userTypeFilter, statusFilter, searchQuery, toast]);

  // Initial fetch
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Handle wallet status change
  const handleWalletStatusChange = async (walletId, newStatus) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);
      
      if (error) throw error;
      
      const actionText = newStatus === 'frozen' ? 'frozen' : 'unfrozen';
      
      toast({
        title: `Wallet ${actionText}`,
        description: `Wallet has been ${actionText} successfully`,
        status: 'success',
        duration: 3000,
      });
      
      // Update local state
      setWallets(prev => prev.map(w => 
        w.id === walletId ? { ...w, status: newStatus } : w
      ));
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `${actionText}_wallet`,
        resource_type: 'wallet',
        resource_id: walletId,
        details: { 
          wallet_id: walletId,
          new_status: newStatus 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to update wallet',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle wallet adjustment
  const handleAdjustWallet = (wallet) => {
    setSelectedWallet(wallet);
    setAdjustForm({
      amount: '',
      type: 'credit',
      reason: 'manual_adjustment',
      description: '',
    });
    onAdjustOpen();
  };

  // Handle adjust form submit
  const handleAdjustSubmit = async () => {
    if (!adjustForm.amount || parseFloat(adjustForm.amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid positive amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await adjustWalletBalance(
        selectedWallet.id,
        adjustForm.type,
        parseFloat(adjustForm.amount),
        adjustForm.reason,
        adjustForm.description
      );
      
      if (error) throw error;
      
      toast({
        title: 'Wallet adjusted',
        description: `Wallet balance has been ${adjustForm.type === 'credit' ? 'increased' : 'decreased'} by $${adjustForm.amount}`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh data
      fetchWallets();
      onAdjustClose();
      setSelectedWallet(null);
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'adjust_wallet_balance',
        resource_type: 'wallet',
        resource_id: selectedWallet.id,
        details: { 
          wallet_id: selectedWallet.id,
          user_name: selectedWallet.user_name,
          amount: adjustForm.amount,
          type: adjustForm.type,
          reason: adjustForm.reason 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to adjust wallet',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (wallet) => {
    setSelectedWallet(wallet);
    onDetailOpen();
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle export
  const handleExport = () => {
    toast({
      title: 'Exporting wallets',
      description: 'Wallet data will be exported to CSV',
      status: 'info',
      duration: 3000,
    });
  };

  // Calculate total balances
  const calculateTotals = () => {
    const totals = {
      drivers: 0,
      passengers: 0,
      frozen: 0,
      total: 0,
    };
    
    wallets.forEach(wallet => {
      totals.total += wallet.balance || 0;
      if (wallet.user_type === 'driver') {
        totals.drivers += wallet.balance || 0;
      } else if (wallet.user_type === 'passenger') {
        totals.passengers += wallet.balance || 0;
      }
      if (wallet.status === 'frozen') {
        totals.frozen += wallet.balance || 0;
      }
    });
    
    return totals;
  };

  const totals = calculateTotals();

  // Table columns configuration
  const columns = [
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
              {row.user_type === 'driver' ? 'Driver' : 'Passenger'} • {row.user_id}
            </Text>
          </Box>
        </HStack>
      ),
    },
    {
      header: 'Wallet ID',
      accessor: 'wallet_id',
      cell: (row) => (
        <Text fontFamily="mono" fontSize="sm">
          {row.wallet_id}
        </Text>
      ),
    },
    {
      header: 'Balance',
      accessor: 'balance',
      cell: (row) => (
        <Text fontWeight="bold" color={row.balance >= 0 ? 'green.600' : 'red.600'}>
          ${row.balance?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        let colorScheme = 'gray';
        let icon = <LockIcon />;
        
        switch(row.status) {
          case 'active':
            colorScheme = 'green';
            icon = <UnlockIcon />;
            break;
          case 'frozen':
            colorScheme = 'red';
            icon = <LockIcon />;
            break;
          case 'restricted':
            colorScheme = 'yellow';
            icon = <LockIcon />;
            break;
        }
        
        return (
          <Badge colorScheme={colorScheme} display="flex" alignItems="center" gap={1} w="fit-content">
            {icon}
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Last Transaction',
      accessor: 'last_transaction',
      cell: (row) => (
        row.last_transaction_date ? (
          <VStack align="start" spacing={0}>
            <Text fontSize="sm">{row.last_transaction_type}</Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(row.last_transaction_date).toLocaleDateString()}
            </Text>
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500">No transactions</Text>
        )
      ),
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
          {hasPermission('wallet', 'adjust') && (
            <Tooltip label="Adjust Balance">
              <IconButton
                icon={<FaExchangeAlt />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={() => handleAdjustWallet(row)}
              />
            </Tooltip>
          )}
          {hasPermission('wallet', 'freeze') && (
            <Tooltip label={row.status === 'frozen' ? 'Unfreeze Wallet' : 'Freeze Wallet'}>
              <IconButton
                icon={row.status === 'frozen' ? <UnlockIcon /> : <LockIcon />}
                size="sm"
                colorScheme={row.status === 'frozen' ? 'green' : 'red'}
                variant="ghost"
                onClick={() => handleWalletStatusChange(
                  row.id,
                  row.status === 'frozen' ? 'active' : 'frozen'
                )}
                isLoading={actionLoading}
              />
            </Tooltip>
          )}
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
            <StatLabel>Total Wallet Balance</StatLabel>
            <StatNumber color="green.600">
              ${totals.total.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              Across all wallets
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Driver Wallets</StatLabel>
            <StatNumber color="blue.600">
              ${totals.drivers.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              {wallets.filter(w => w.user_type === 'driver').length} wallets
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Passenger Wallets</StatLabel>
            <StatNumber color="purple.600">
              ${totals.passengers.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              {wallets.filter(w => w.user_type === 'passenger').length} wallets
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Frozen Balance</StatLabel>
            <StatNumber color="red.600">
              ${totals.frozen.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              {wallets.filter(w => w.status === 'frozen').length} wallets frozen
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  // Filtered wallets
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = searchQuery === '' || 
      wallet.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.wallet_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = userTypeFilter === 'all' || wallet.user_type === userTypeFilter;
    const matchesStatus = statusFilter === 'all' || wallet.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading && wallets.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading wallets data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load wallets</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchWallets} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Wallet Management</Heading>
          <Text color="gray.600" mt={1}>
            Manage user wallets, balances, and transactions
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchWallets}
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
                  placeholder="Search by name, ID, or wallet ID"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">User Type</FormLabel>
              <Select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Users</option>
                <option value="driver">Drivers</option>
                <option value="passenger">Passengers</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Wallet Status</FormLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
                <option value="restricted">Restricted</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Balance Range</FormLabel>
              <HStack>
                <Input
                  placeholder="Min"
                  size="sm"
                  onChange={(e) => {
                    // Implement balance range filter
                  }}
                />
                <Text fontSize="sm">to</Text>
                <Input
                  placeholder="Max"
                  size="sm"
                  onChange={(e) => {
                    // Implement balance range filter
                  }}
                />
              </HStack>
            </FormControl>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>All Wallets ({wallets.length})</Tab>
          <Tab>Driver Wallets ({wallets.filter(w => w.user_type === 'driver').length})</Tab>
          <Tab>Passenger Wallets ({wallets.filter(w => w.user_type === 'passenger').length})</Tab>
          <Tab>Frozen Wallets ({wallets.filter(w => w.status === 'frozen').length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredWallets}
              loading={loading}
              searchable={false} // Using our own search
              sortable
              pagination
              itemsPerPage={15}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredWallets.filter(w => w.user_type === 'driver')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={15}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredWallets.filter(w => w.user_type === 'passenger')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={15}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredWallets.filter(w => w.status === 'frozen')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={15}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Adjust Balance Modal */}
      {selectedWallet && (
        <Modal isOpen={isAdjustOpen} onClose={onAdjustClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Adjust Wallet Balance</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {/* Wallet Info */}
                <Card variant="outline" width="100%">
                  <CardBody>
                    <HStack justify="space-between">
                      <Box>
                        <Text fontWeight="bold">{selectedWallet.user_name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {selectedWallet.user_type === 'driver' ? 'Driver' : 'Passenger'} • {selectedWallet.user_id}
                        </Text>
                      </Box>
                      <Box textAlign="right">
                        <Text fontSize="sm" color="gray.600">Current Balance</Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.600">
                          ${selectedWallet.balance?.toFixed(2)}
                        </Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Adjustment Form */}
                <FormControl>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({...adjustForm, type: e.target.value})}
                  >
                    <option value="credit">Add Funds (Credit)</option>
                    <option value="debit">Remove Funds (Debit)</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Amount</FormLabel>
                  <NumberInput
                    value={adjustForm.amount}
                    onChange={(value) => setAdjustForm({...adjustForm, amount: value})}
                    min={0.01}
                    precision={2}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                  >
                    <option value="manual_adjustment">Manual Adjustment</option>
                    <option value="refund">Refund</option>
                    <option value="correction">Correction</option>
                    <option value="bonus">Bonus</option>
                    <option value="penalty">Penalty</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Description (Optional)</FormLabel>
                  <Textarea
                    value={adjustForm.description}
                    onChange={(e) => setAdjustForm({...adjustForm, description: e.target.value})}
                    placeholder="Enter description for this adjustment"
                    rows={3}
                  />
                </FormControl>

                {/* Preview */}
                {adjustForm.amount && parseFloat(adjustForm.amount) > 0 && (
                  <Card width="100%" borderColor="blue.200">
                    <CardBody>
                      <VStack spacing={2}>
                        <Text fontWeight="bold">Adjustment Preview</Text>
                        <HStack justify="space-between" width="100%">
                          <Text>Current Balance:</Text>
                          <Text fontWeight="medium">${selectedWallet.balance?.toFixed(2)}</Text>
                        </HStack>
                        <HStack justify="space-between" width="100%">
                          <Text>Adjustment:</Text>
                          <Text fontWeight="medium" color={adjustForm.type === 'credit' ? 'green.600' : 'red.600'}>
                            {adjustForm.type === 'credit' ? '+' : '-'}${adjustForm.amount}
                          </Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between" width="100%">
                          <Text fontWeight="bold">New Balance:</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            $
                            {adjustForm.type === 'credit' 
                              ? (selectedWallet.balance + parseFloat(adjustForm.amount)).toFixed(2)
                              : (selectedWallet.balance - parseFloat(adjustForm.amount)).toFixed(2)
                            }
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAdjustClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleAdjustSubmit}
                isLoading={actionLoading}
                isDisabled={!adjustForm.amount || parseFloat(adjustForm.amount) <= 0}
              >
                Apply Adjustment
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Wallet Details Modal */}
      {selectedWallet && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <FaWallet />
                <Text>Wallet Details</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Wallet Summary */}
                <SimpleGrid columns={2} spacing={4}>
                  <Card>
                    <CardBody>
                      <VStack align="center" spacing={2}>
                        <Text fontSize="sm" color="gray.600">Current Balance</Text>
                        <Heading size="2xl" color="green.600">
                          ${selectedWallet.balance?.toFixed(2)}
                        </Heading>
                        <Badge colorScheme={selectedWallet.status === 'active' ? 'green' : 'red'}>
                          {selectedWallet.status}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Wallet ID</Text>
                          <Text fontFamily="mono">{selectedWallet.wallet_id}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Created</Text>
                          <Text>{new Date(selectedWallet.created_at).toLocaleDateString()}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Last Updated</Text>
                          <Text>{new Date(selectedWallet.updated_at).toLocaleDateString()}</Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* User Information */}
                <Card>
                  <CardHeader pb={2}>
                    <Heading size="sm">User Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <HStack spacing={4}>
                      <Avatar
                        size="lg"
                        name={selectedWallet.user_name}
                        src={selectedWallet.user_profile_picture}
                      />
                      <Box flex={1}>
                        <Text fontWeight="bold">{selectedWallet.user_name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {selectedWallet.user_type === 'driver' ? 'Driver' : 'Passenger'} • {selectedWallet.user_id}
                        </Text>
                        <Text fontSize="sm">Email: {selectedWallet.user_email}</Text>
                        <Text fontSize="sm">Phone: {selectedWallet.user_phone}</Text>
                      </Box>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = selectedWallet.user_type === 'driver' 
                            ? `/accounts/driver/${selectedWallet.user_id}`
                            : `/accounts/passenger/${selectedWallet.user_id}`;
                          window.open(url, '_blank');
                        }}
                      >
                        View Profile
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader pb={2}>
                    <Heading size="sm">Recent Transactions</Heading>
                  </CardHeader>
                  <CardBody>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Type</Th>
                          <Th>Description</Th>
                          <Th isNumeric>Amount</Th>
                          <Th>Reference</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedWallet.recent_transactions?.length > 0 ? (
                          selectedWallet.recent_transactions.slice(0, 10).map((tx, idx) => (
                            <Tr key={idx}>
                              <Td>
                                <Text fontSize="xs">
                                  {new Date(tx.created_at).toLocaleDateString()}
                                </Text>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={tx.type === 'credit' ? 'green' : 'red'}
                                  variant="subtle"
                                >
                                  {tx.type}
                                </Badge>
                              </Td>
                              <Td>
                                <Text fontSize="sm">{tx.description}</Text>
                              </Td>
                              <Td isNumeric>
                                <Text
                                  fontWeight="medium"
                                  color={tx.type === 'credit' ? 'green.600' : 'red.600'}
                                >
                                  {tx.type === 'credit' ? '+' : '-'}${tx.amount?.toFixed(2)}
                                </Text>
                              </Td>
                              <Td>
                                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                                  {tx.reference?.substring(0, 8)}...
                                </Text>
                              </Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr>
                            <Td colSpan={5} textAlign="center" py={4}>
                              <Text color="gray.500">No recent transactions</Text>
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDetailClose}>
                Close
              </Button>
              {hasPermission('wallet', 'adjust') && (
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    onDetailClose();
                    handleAdjustWallet(selectedWallet);
                  }}
                >
                  Adjust Balance
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default Wallets;