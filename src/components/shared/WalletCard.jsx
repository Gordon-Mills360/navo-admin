import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Flex,
  Spacer,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  Progress,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider
} from '@chakra-ui/react';
import {
  WalletIcon,
  DollarIcon,
  CreditCardIcon,
  RepeatIcon,
  DownloadIcon,
  UploadIcon,
  LockIcon,
  UnlockIcon,
  ViewIcon,
  ViewOffIcon,
  EditIcon,
  CopyIcon,
  TimeIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  WarningIcon,
  InfoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  SettingsIcon,
  StarIcon
} from '@chakra-ui/icons';
import {
  FaWallet,
  FaMoneyBillWave,
  FaCreditCard,
  FaExchangeAlt,
  FaHistory,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaChartArea,
  FaFileExport,
  FaFileImport,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaReceipt,
  FaCalculator,
  FaPercentage,
  FaHandHoldingUsd,
  FaHandHoldingHeart,
  FaHandHoldingWater,
  FaHandHoldingMedical,
  FaHandHolding,
  FaHandsHelping,
  FaHandshake,
  FaHandPointRight,
  FaHandPointLeft,
  FaHandPointUp,
  FaHandPointDown,
  FaHandPaper,
  FaHandRock,
  FaHandScissors,
  FaHandLizard,
  FaHandSpock,
  FaHandPointer,
  FaHandMiddleFinger,
  FaHandPeace,
  FaHandshakeAlt,
  FaHandshakeAltSlash,
  FaHands,
  FaHandsWash,
  FaHandsHelping as FaHandsHelpingIcon,
  FaHandHoldingUsd as FaHandHoldingUsdIcon,
  FaHandHoldingHeart as FaHandHoldingHeartIcon,
  FaHandHoldingWater as FaHandHoldingWaterIcon,
  FaHandHoldingMedical as FaHandHoldingMedicalIcon,
  FaHandHolding as FaHandHoldingIcon,
  FaHandsHelping as FaHandsHelpingIcon2,
  FaHandshake as FaHandshakeIcon,
  FaHandPointRight as FaHandPointRightIcon,
  FaHandPointLeft as FaHandPointLeftIcon,
  FaHandPointUp as FaHandPointUpIcon,
  FaHandPointDown as FaHandPointDownIcon,
  FaHandPaper as FaHandPaperIcon,
  FaHandRock as FaHandRockIcon,
  FaHandScissors as FaHandScissorsIcon,
  FaHandLizard as FaHandLizardIcon,
  FaHandSpock as FaHandSpockIcon,
  FaHandPointer as FaHandPointerIcon,
  FaHandMiddleFinger as FaHandMiddleFingerIcon,
  FaHandPeace as FaHandPeaceIcon,
  FaHandshakeAlt as FaHandshakeAltIcon,
  FaHandshakeAltSlash as FaHandshakeAltSlashIcon,
  FaHands as FaHandsIcon,
  FaHandsWash as FaHandsWashIcon
} from 'react-icons/fa';

// Services
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';

// Utils
import { formatCurrency, formatDate } from '../../utils/formatters';

const WalletCard = ({
  wallet,
  showActions = true,
  onAction,
  compact = false,
  ...props
}) => {
  const [walletData, setWalletData] = useState(wallet);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  
  const { isOpen: isAdjustOpen, onOpen: onAdjustOpen, onClose: onAdjustClose } = useDisclosure();
  const { isOpen: isFreezeOpen, onOpen: onFreezeOpen, onClose: onFreezeClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  
  const [adjustForm, setAdjustForm] = useState({
    amount: '',
    type: 'credit',
    reason: '',
    notes: '',
    reference: ''
  });
  
  const toast = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Fetch wallet data if only ID provided
  useEffect(() => {
    const fetchWalletData = async () => {
      if (wallet && typeof wallet === 'string') {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('wallets')
            .select(`
              *,
              wallet_transactions(
                id,
                amount,
                type,
                status,
                description,
                created_at,
                reference_id
              ),
              user:user_id (
                id,
                first_name,
                last_name,
                email,
                phone,
                user_type
              )
            `)
            .eq('id', wallet)
            .single();
          
          if (error) throw error;
          setWalletData(data);
          
          if (data.wallet_transactions) {
            setTransactions(data.wallet_transactions.slice(0, 5));
          }
        } catch (error) {
          console.error('Error fetching wallet data:', error);
        } finally {
          setLoading(false);
        }
      } else if (wallet) {
        setWalletData(wallet);
        
        // Fetch recent transactions
        if (wallet.id) {
          fetchRecentTransactions(wallet.id);
        }
      }
    };
    
    fetchWalletData();
  }, [wallet]);

  const fetchRecentTransactions = async (walletId) => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Get user type icon
  const getUserTypeIcon = (userType) => {
    switch (userType?.toLowerCase()) {
      case 'driver': return '🚗';
      case 'passenger': return '👤';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  };

  // Get wallet status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'frozen': return 'red';
      case 'suspended': return 'orange';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit':
      case 'deposit':
      case 'refund':
      case 'cashback': return 'green';
      case 'debit':
      case 'withdrawal':
      case 'payment':
      case 'fee': return 'red';
      case 'transfer': return 'blue';
      case 'adjustment': return 'purple';
      default: return 'gray';
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit':
      case 'deposit': return <ArrowUpIcon color="green.500" />;
      case 'debit':
      case 'withdrawal': return <ArrowDownIcon color="red.500" />;
      case 'transfer': return <RepeatIcon color="blue.500" />;
      case 'refund': return <RepeatIcon color="green.500" />;
      case 'payment': return <DollarIcon color="red.500" />;
      case 'fee': return <WarningIcon color="orange.500" />;
      case 'adjustment': return <SettingsIcon color="purple.500" />;
      default: return <DollarIcon color="gray.500" />;
    }
  };

  // Handle wallet adjustment
  const handleAdjustWallet = async () => {
    if (!adjustForm.amount || !adjustForm.reason) {
      toast({
        title: 'Error',
        description: 'Amount and reason are required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      
      const amount = parseFloat(adjustForm.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const transactionAmount = adjustForm.type === 'credit' ? amount : -amount;
      const newBalance = walletData.balance + transactionAmount;

      // Start transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletData.id,
          user_id: walletData.user_id,
          amount: transactionAmount,
          type: 'adjustment',
          status: 'completed',
          description: `Manual adjustment: ${adjustForm.reason}`,
          notes: adjustForm.notes,
          reference_id: adjustForm.reference || `ADJ-${Date.now()}`,
          metadata: {
            adjusted_by: user.id,
            adjustment_type: adjustForm.type,
            previous_balance: walletData.balance,
            new_balance: newBalance,
            reason: adjustForm.reason
          },
          created_by: user.id
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
          last_updated_by: user.id
        })
        .eq('id', walletData.id);

      if (walletError) throw walletError;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'wallet_adjusted',
        resource_type: 'wallet',
        resource_id: walletData.id,
        details: {
          wallet_id: walletData.id,
          user_id: walletData.user_id,
          amount: transactionAmount,
          type: adjustForm.type,
          reason: adjustForm.reason,
          previous_balance: walletData.balance,
          new_balance: newBalance,
          transaction_id: transaction.id
        },
        ip_address: 'admin_panel'
      });

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: walletData.user_id,
        user_type: walletData.user?.user_type || 'user',
        title: 'Wallet Balance Adjusted',
        message: `Your wallet balance has been ${adjustForm.type === 'credit' ? 'increased' : 'decreased'} by ${formatCurrency(Math.abs(transactionAmount))}. Reason: ${adjustForm.reason}`,
        type: 'wallet',
        priority: 'high',
        metadata: {
          wallet_id: walletData.id,
          transaction_id: transaction.id,
          amount: transactionAmount,
          new_balance: newBalance
        },
        created_by: user.id
      });

      toast({
        title: 'Success',
        description: `Wallet balance ${adjustForm.type === 'credit' ? 'increased' : 'decreased'} by ${formatCurrency(amount)}`,
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setWalletData(prev => ({
        ...prev,
        balance: newBalance
      }));

      // Fetch updated transactions
      fetchRecentTransactions(walletData.id);

      // Reset form and close modal
      setAdjustForm({
        amount: '',
        type: 'credit',
        reason: '',
        notes: '',
        reference: ''
      });
      onAdjustClose();

      // Call onAction callback if provided
      if (onAction) {
        onAction('adjusted', {
          walletId: walletData.id,
          amount: transactionAmount,
          newBalance: newBalance
        });
      }

    } catch (error) {
      console.error('Error adjusting wallet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust wallet balance',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle freeze/unfreeze wallet
  const handleToggleFreeze = async () => {
    try {
      setActionLoading(true);
      
      const newStatus = walletData.status === 'frozen' ? 'active' : 'frozen';
      const action = newStatus === 'frozen' ? 'freeze' : 'unfreeze';

      const { error } = await supabase
        .from('wallets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          last_updated_by: user.id
        })
        .eq('id', walletData.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `wallet_${action}d`,
        resource_type: 'wallet',
        resource_id: walletData.id,
        details: {
          wallet_id: walletData.id,
          user_id: walletData.user_id,
          previous_status: walletData.status,
          new_status: newStatus,
          action_by: user.email
        },
        ip_address: 'admin_panel'
      });

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: walletData.user_id,
        user_type: walletData.user?.user_type || 'user',
        title: `Wallet ${action === 'freeze' ? 'Frozen' : 'Activated'}`,
        message: `Your wallet has been ${action === 'freeze' ? 'frozen. Contact support for details.' : 'activated and is now available for use.'}`,
        type: 'wallet',
        priority: 'high',
        metadata: {
          wallet_id: walletData.id,
          status: newStatus
        },
        created_by: user.id
      });

      toast({
        title: 'Success',
        description: `Wallet ${action}${action === 'freeze' ? 'n' : 'd'} successfully`,
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setWalletData(prev => ({
        ...prev,
        status: newStatus
      }));

      onFreezeClose();

      // Call onAction callback if provided
      if (onAction) {
        onAction(action === 'freeze' ? 'frozen' : 'unfrozen', {
          walletId: walletData.id,
          status: newStatus
        });
      }

    } catch (error) {
      console.error('Error toggling wallet freeze:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${walletData.status === 'frozen' ? 'unfreeze' : 'freeze'} wallet`,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Export transaction history
  const handleExportHistory = async (format) => {
    try {
      setActionLoading(true);
      
      // Fetch all transactions
      const { data: allTransactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = allTransactions.map(tx => ({
        'Date': formatDate(tx.created_at, 'datetime'),
        'Type': tx.type,
        'Amount': formatCurrency(tx.amount),
        'Status': tx.status,
        'Description': tx.description || '',
        'Reference': tx.reference_id || '',
        'Notes': tx.notes || ''
      }));

      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {});
        const csvRows = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(header => {
              const cell = row[header];
              const escaped = ('' + cell).replace(/"/g, '""');
              return `"${escaped}"`;
            }).join(',')
          )
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `wallet_${walletData.id}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }

      toast({
        title: 'Success',
        description: `Exported ${exportData.length} transactions`,
        status: 'success',
        duration: 3000,
      });

      onExportClose();

    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to export transactions',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy wallet ID
  const copyWalletId = () => {
    navigator.clipboard.writeText(walletData.id);
    toast({
      title: 'Copied',
      description: 'Wallet ID copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  if (loading) {
    return (
      <Card {...props}>
        <CardBody>
          <Text>Loading wallet data...</Text>
        </CardBody>
      </Card>
    );
  }

  if (!walletData) {
    return (
      <Card {...props}>
        <CardBody>
          <Text color="gray.500">No wallet data available</Text>
        </CardBody>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card {...props}>
        <CardBody>
          <VStack align="stretch" spacing={2}>
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Box fontSize="lg">💰</Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    {getUserTypeIcon(walletData.user?.user_type)} {walletData.user?.first_name} {walletData.user?.last_name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {walletData.user?.user_type}
                  </Text>
                </VStack>
              </HStack>
              
              <Badge colorScheme={getStatusColor(walletData.status)}>
                {walletData.status}
              </Badge>
            </Flex>
            
            <Divider />
            
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="gray.500">Balance</Text>
                <HStack>
                  {balanceVisible ? (
                    <Text fontSize="lg" fontWeight="bold">
                      {formatCurrency(walletData.balance)}
                    </Text>
                  ) : (
                    <Text fontSize="lg" fontWeight="bold">
                      ••••••
                    </Text>
                  )}
                  <IconButton
                    size="xs"
                    icon={balanceVisible ? <ViewOffIcon /> : <ViewIcon />}
                    aria-label="Toggle balance visibility"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    variant="ghost"
                  />
                </HStack>
              </VStack>
              
              {showActions && hasPermission('finance', 'adjust') && (
                <Menu>
                  <MenuButton as={IconButton} size="sm" icon={<SettingsIcon />} variant="ghost" />
                  <MenuList>
                    <MenuItem icon={<EditIcon />} onClick={onAdjustOpen}>
                      Adjust Balance
                    </MenuItem>
                    <MenuItem 
                      icon={walletData.status === 'frozen' ? <UnlockIcon /> : <LockIcon />} 
                      onClick={onFreezeOpen}
                    >
                      {walletData.status === 'frozen' ? 'Unfreeze' : 'Freeze'} Wallet
                    </MenuItem>
                    <MenuItem icon={<ExternalLinkIcon />} as="a" href={`/finance/wallets/${walletData.id}`}>
                      View Details
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </Flex>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card {...props}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Avatar
                size="md"
                name={`${walletData.user?.first_name} ${walletData.user?.last_name}`}
                src={walletData.user?.avatar_url}
              />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">
                  {walletData.user?.first_name} {walletData.user?.last_name}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {walletData.user?.email}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme={walletData.user?.user_type === 'driver' ? 'blue' : 'green'}>
                    {walletData.user?.user_type}
                  </Badge>
                  <Badge colorScheme={getStatusColor(walletData.status)}>
                    {walletData.status}
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            
            <HStack spacing={2}>
              <Tooltip label="Copy Wallet ID">
                <IconButton
                  size="sm"
                  icon={<CopyIcon />}
                  aria-label="Copy Wallet ID"
                  onClick={copyWalletId}
                  variant="ghost"
                />
              </Tooltip>
              
              <Tooltip label="Toggle balance visibility">
                <IconButton
                  size="sm"
                  icon={balanceVisible ? <ViewOffIcon /> : <ViewIcon />}
                  aria-label="Toggle balance visibility"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  variant="ghost"
                />
              </Tooltip>
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          <VStack align="stretch" spacing={4}>
            {/* Balance Statistics */}
            <SimpleGrid columns={2} spacing={4}>
              <Box p={4} borderWidth="1px" borderRadius="md">
                <Stat>
                  <StatLabel>Current Balance</StatLabel>
                  <StatNumber fontSize="2xl">
                    {balanceVisible ? formatCurrency(walletData.balance) : '••••••'}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type={walletData.balance >= 0 ? 'increase' : 'decrease'} />
                    Available funds
                  </StatHelpText>
                </Stat>
              </Box>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <Stat>
                  <StatLabel>Total Transactions</StatLabel>
                  <StatNumber>{transactions.length}</StatNumber>
                  <StatHelpText>
                    Last 30 days
                  </StatHelpText>
                </Stat>
              </Box>
            </SimpleGrid>
            
            {/* Recent Transactions */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontWeight="medium">Recent Transactions</Text>
                <Button size="sm" variant="link" onClick={onHistoryOpen}>
                  View All
                </Button>
              </Flex>
              
              {transactions.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                  {transactions.map((tx) => (
                    <HStack 
                      key={tx.id} 
                      p={2} 
                      borderWidth="1px" 
                      borderRadius="md"
                      justify="space-between"
                    >
                      <HStack spacing={3}>
                        <Box color={getTransactionTypeColor(tx.type)}>
                          {getTransactionIcon(tx.type)}
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {tx.type}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {tx.description || 'No description'}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <VStack align="end" spacing={0}>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold"
                          color={getTransactionTypeColor(tx.type)}
                        >
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(tx.created_at, 'date')}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  No recent transactions
                </Text>
              )}
            </Box>
          </VStack>
        </CardBody>
        
        {showActions && (
          <CardFooter borderTopWidth="1px">
            <HStack spacing={2} width="100%">
              {hasPermission('finance', 'adjust') && (
                <>
                  <Button
                    leftIcon={<EditIcon />}
                    colorScheme="blue"
                    onClick={onAdjustOpen}
                    flex={1}
                  >
                    Adjust Balance
                  </Button>
                  
                  <Button
                    leftIcon={walletData.status === 'frozen' ? <UnlockIcon /> : <LockIcon />}
                    colorScheme={walletData.status === 'frozen' ? 'green' : 'red'}
                    onClick={onFreezeOpen}
                    flex={1}
                  >
                    {walletData.status === 'frozen' ? 'Unfreeze' : 'Freeze'} Wallet
                  </Button>
                </>
              )}
              
              <Button
                leftIcon={<DownloadIcon />}
                variant="outline"
                onClick={onExportOpen}
                flex={1}
              >
                Export
              </Button>
              
              <Button
                leftIcon={<ExternalLinkIcon />}
                variant="outline"
                as="a"
                href={`/finance/wallets/${walletData.id}`}
                flex={1}
              >
                View Details
              </Button>
            </HStack>
          </CardFooter>
        )}
      </Card>
      
      {/* Adjust Balance Modal */}
      <Modal isOpen={isAdjustOpen} onClose={onAdjustClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adjust Wallet Balance</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Adjust the balance for {walletData.user?.first_name} {walletData.user?.last_name}
                </Text>
              </Alert>
              
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="credit">Credit (Add Funds)</option>
                    <option value="debit">Debit (Remove Funds)</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Amount</FormLabel>
                  <Input
                    type="number"
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl isRequired>
                <FormLabel>Reason</FormLabel>
                <Select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                >
                  <option value="">Select reason</option>
                  <option value="manual_adjustment">Manual Adjustment</option>
                  <option value="correction">Correction</option>
                  <option value="refund">Refund</option>
                  <option value="bonus">Bonus</option>
                  <option value="fee_waiver">Fee Waiver</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Reference/Transaction ID</FormLabel>
                <Input
                  value={adjustForm.reference}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Optional reference number"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this adjustment..."
                  rows={3}
                />
              </FormControl>
              
              <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text>Current Balance:</Text>
                    <Text fontWeight="bold">{formatCurrency(walletData.balance)}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text>Adjustment Amount:</Text>
                    <Text 
                      fontWeight="bold"
                      color={adjustForm.type === 'credit' ? 'green.500' : 'red.500'}
                    >
                      {adjustForm.type === 'credit' ? '+' : '-'}{formatCurrency(parseFloat(adjustForm.amount) || 0)}
                    </Text>
                  </HStack>
                  
                  <Divider />
                  
                  <HStack justify="space-between">
                    <Text>New Balance:</Text>
                    <Text fontWeight="bold">
                      {formatCurrency(
                        walletData.balance + 
                        (adjustForm.type === 'credit' ? 1 : -1) * (parseFloat(adjustForm.amount) || 0)
                      )}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAdjustClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAdjustWallet}
              isLoading={actionLoading}
              loadingText="Processing..."
            >
              Confirm Adjustment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Freeze/Unfreeze Confirmation Modal */}
      <Modal isOpen={isFreezeOpen} onClose={onFreezeClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {walletData.status === 'frozen' ? 'Unfreeze' : 'Freeze'} Wallet
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>
                  Are you sure you want to {walletData.status === 'frozen' ? 'unfreeze' : 'freeze'} this wallet?
                </Text>
              </Alert>
              
              <Text>
                {walletData.status === 'frozen' 
                  ? 'Unfreezing will allow the user to make transactions again.'
                  : 'Freezing will prevent the user from making any transactions.'}
              </Text>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">Wallet Details</Text>
                  <HStack justify="space-between">
                    <Text>User:</Text>
                    <Text>{walletData.user?.first_name} {walletData.user?.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Current Balance:</Text>
                    <Text>{formatCurrency(walletData.balance)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Current Status:</Text>
                    <Badge colorScheme={getStatusColor(walletData.status)}>
                      {walletData.status}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFreezeClose}>
              Cancel
            </Button>
            <Button
              colorScheme={walletData.status === 'frozen' ? 'green' : 'red'}
              onClick={handleToggleFreeze}
              isLoading={actionLoading}
              loadingText="Processing..."
            >
              {walletData.status === 'frozen' ? 'Unfreeze Wallet' : 'Freeze Wallet'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={onExportClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export Transaction History</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text>Export wallet transaction history for {walletData.user?.first_name} {walletData.user?.last_name}</Text>
              </Alert>
              
              <FormControl>
                <FormLabel>Export Format</FormLabel>
                <Select defaultValue="csv">
                  <option value="csv">CSV (Comma Separated Values)</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="pdf">PDF Document</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Date Range</FormLabel>
                <HStack>
                  <Input type="date" placeholder="Start date" />
                  <Text>to</Text>
                  <Input type="date" placeholder="End date" />
                </HStack>
              </FormControl>
              
              <FormControl>
                <FormLabel>Transaction Types</FormLabel>
                <Select defaultValue="all">
                  <option value="all">All Transactions</option>
                  <option value="credits">Credits Only</option>
                  <option value="debits">Debits Only</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => handleExportHistory('csv')}
              isLoading={actionLoading}
              loadingText="Exporting..."
            >
              Export Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default WalletCard;