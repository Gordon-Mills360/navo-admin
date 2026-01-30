// admin-panel/src/pages/WalletManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useToast,
  IconButton,
  Tooltip,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  SearchIcon,
  DownloadIcon,
  LockIcon,
  UnlockIcon,
  EditIcon,
  ViewIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../utils/formatters';

const WalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const toast = useToast();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();
  
  // Load wallets
  const loadWallets = async (page = 1) => {
    try {
      setLoading(true);
      
      // Calculate offset for pagination
      const offset = (page - 1) * itemsPerPage;
      
      // Build query
      let query = supabase
        .from('wallets')
        .select(`
          *,
          profile:user_id (
            id,
            full_name,
            email,
            phone,
            role,
            account_status
          ),
          driver_wallet:driver_wallets!inner (
            total_earnings,
            available_balance,
            pending_withdrawals,
            total_withdrawn
          )
        `, { count: 'exact' });
      
      // Apply filters
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }
      
      // Apply search
      if (searchTerm) {
        query = query.or(`profile.full_name.ilike.%${searchTerm}%,profile.email.ilike.%${searchTerm}%`);
      }
      
      // Get total count first
      const { count } = await query;
      setTotalPages(Math.ceil(count / itemsPerPage));
      
      // Get paginated data
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
      if (error) throw error;
      
      setWallets(data || []);
      setFilteredWallets(data || []);
      
      // Load stats
      await loadStats();
      
    } catch (error) {
      console.error('Error loading wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallets',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load wallet statistics
  const loadStats = async () => {
    try {
      // Get wallet statistics
      const { data: statsData, error: statsError } = await supabase
        .from('wallets')
        .select('role, balance, is_active')
        .eq('is_active', true);
      
      if (statsError) throw statsError;
      
      const calculatedStats = {
        totalWallets: statsData.length,
        totalBalance: 0,
        passengerBalance: 0,
        driverBalance: 0,
        activeWallets: 0,
        lockedWallets: 0,
      };
      
      statsData.forEach(wallet => {
        calculatedStats.totalBalance += parseFloat(wallet.balance || 0);
        
        if (wallet.role === 'passenger') {
          calculatedStats.passengerBalance += parseFloat(wallet.balance || 0);
        } else if (wallet.role === 'driver') {
          calculatedStats.driverBalance += parseFloat(wallet.balance || 0);
        }
        
        calculatedStats.activeWallets++;
      });
      
      // Get locked wallets count
      const { count: lockedCount } = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true })
        .eq('is_locked', true);
      
      calculatedStats.lockedWallets = lockedCount || 0;
      
      setStats(calculatedStats);
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load wallet details
  const loadWalletDetails = async (walletId) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          profile:user_id (
            id,
            full_name,
            email,
            phone,
            role,
            account_status,
            created_at
          ),
          driver_wallet:driver_wallets!inner (
            total_earnings,
            available_balance,
            pending_withdrawals,
            total_withdrawn,
            last_withdrawal_date,
            last_withdrawal_amount
          ),
          transactions:wallet_transactions (
            id,
            transaction_type,
            source_type,
            amount,
            balance_before,
            balance_after,
            status,
            created_at,
            description
          )
        `)
        .eq('id', walletId)
        .single();
      
      if (error) throw error;
      
      setWalletDetails(data);
      onDetailsOpen();
      
    } catch (error) {
      console.error('Error loading wallet details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallet details',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle wallet action (lock/unlock)
  const handleWalletAction = async (action, walletId) => {
    try {
      const updates = {};
      
      if (action === 'lock') {
        updates.is_locked = true;
        updates.locked_reason = 'Locked by admin';
        updates.locked_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      } else if (action === 'unlock') {
        updates.is_locked = false;
        updates.locked_reason = null;
        updates.locked_until = null;
      } else if (action === 'deactivate') {
        updates.is_active = false;
      } else if (action === 'activate') {
        updates.is_active = true;
      }
      
      updates.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', walletId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Wallet ${action === 'lock' ? 'locked' : action === 'unlock' ? 'unlocked' : action === 'deactivate' ? 'deactivated' : 'activated'} successfully`,
        status: 'success',
        duration: 3000,
      });
      
      // Reload wallets
      loadWallets(currentPage);
      onActionClose();
      
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wallet',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle manual adjustment
  const handleManualAdjustment = async (walletId, adjustmentData) => {
    try {
      // In real implementation, call the transfer_between_wallets function
      // from admin wallet to user wallet
      toast({
        title: 'Adjustment Added',
        description: 'Manual adjustment has been queued for processing',
        status: 'info',
        duration: 3000,
      });
      
      onActionClose();
      
    } catch (error) {
      console.error('Error processing adjustment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process adjustment',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Build export query
      let query = supabase
        .from('wallets')
        .select(`
          id,
          balance,
          currency,
          role,
          is_active,
          is_locked,
          last_transaction_at,
          created_at,
          updated_at,
          profile:user_id (
            full_name,
            email,
            phone
          )
        `);
      
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convert to CSV
      const csvRows = [];
      const headers = [
        'Wallet ID',
        'User Name',
        'User Email',
        'User Phone',
        'Role',
        'Balance',
        'Currency',
        'Status',
        'Locked',
        'Last Transaction',
        'Created At',
        'Updated At'
      ];
      
      csvRows.push(headers.join(','));
      
      data.forEach(wallet => {
        const row = [
          wallet.id,
          wallet.profile?.full_name || '',
          wallet.profile?.email || '',
          wallet.profile?.phone || '',
          wallet.role,
          wallet.balance,
          wallet.currency,
          wallet.is_active ? 'Active' : 'Inactive',
          wallet.is_locked ? 'Yes' : 'No',
          wallet.last_transaction_at || '',
          wallet.created_at,
          wallet.updated_at
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        
        csvRows.push(row);
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallets_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast({
        title: 'Export Complete',
        description: 'Wallets data exported successfully',
        status: 'success',
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error exporting wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to export wallets data',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...wallets];
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(wallet => wallet.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(wallet => 
        statusFilter === 'active' ? wallet.is_active : !wallet.is_active
      );
    }
    
    setFilteredWallets(filtered);
  }, [wallets, roleFilter, statusFilter]);

  // Initial load
  useEffect(() => {
    loadWallets();
  }, []);

  // Handle search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        loadWallets(1);
      } else {
        loadWallets(currentPage);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <Box p={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Wallet Management</Heading>
        <Flex gap={3}>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={handleExport}
          >
            Export
          </Button>
        </Flex>
      </Flex>

      {/* Stats Cards */}
      {stats && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <Stat>
            <StatLabel>Total Wallets</StatLabel>
            <StatNumber>{stats.totalWallets}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Total Balance</StatLabel>
            <StatNumber>{formatCurrency(stats.totalBalance)}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Passenger Balance</StatLabel>
            <StatNumber>{formatCurrency(stats.passengerBalance)}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Driver Balance</StatLabel>
            <StatNumber>{formatCurrency(stats.driverBalance)}</StatNumber>
          </Stat>
        </SimpleGrid>
      )}

      {/* Filters */}
      <Flex gap={4} mb={6}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <Select
          w="200px"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="passenger">Passenger</option>
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
          <option value="system">System</option>
        </Select>
        
        <Select
          w="200px"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Flex>

      {/* Wallets Table */}
      <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : filteredWallets.length === 0 ? (
          <Flex justify="center" align="center" minH="200px">
            <Text color="gray.500">No wallets found</Text>
          </Flex>
        ) : (
          <>
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Balance</Th>
                  <Th>Status</Th>
                  <Th>Last Activity</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredWallets.map((wallet) => (
                  <Tr key={wallet.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <Box>
                        <Text fontWeight="medium">{wallet.profile?.full_name || 'N/A'}</Text>
                        <Text fontSize="sm" color="gray.600">{wallet.profile?.email}</Text>
                      </Box>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          wallet.role === 'driver' ? 'blue' :
                          wallet.role === 'passenger' ? 'green' :
                          wallet.role === 'admin' ? 'purple' : 'gray'
                        }
                      >
                        {wallet.role}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontWeight="bold">{formatCurrency(wallet.balance)}</Text>
                      {wallet.role === 'driver' && wallet.driver_wallet && (
                        <Text fontSize="sm" color="gray.600">
                          Earnings: {formatCurrency(wallet.driver_wallet.total_earnings)}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <Flex gap={2} align="center">
                        <Badge
                          colorScheme={wallet.is_active ? 'green' : 'red'}
                          variant="subtle"
                        >
                          {wallet.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {wallet.is_locked && (
                          <Badge colorScheme="orange" variant="subtle">
                            Locked
                          </Badge>
                        )}
                      </Flex>
                    </Td>
                    <Td>
                      {wallet.last_transaction_at ? (
                        <Text fontSize="sm">
                          {new Date(wallet.last_transaction_at).toLocaleDateString()}
                        </Text>
                      ) : (
                        <Text fontSize="sm" color="gray.500">Never</Text>
                      )}
                    </Td>
                    <Td>
                      <Flex gap={2}>
                        <Tooltip label="View Details">
                          <IconButton
                            aria-label="View wallet details"
                            icon={<ViewIcon />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => loadWalletDetails(wallet.id)}
                          />
                        </Tooltip>
                        
                        {wallet.is_locked ? (
                          <Tooltip label="Unlock Wallet">
                            <IconButton
                              aria-label="Unlock wallet"
                              icon={<UnlockIcon />}
                              size="sm"
                              colorScheme="green"
                              variant="ghost"
                              onClick={() => {
                                setSelectedWallet(wallet);
                                onActionOpen();
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip label="Lock Wallet">
                            <IconButton
                              aria-label="Lock wallet"
                              icon={<LockIcon />}
                              size="sm"
                              colorScheme="orange"
                              variant="ghost"
                              onClick={() => {
                                setSelectedWallet(wallet);
                                onActionOpen();
                              }}
                            />
                          </Tooltip>
                        )}
                        
                        <Tooltip label="Manual Adjustment">
                          <IconButton
                            aria-label="Manual adjustment"
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="purple"
                            variant="ghost"
                            onClick={() => {
                              setSelectedWallet(wallet);
                              // Open adjustment modal
                            }}
                          />
                        </Tooltip>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" p={4} borderTopWidth="1px">
                <Text color="gray.600">
                  Page {currentPage} of {totalPages}
                </Text>
                <Flex gap={2}>
                  <Button
                    leftIcon={<ChevronLeftIcon />}
                    size="sm"
                    isDisabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => prev - 1);
                      loadWallets(currentPage - 1);
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    rightIcon={<ChevronRightIcon />}
                    size="sm"
                    isDisabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => prev + 1);
                      loadWallets(currentPage + 1);
                    }}
                  >
                    Next
                  </Button>
                </Flex>
              </Flex>
            )}
          </>
        )}
      </Box>

      {/* Wallet Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Wallet Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {walletDetails && (
              <>
                <Flex gap={6} mb={6}>
                  <Box flex={1}>
                    <Text fontWeight="bold" mb={2}>User Information</Text>
                    <Text><strong>Name:</strong> {walletDetails.profile?.full_name || 'N/A'}</Text>
                    <Text><strong>Email:</strong> {walletDetails.profile?.email}</Text>
                    <Text><strong>Phone:</strong> {walletDetails.profile?.phone || 'N/A'}</Text>
                    <Text><strong>Role:</strong> {walletDetails.role}</Text>
                    <Text><strong>Account Status:</strong> {walletDetails.profile?.account_status || 'N/A'}</Text>
                  </Box>
                  
                  <Box flex={1}>
                    <Text fontWeight="bold" mb={2}>Wallet Information</Text>
                    <Text><strong>Balance:</strong> {formatCurrency(walletDetails.balance)}</Text>
                    <Text><strong>Currency:</strong> {walletDetails.currency}</Text>
                    <Text><strong>Status:</strong> {walletDetails.is_active ? 'Active' : 'Inactive'}</Text>
                    <Text><strong>Locked:</strong> {walletDetails.is_locked ? 'Yes' : 'No'}</Text>
                    {walletDetails.locked_reason && (
                      <Text><strong>Lock Reason:</strong> {walletDetails.locked_reason}</Text>
                    )}
                    <Text><strong>Created:</strong> {new Date(walletDetails.created_at).toLocaleDateString()}</Text>
                  </Box>
                </Flex>
                
                {walletDetails.role === 'driver' && walletDetails.driver_wallet && (
                  <Box mb={6}>
                    <Text fontWeight="bold" mb={2}>Driver Earnings</Text>
                    <SimpleGrid columns={2} spacing={4}>
                      <Stat>
                        <StatLabel>Total Earnings</StatLabel>
                        <StatNumber>{formatCurrency(walletDetails.driver_wallet.total_earnings)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Available Balance</StatLabel>
                        <StatNumber>{formatCurrency(walletDetails.driver_wallet.available_balance)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Pending Withdrawals</StatLabel>
                        <StatNumber>{formatCurrency(walletDetails.driver_wallet.pending_withdrawals)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Total Withdrawn</StatLabel>
                        <StatNumber>{formatCurrency(walletDetails.driver_wallet.total_withdrawn)}</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </Box>
                )}
                
                {walletDetails.transactions && walletDetails.transactions.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Recent Transactions</Text>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Type</Th>
                          <Th>Amount</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {walletDetails.transactions.slice(0, 5).map((tx) => (
                          <Tr key={tx.id}>
                            <Td>{new Date(tx.created_at).toLocaleDateString()}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  tx.transaction_type === 'credit' ? 'green' :
                                  tx.transaction_type === 'debit' ? 'red' : 'gray'
                                }
                              >
                                {tx.transaction_type}
                              </Badge>
                            </Td>
                            <Td>{formatCurrency(tx.amount)}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  tx.status === 'completed' ? 'green' :
                                  tx.status === 'pending' ? 'yellow' : 'red'
                                }
                              >
                                {tx.status}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onDetailsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Wallet Action Modal */}
      <Modal isOpen={isActionOpen} onClose={onActionClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedWallet?.is_locked ? 'Unlock Wallet' : 'Lock Wallet'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedWallet && (
              <Box>
                <Text mb={4}>
                  Are you sure you want to {selectedWallet.is_locked ? 'unlock' : 'lock'} the wallet for{' '}
                  <strong>{selectedWallet.profile?.full_name}</strong>?
                </Text>
                
                {!selectedWallet.is_locked && (
                  <FormControl mb={4}>
                    <FormLabel>Lock Reason</FormLabel>
                    <Select placeholder="Select reason">
                      <option value="suspicious_activity">Suspicious Activity</option>
                      <option value="payment_dispute">Payment Dispute</option>
                      <option value="account_verification">Account Verification Required</option>
                      <option value="manual_request">Manual Request</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>
                )}
                
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  {selectedWallet.is_locked
                    ? 'Unlocking will allow the user to use their wallet again.'
                    : 'Locking will prevent the user from using their wallet for payments and withdrawals.'}
                </Alert>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onActionClose}>
              Cancel
            </Button>
            <Button
              colorScheme={selectedWallet?.is_locked ? 'green' : 'orange'}
              onClick={() => {
                if (selectedWallet) {
                  handleWalletAction(
                    selectedWallet.is_locked ? 'unlock' : 'lock',
                    selectedWallet.id
                  );
                }
              }}
            >
              {selectedWallet?.is_locked ? 'Unlock Wallet' : 'Lock Wallet'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WalletManagement;