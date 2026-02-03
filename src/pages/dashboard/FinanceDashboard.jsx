import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FaDollarSign,
  FaWallet,
  FaCreditCard,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaDownload,
  FaFilter,
  FaEllipsisV,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/shared/StatCard';
import DataTable from '../../components/shared/DataTable';

const FinanceDashboard = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    driverPayouts: 0,
    pendingPayouts: 0,
    walletBalances: 0,
    transactionCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      let startDate;
      switch (timeRange) {
        case 'today':
          startDate = startOfDay;
          break;
        case 'week':
          startDate = startOfWeek;
          break;
        case 'month':
          startDate = startOfMonth;
          break;
        default:
          startDate = startOfDay;
      }

      const [transactionsRes, paymentsRes, payoutsRes, walletsRes] = await Promise.all([
        supabase
          .from('wallet_transactions')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('payments')
          .select('amount, commission_amount, driver_earnings')
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString()),
        
        supabase
          .from('payouts')
          .select('amount, status')
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('wallets')
          .select('balance')
          .eq('owner_type', 'driver')
          .eq('status', 'active'),
      ]);

      // Calculate stats
      const payments = paymentsRes.data || [];
      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const platformCommission = payments.reduce((sum, p) => sum + (p.commission_amount || 0), 0);
      const driverPayouts = payments.reduce((sum, p) => sum + (p.driver_earnings || 0), 0);
      
      const payouts = payoutsRes.data || [];
      const pendingPayoutsAmount = payouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const wallets = walletsRes.data || [];
      const walletBalances = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

      setStats({
        totalRevenue,
        platformCommission,
        driverPayouts,
        pendingPayouts: pendingPayoutsAmount,
        walletBalances,
        transactionCount: transactionsRes.data?.length || 0,
      });

      setRecentTransactions(transactionsRes.data || []);
      setPendingPayouts(payouts.filter(p => p.status === 'pending'));
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();

    const subscription = supabase
      .channel('finance_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchFinanceData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, fetchFinanceData)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [timeRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'ride_payment':
      case 'bonus':
        return 'green';
      case 'refund':
      case 'penalty':
        return 'red';
      case 'ride_commission':
      case 'payout':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Finance Dashboard
            </Heading>
            <Text color="gray.600" mt={1}>
              Revenue, payments, and payout management
            </Text>
          </Box>
          <HStack spacing={3}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              size="sm"
              width="150px"
              borderRadius="lg"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </Select>
            <Button
              leftIcon={<FaDownload />}
              colorScheme="brand"
              size="sm"
              onClick={() => alert('Exporting data...')}
            >
              Export
            </Button>
          </HStack>
        </Flex>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={FaDollarSign}
            color="green"
            change={`${timeRange} earnings`}
            trend="up"
          />
          
          <StatCard
            title="Platform Commission"
            value={formatCurrency(stats.platformCommission)}
            icon={FaCreditCard}
            color="blue"
            change={`${((stats.platformCommission / stats.totalRevenue) * 100).toFixed(1)}% of revenue`}
            trend="up"
          />
          
          <StatCard
            title="Driver Payouts"
            value={formatCurrency(stats.driverPayouts)}
            icon={FaWallet}
            color="purple"
            change="Total paid to drivers"
            trend="up"
          />
          
          <StatCard
            title="Pending Payouts"
            value={formatCurrency(stats.pendingPayouts)}
            icon={FaClock}
            color="orange"
            change="Awaiting approval"
            trend="up"
          />
        </SimpleGrid>

        {/* Second Row Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Wallet Balances"
            value={formatCurrency(stats.walletBalances)}
            icon={FaWallet}
            color="teal"
            change="Total driver wallets"
            trend="up"
          />
          
          <StatCard
            title="Transactions"
            value={stats.transactionCount.toString()}
            icon={FaExchangeAlt}
            color="brand"
            change={`${timeRange} transactions`}
            trend="up"
          />
          
          <StatCard
            title="Success Rate"
            value="99.8%"
            icon={FaCheckCircle}
            color="green"
            change="Payment success"
            trend="stable"
          />
          
          <StatCard
            title="Avg Transaction"
            value={formatCurrency(stats.totalRevenue / Math.max(stats.transactionCount, 1))}
            icon={FaChartLine}
            color="purple"
            change="Per transaction"
            trend="up"
          />
        </SimpleGrid>

        {/* Recent Transactions & Pending Payouts Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Transactions */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Recent Transactions</Heading>
                <Badge colorScheme="brand" variant="subtle">
                  Live
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody pt={0} px={0}>
              <Box overflowX="auto" maxH="400px">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Type</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Time</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {recentTransactions.slice(0, 10).map((transaction) => (
                      <Tr key={transaction.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <Text fontFamily="mono" fontSize="xs">
                            {transaction.id.slice(0, 8)}...
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getTransactionColor(transaction.transaction_type)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {transaction.transaction_type.replace('_', ' ')}
                          </Badge>
                        </Td>
                        <Td>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color={transaction.transaction_type.includes('payment') ? 'green.600' : 'red.600'}
                          >
                            {formatCurrency(transaction.amount)}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={transaction.status === 'completed' ? 'green' : 'orange'}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {transaction.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(transaction.created_at)}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaFileInvoiceDollar />}
                variant="ghost"
                size="sm"
                w="100%"
                onClick={() => window.location.href = '/finance/transactions'}
              >
                View All Transactions
              </Button>
            </CardFooter>
          </Card>

          {/* Pending Payouts */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Pending Payouts</Heading>
                {pendingPayouts.length > 0 && (
                  <Badge colorScheme="orange" variant="solid">
                    {pendingPayouts.length}
                  </Badge>
                )}
              </Flex>
            </CardHeader>
            <CardBody>
              {pendingPayouts.length === 0 ? (
                <Box textAlign="center" py={8} color="gray.500">
                  <Icon as={FaCheckCircle} boxSize={8} mb={3} opacity={0.5} />
                  <Text>No pending payouts</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {pendingPayouts.slice(0, 5).map((payout) => (
                    <Flex
                      key={payout.id}
                      justify="space-between"
                      align="center"
                      p={3}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="orange.200"
                      bg="orange.50"
                      _hover={{ bg: 'orange.100' }}
                    >
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">
                          Payout #{payout.id.slice(0, 8)}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          Driver: {payout.driver_id?.slice(0, 8)}...
                        </Text>
                      </Box>
                      <HStack spacing={3}>
                        <Text fontWeight="bold" color="orange.700">
                          {formatCurrency(payout.amount)}
                        </Text>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FaEllipsisV />}
                            size="xs"
                            variant="ghost"
                          />
                          <MenuList minW="150px">
                            <MenuItem icon={<FaCheckCircle />} fontSize="sm">
                              Approve
                            </MenuItem>
                            <MenuItem icon={<FaTimesCircle />} fontSize="sm">
                              Reject
                            </MenuItem>
                            <MenuItem icon={<FaEye />} fontSize="sm">
                              View Details
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              )}
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaWallet />}
                variant="ghost"
                size="sm"
                w="100%"
                colorScheme="orange"
                onClick={() => window.location.href = '/finance/payouts'}
              >
                {pendingPayouts.length > 0 ? 'Process All Payouts' : 'Payout Dashboard'}
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>

        {/* Revenue Breakdown */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <Heading size="md">Revenue Breakdown</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Ride Payments
                </Text>
                <Progress
                  value={(stats.totalRevenue / Math.max(stats.totalRevenue + stats.platformCommission, 1)) * 100}
                  colorScheme="green"
                  size="lg"
                  borderRadius="full"
                />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  {formatCurrency(stats.totalRevenue)}
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Platform Commission
                </Text>
                <Progress
                  value={(stats.platformCommission / Math.max(stats.totalRevenue + stats.platformCommission, 1)) * 100}
                  colorScheme="blue"
                  size="lg"
                  borderRadius="full"
                />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  {formatCurrency(stats.platformCommission)}
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Driver Earnings
                </Text>
                <Progress
                  value={(stats.driverPayouts / Math.max(stats.totalRevenue, 1)) * 100}
                  colorScheme="purple"
                  size="lg"
                  borderRadius="full"
                />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  {formatCurrency(stats.driverPayouts)}
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Net Profit
                </Text>
                <Progress
                  value={((stats.platformCommission - stats.pendingPayouts) / Math.max(stats.platformCommission, 1)) * 100}
                  colorScheme="teal"
                  size="lg"
                  borderRadius="full"
                />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  {formatCurrency(stats.platformCommission - stats.pendingPayouts)}
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Button
            leftIcon={<FaWallet />}
            colorScheme="green"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/finance/payouts/process'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Process Payouts</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                Approve pending payments
              </Text>
            </Box>
          </Button>
          
          <Button
            leftIcon={<FaCreditCard />}
            colorScheme="blue"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/finance/refunds'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Handle Refunds</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                Process customer refunds
              </Text>
            </Box>
          </Button>
          
          <Button
            leftIcon={<FaFileInvoiceDollar />}
            colorScheme="purple"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/finance/reports'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Generate Reports</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                Financial statements
              </Text>
            </Box>
          </Button>
          
          <Button
            leftIcon={<FaFilter />}
            colorScheme="orange"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/finance/disputes'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Resolve Disputes</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                Payment disputes
              </Text>
            </Box>
          </Button>
        </SimpleGrid>
      </VStack>
    </Layout>
  );
};

export default FinanceDashboard;