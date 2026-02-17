import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  HStack,
  VStack,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Badge,
  useToast,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RefreshIcon,
  UsersIcon,
  UserIcon,
  ShieldIcon,
  CheckCircleIcon,
  WarningIcon,
  MoreVerticalIcon,
  UserCheckIcon
} from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useUserManagement } from '../../../hooks/useUserManagement';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import { formatNumber, formatDate } from '../../../utils/formatters';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [globalStats, setGlobalStats] = useState({});
  
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.900');

  // Determine active tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/drivers')) setActiveTab(0);
    else if (path.includes('/passengers')) setActiveTab(1);
    else if (path.includes('/verifications')) setActiveTab(2);
  }, [location]);

  // Mock global stats - in real app, fetch from API
  useEffect(() => {
    // Simulate fetching global user statistics
    const stats = {
      total_users: 15234,
      active_users: 13456,
      new_today: 234,
      pending_verifications: 156,
      suspended_users: 89,
      growth_rate: 12.5
    };
    setGlobalStats(stats);
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action) => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to perform bulk action',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setBulkAction(action);
    setShowConfirmation(true);
  }, [selectedUsers, toast]);

  // Confirm bulk action
  const confirmBulkAction = useCallback(async () => {
    try {
      // In real app, make API call for bulk action
      console.log(`Performing ${bulkAction} on ${selectedUsers.length} users`);
      
      toast({
        title: 'Bulk action initiated',
        description: `${selectedUsers.length} users will be ${bulkAction}ed`,
        status: 'info',
        duration: 3000,
      });

      // Reset selection
      setSelectedUsers([]);
      setShowConfirmation(false);
      setBulkAction('');
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  }, [bulkAction, selectedUsers, toast]);

  // Handle user selection
  const handleUserSelect = useCallback((userId, isSelected) => {
    setSelectedUsers(prev => {
      if (isSelected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  }, []);

  // Select all users in current view
  const handleSelectAll = useCallback(() => {
    // In real app, this would select all filtered users
    toast({
      title: 'Select all',
      description: 'This would select all filtered users in a real implementation',
      status: 'info',
      duration: 3000,
    });
  }, [toast]);

  // Export data
  const handleExport = useCallback((format) => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: `Export would download ${format} file`,
      status: 'info',
      duration: 3000,
    });
  }, [toast]);

  // Quick stats cards
  const renderStatsCards = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>Total Users</StatLabel>
            <StatNumber>{formatNumber(globalStats.total_users)}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {globalStats.growth_rate}% growth
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>Active Users</StatLabel>
            <StatNumber>{formatNumber(globalStats.active_users)}</StatNumber>
            <StatHelpText>88% of total users</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>New Today</StatLabel>
            <StatNumber>{formatNumber(globalStats.new_today)}</StatNumber>
            <StatHelpText>Registered in last 24h</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>Pending Verification</StatLabel>
            <StatNumber>{formatNumber(globalStats.pending_verifications)}</StatNumber>
            <StatHelpText>Requires action</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  // Action buttons for selected users
  const renderActionButtons = () => {
    if (selectedUsers.length === 0) return null;

    return (
      <Alert status="info" variant="subtle" borderRadius="md" mb={4}>
        <AlertIcon />
        <AlertDescription mr={2}>
          {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
        </AlertDescription>
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<CheckCircleIcon />}
            onClick={() => handleBulkAction('approve')}
            isDisabled={!hasPermission('users', 'approve')}
          >
            Approve
          </Button>
          <Button
            size="sm"
            colorScheme="orange"
            leftIcon={<WarningIcon />}
            onClick={() => handleBulkAction('suspend')}
            isDisabled={!hasPermission('users', 'suspend')}
          >
            Suspend
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<UserCheckIcon />}
            onClick={() => handleBulkAction('activate')}
            isDisabled={!hasPermission('users', 'activate')}
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedUsers([])}
          >
            Clear
          </Button>
        </HStack>
      </Alert>
    );
  };

  // Global search and filters
  const renderGlobalControls = () => (
    <Card mb={6} bg={bgColor} border="1px" borderColor={borderColor}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Heading size="md">User Management</Heading>
          <Text color="gray.600" fontSize="sm">
            Manage drivers, passengers, and verification processes across the platform
          </Text>
          
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search users by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>

            <Select
              width="200px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="verified">Verified</option>
            </Select>

            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<MoreVerticalIcon />}
                variant="outline"
              >
                More Filters
              </MenuButton>
              <MenuList>
                <MenuItem>By City</MenuItem>
                <MenuItem>By Registration Date</MenuItem>
                <MenuItem>By Vehicle Type</MenuItem>
                <MenuItem>By Rating</MenuItem>
              </MenuList>
            </Menu>

            <IconButton
              icon={<RefreshIcon />}
              aria-label="Refresh"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            />

            <Menu>
              <MenuButton
                as={Button}
                leftIcon={<DownloadIcon />}
                colorScheme="blue"
                variant="outline"
                ml="auto"
              >
                Export
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
                <MenuItem onClick={() => handleExport('excel')}>Export as Excel</MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // Tab content wrappers
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Drivers
        return (
          <Box>
            <Heading size="md" mb={4}>Drivers Management</Heading>
            <Text mb={4}>Manage driver accounts, documents, and vehicle information.</Text>
            <Button
              as={RouterLink}
              to="/accounts/drivers"
              colorScheme="blue"
              size="sm"
            >
              View All Drivers →
            </Button>
          </Box>
        );
      
      case 1: // Passengers
        return (
          <Box>
            <Heading size="md" mb={4}>Passengers Management</Heading>
            <Text mb={4}>Manage passenger accounts, ride history, and preferences.</Text>
            <Button
              as={RouterLink}
              to="/accounts/passengers"
              colorScheme="blue"
              size="sm"
            >
              View All Passengers →
            </Button>
          </Box>
        );
      
      case 2: // Verifications
        return (
          <Box>
            <Heading size="md" mb={4}>Verifications Center</Heading>
            <Text mb={4}>Review and approve user documents, background checks, and KYC.</Text>
            <Button
              colorScheme="green"
              size="sm"
              onClick={() => navigate('/accounts/verifications')}
            >
              Review Pending Verifications →
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  // Recent activity feed
  const renderRecentActivity = () => (
    <Card bg={bgColor} border="1px" borderColor={borderColor} mt={6}>
      <CardHeader>
        <Heading size="md">Recent Account Activity</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={3} align="stretch">
          {[
            { action: 'Driver Registration', user: 'John Doe', time: '10 min ago', type: 'driver' },
            { action: 'Document Upload', user: 'Sarah Smith', time: '25 min ago', type: 'driver' },
            { action: 'Account Verification', user: 'Mike Johnson', time: '1 hour ago', type: 'passenger' },
            { action: 'Suspension Lifted', user: 'Robert Chen', time: '2 hours ago', type: 'driver' },
            { action: 'Profile Update', user: 'Emma Wilson', time: '3 hours ago', type: 'passenger' },
          ].map((activity, index) => (
            <Flex
              key={index}
              p={3}
              bg={index % 2 === 0 ? cardBg : 'transparent'}
              borderRadius="md"
              align="center"
              justify="space-between"
            >
              <HStack>
                <Badge
                  colorScheme={activity.type === 'driver' ? 'blue' : 'purple'}
                  variant="subtle"
                >
                  {activity.type === 'driver' ? 'Driver' : 'Passenger'}
                </Badge>
                <Text fontSize="sm">{activity.action}</Text>
              </HStack>
              <VStack align="end" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">{activity.user}</Text>
                <Text fontSize="xs" color="gray.500">{activity.time}</Text>
              </VStack>
            </Flex>
          ))}
          <Button
            variant="ghost"
            size="sm"
            alignSelf="flex-start"
            onClick={() => navigate('/admin/audit-logs')}
          >
            View All Activity →
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );

  // Quick action cards
  const renderQuickActions = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={6}>
      <Card 
        bg="blue.50" 
        border="1px" 
        borderColor="blue.200" 
        cursor="pointer"
        onClick={() => navigate('/accounts/drivers?status=pending')}
        _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        transition="all 0.2s"
      >
        <CardBody>
          <VStack align="start" spacing={3}>
            <Badge colorScheme="blue" variant="solid">Drivers</Badge>
            <Heading size="sm">Pending Approvals</Heading>
            <Text fontSize="sm">Review new driver applications and documents</Text>
            <Button size="sm" colorScheme="blue" variant="outline" width="full">
              Review Now
            </Button>
          </VStack>
        </CardBody>
      </Card>

      <Card 
        bg="green.50" 
        border="1px" 
        borderColor="green.200"
        cursor="pointer"
        onClick={() => navigate('/accounts/passengers?status=suspended')}
        _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        transition="all 0.2s"
      >
        <CardBody>
          <VStack align="start" spacing={3}>
            <Badge colorScheme="green" variant="solid">Passengers</Badge>
            <Heading size="sm">Suspended Accounts</Heading>
            <Text fontSize="sm">Review and reinstate suspended passenger accounts</Text>
            <Button size="sm" colorScheme="green" variant="outline" width="full">
              Review Now
            </Button>
          </VStack>
        </CardBody>
      </Card>

      <Card 
        bg="orange.50" 
        border="1px" 
        borderColor="orange.200"
        cursor="pointer"
        onClick={() => navigate('/accounts/verifications')}
        _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        transition="all 0.2s"
      >
        <CardBody>
          <VStack align="start" spacing={3}>
            <Badge colorScheme="orange" variant="solid">Verifications</Badge>
            <Heading size="sm">Document Review</Heading>
            <Text fontSize="sm">Verify driver documents and background checks</Text>
            <Button size="sm" colorScheme="orange" variant="outline" width="full">
              Review Now
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  return (
    <Box>
      {renderStatsCards()}
      {renderGlobalControls()}
      {renderActionButtons()}

      <Tabs 
        variant="enclosed" 
        colorScheme="blue"
        index={activeTab}
        onChange={setActiveTab}
        mb={6}
      >
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <UsersIcon />
              <Text>Drivers</Text>
              <Badge variant="subtle" colorScheme="blue">2,456</Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <UserIcon />
              <Text>Passengers</Text>
              <Badge variant="subtle" colorScheme="purple">12,778</Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <ShieldIcon />
              <Text>Verifications</Text>
              <Badge variant="subtle" colorScheme="orange">156</Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <FilterIcon />
              <Text>Advanced Filters</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={4}>
            {renderTabContent()}
          </TabPanel>
          <TabPanel p={4}>
            {renderTabContent()}
          </TabPanel>
          <TabPanel p={4}>
            {renderTabContent()}
          </TabPanel>
          <TabPanel p={4}>
            <Heading size="md" mb={4}>Advanced User Filters</Heading>
            <Text mb={4}>Combine multiple filters for precise user segmentation.</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Card>
                <CardBody>
                  <Text fontWeight="bold" mb={2}>Filter by Date Range</Text>
                  <Text fontSize="sm" color="gray.600">Filter users by registration or activity dates</Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontWeight="bold" mb={2}>Filter by Location</Text>
                  <Text fontSize="sm" color="gray.600">Filter by city, state, or region</Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontWeight="bold" mb={2}>Filter by Activity</Text>
                  <Text fontSize="sm" color="gray.600">Filter by ride count, rating, or engagement</Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontWeight="bold" mb={2}>Filter by Compliance</Text>
                  <Text fontSize="sm" color="gray.600">Filter by document status, verification level</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {renderQuickActions()}
      {renderRecentActivity()}

      {/* Confirmation Modal for Bulk Actions */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmBulkAction}
        title={`Confirm ${bulkAction} Action`}
        message={`Are you sure you want to ${bulkAction} ${selectedUsers.length} selected user${selectedUsers.length !== 1 ? 's' : ''}?`}
        type="warning"
        confirmText={`${bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)} Users`}
      />
    </Box>
  );
};

export default UserManagement;