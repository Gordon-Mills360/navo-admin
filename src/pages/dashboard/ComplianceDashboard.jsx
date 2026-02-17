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
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FaShieldAlt,
  FaUserCheck,
  FaUserTimes,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaEye,
  FaEdit,
  FaTrash,
  FaUser,
  FaCar,
  FaIdCard,
  FaEllipsisV,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useUserManagement } from '../../hooks/useUserManagement';
import { supabase } from '../../services/supabase';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/shared/StatCard';
import DataTable from '../../components/shared/DataTable';

const ComplianceDashboard = () => {
  const { admin } = useAuth();
  const { approveDriver, rejectDriver, suspendDriver, reinstateDriver } = useUserManagement();
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    approvedDrivers: 0,
    rejectedDrivers: 0,
    suspendedUsers: 0,
    flaggedAccounts: 0,
    complianceRate: 100,
  });
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [flaggedAccounts, setFlaggedAccounts] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      
      const [
        verificationsRes,
        driversRes,
        usersRes,
        flagsRes,
        actionsRes,
      ] = await Promise.all([
        supabase
          .from('driver_documents')
          .select(`
            *,
            driver:driver_id (full_name, email, phone)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('drivers')
          .select('id, status')
          .in('status', ['approved', 'rejected', 'suspended']),
        
        supabase
          .from('profiles')
          .select('id, status')
          .eq('status', 'suspended'),
        
        supabase
          .from('user_flags')
          .select(`
            *,
            user:user_id (full_name, email)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('admin_actions_log')
          .select('*')
          .in('resource_type', ['drivers', 'passengers', 'users'])
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const drivers = driversRes.data || [];
      const approvedDrivers = drivers.filter(d => d.status === 'approved').length;
      const rejectedDrivers = drivers.filter(d => d.status === 'rejected').length;
      const suspendedUsers = (usersRes.data || []).length;
      const flaggedAccountsCount = (flagsRes.data || []).length;

      setStats({
        pendingVerifications: verificationsRes.data?.length || 0,
        approvedDrivers,
        rejectedDrivers,
        suspendedUsers,
        flaggedAccounts: flaggedAccountsCount,
        complianceRate: approvedDrivers > 0 ? Math.round((approvedDrivers / drivers.length) * 100) : 100,
      });

      setPendingVerifications(verificationsRes.data || []);
      setFlaggedAccounts(flagsRes.data || []);
      setRecentActions(actionsRes.data || []);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();

    const subscription = supabase
      .channel('compliance_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_documents' }, fetchComplianceData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_flags' }, fetchComplianceData)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleApprove = async (verificationId, driverId) => {
    if (window.confirm('Approve this driver?')) {
      await approveDriver(driverId, { adminId: admin.id });
      fetchComplianceData();
    }
  };

  const handleReject = async (verificationId, driverId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      await rejectDriver(driverId, reason, admin.id);
      fetchComplianceData();
    }
  };

  const handleSuspend = async (userId, userType) => {
    const reason = prompt('Enter suspension reason:');
    if (reason) {
      await suspendDriver(userId, reason, admin.id);
      fetchComplianceData();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getFlagColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Compliance Dashboard
            </Heading>
            <Text color="gray.600" mt={1}>
              User verification, trust & safety management
            </Text>
          </Box>
          <Button
            leftIcon={<FaShieldAlt />}
            colorScheme="brand"
            size="sm"
            onClick={fetchComplianceData}
            isLoading={loading}
          >
            Refresh
          </Button>
        </Flex>

        {/* High Priority Alerts */}
        {flaggedAccounts.filter(f => f.severity === 'critical').length > 0 && (
          <Alert status="error" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Critical Flags</AlertTitle>
              <AlertDescription>
                {flaggedAccounts.filter(f => f.severity === 'critical').length} critical issues require immediate attention
              </AlertDescription>
            </Box>
            <Button colorScheme="red" size="sm" variant="solid">
              Review Now
            </Button>
          </Alert>
        )}

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Pending Verifications"
            value={stats.pendingVerifications.toString()}
            icon={FaClock}
            color="orange"
            change="Awaiting review"
            trend="up"
          />
          
          <StatCard
            title="Approved Drivers"
            value={stats.approvedDrivers.toString()}
            icon={FaUserCheck}
            color="green"
            change="Verified and active"
            trend="up"
          />
          
          <StatCard
            title="Suspended Users"
            value={stats.suspendedUsers.toString()}
            icon={FaUserTimes}
            color="red"
            change="Temporarily blocked"
            trend="up"
          />
          
          <StatCard
            title="Compliance Rate"
            value={`${stats.complianceRate}%`}
            icon={FaShieldAlt}
            color="brand"
            change="Verified users"
            trend="up"
          />
        </SimpleGrid>

        {/* Second Row Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Rejected Drivers"
            value={stats.rejectedDrivers.toString()}
            icon={FaBan}
            color="red"
            change="Failed verification"
            trend="up"
          />
          
          <StatCard
            title="Flagged Accounts"
            value={stats.flaggedAccounts.toString()}
            icon={FaExclamationTriangle}
            color="yellow"
            change="Requires investigation"
            trend="up"
          />
          
          <StatCard
            title="Document Reviews"
            value="24"
            icon={FaFileAlt}
            color="blue"
            change="Today"
            trend="down"
          />
          
          <StatCard
            title="Avg Review Time"
            value="2.3 hrs"
            icon={FaClock}
            color="purple"
            change="Per verification"
            trend="down"
          />
        </SimpleGrid>

        {/* Pending Verifications & Flagged Accounts Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Pending Verifications */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Pending Verifications</Heading>
                {pendingVerifications.length > 0 && (
                  <Badge colorScheme="orange" variant="solid">
                    {pendingVerifications.length}
                  </Badge>
                )}
              </Flex>
            </CardHeader>
            <CardBody pt={0} px={0}>
              <Box overflowX="auto" maxH="400px">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Driver</Th>
                      <Th>Document</Th>
                      <Th>Submitted</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingVerifications.map((verification) => (
                      <Tr key={verification.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <Text fontSize="sm" fontWeight="medium">
                            {verification.driver?.full_name || 'Unknown'}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {verification.driver?.email}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme="blue"
                            variant="subtle"
                            fontSize="xs"
                          >
                            {verification.document_type.replace('_', ' ')}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(verification.created_at)}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton
                              icon={<FaEye />}
                              size="xs"
                              variant="ghost"
                              aria-label="View documents"
                              onClick={() => window.open(verification.document_url, '_blank')}
                            />
                            <IconButton
                              icon={<FaCheckCircle />}
                              size="xs"
                              variant="ghost"
                              colorScheme="green"
                              aria-label="Approve"
                              onClick={() => handleApprove(verification.id, verification.driver_id)}
                            />
                            <IconButton
                              icon={<FaTimesCircle />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              aria-label="Reject"
                              onClick={() => handleReject(verification.id, verification.driver_id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaIdCard />}
                variant="ghost"
                size="sm"
                w="100%"
                onClick={() => window.location.href = '/accounts/verifications'}
              >
                Review All Verifications
              </Button>
            </CardFooter>
          </Card>

          {/* Flagged Accounts */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Flagged Accounts</Heading>
                {flaggedAccounts.length > 0 && (
                  <Badge colorScheme="red" variant="solid">
                    {flaggedAccounts.length}
                  </Badge>
                )}
              </Flex>
            </CardHeader>
            <CardBody>
              {flaggedAccounts.length === 0 ? (
                <Box textAlign="center" py={8} color="gray.500">
                  <Icon as={FaCheckCircle} boxSize={8} mb={3} opacity={0.5} />
                  <Text>No flagged accounts</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {flaggedAccounts.slice(0, 5).map((flag) => (
                    <Box
                      key={flag.id}
                      p={3}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={`${getFlagColor(flag.severity)}.200`}
                      bg={`${getFlagColor(flag.severity)}.50`}
                    >
                      <Flex justify="space-between" align="start" mb={2}>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">
                            {flag.user?.full_name || 'Unknown User'}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {flag.user_type} • {flag.flag_type}
                          </Text>
                        </Box>
                        <Badge
                          colorScheme={getFlagColor(flag.severity)}
                          fontSize="xs"
                        >
                          {flag.severity}
                        </Badge>
                      </Flex>
                      <Text fontSize="xs" color="gray.700" mb={3} noOfLines={2}>
                        {flag.description}
                      </Text>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(flag.created_at)}
                        </Text>
                        <HStack spacing={1}>
                          <IconButton
                            icon={<FaEye />}
                            size="xs"
                            variant="ghost"
                            aria-label="View details"
                          />
                          <IconButton
                            icon={<FaBan />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Suspend"
                            onClick={() => handleSuspend(flag.user_id, flag.user_type)}
                          />
                        </HStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaExclamationTriangle />}
                variant="ghost"
                size="sm"
                w="100%"
                colorScheme="red"
                onClick={() => window.location.href = '/accounts/flags'}
              >
                {flaggedAccounts.length > 0 ? 'Review All Flags' : 'Flag Management'}
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>

        {/* Recent Compliance Actions */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <Heading size="md">Recent Compliance Actions</Heading>
          </CardHeader>
          <CardBody pt={0} px={0}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Admin</Th>
                    <Th>Action</Th>
                    <Th>Target</Th>
                    <Th>Details</Th>
                    <Th>Time</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentActions.map((action) => (
                    <Tr key={action.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <Text fontSize="sm">
                          {action.admin_email?.split('@')[0]}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            action.action.includes('APPROVE') ? 'green' :
                            action.action.includes('REJECT') ? 'red' :
                            action.action.includes('SUSPEND') ? 'orange' : 'gray'
                          }
                          variant="subtle"
                          fontSize="xs"
                        >
                          {action.action.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {action.resource_type}: {action.resource_id?.slice(0, 8)}...
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.600" noOfLines={1}>
                          {action.details ? JSON.parse(action.details)?.reason || 'No details' : 'No details'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(action.created_at)}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Button
            leftIcon={<FaUserCheck />}
            colorScheme="green"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/accounts/verifications'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Review Verifications</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                {stats.pendingVerifications} pending
              </Text>
            </Box>
          </Button>
          
          <Button
            leftIcon={<FaBan />}
            colorScheme="red"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/accounts/suspended'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Suspended Users</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                {stats.suspendedUsers} accounts
              </Text>
            </Box>
          </Button>
          
          <Button
            leftIcon={<FaExclamationTriangle />}
            colorScheme="orange"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/accounts/flags'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Flagged Accounts</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                {stats.flaggedAccounts} issues
              </Text>
            </Box>
          </Button>
          
          <Button
            leftIcon={<FaFileAlt />}
            colorScheme="blue"
            variant="outline"
            h="auto"
            py={6}
            onClick={() => window.location.href = '/accounts/reports'}
          >
            <Box textAlign="left">
              <Text fontWeight="semibold">Compliance Reports</Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                Generate audit reports
              </Text>
            </Box>
          </Button>
        </SimpleGrid>
      </VStack>
    </Layout>
  );
};

export default ComplianceDashboard;