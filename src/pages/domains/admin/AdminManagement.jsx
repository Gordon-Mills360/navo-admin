import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, IconButton, Badge,
  HStack, VStack, SimpleGrid, Card, CardBody, CardHeader,
  useToast, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel,
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, FormControl, FormLabel,
  Input, Select, Switch, Textarea, Alert, AlertIcon,
  Tooltip, Menu, MenuButton, MenuList, MenuItem, MenuGroup,
  AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  useColorModeValue, Divider, Avatar, Wrap, WrapItem,
  Tag, TagLabel, TagLeftIcon, TagRightIcon, Center,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Popover, PopoverTrigger, PopoverContent, PopoverHeader,
  PopoverBody, PopoverFooter, PopoverArrow, PopoverCloseButton,
  Portal, Spinner, Progress, Skeleton, SkeletonCircle, SkeletonText
} from '@chakra-ui/react';

// Icons
import {
  SearchIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon,
  CheckIcon, CloseIcon, WarningIcon, RepeatIcon,
  DownloadIcon, CopyIcon, LockIcon, UnlockIcon,
  ChevronRightIcon, ChevronDownIcon, InfoIcon,
  PhoneIcon, EmailIcon, CalendarIcon, TimeIcon,
  ArrowUpIcon, ArrowDownIcon, ExternalLinkIcon,
  HamburgerIcon, SettingsIcon, StarIcon
} from '@chakra-ui/icons';
import {
  FaUserShield, FaUserTie, FaUserCheck, FaUserTimes,
  FaUserClock, FaUserLock, FaUserCog, FaChartLine,
  FaHistory, FaKey, FaBell, FaShieldAlt
} from 'react-icons/fa';

// Services & Contexts
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';

// Components
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

// Utils
import { formatDate } from '../../../utils/formatters';
import { validateEmail, validatePhone } from '../../../utils/validators';

const AdminManagement = () => {
  // State declarations
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    superAdmins: 0,
    online: 0
  });
  
  // Form states
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    role: 'OPERATIONS',
    department: '',
    permissions: [],
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isSuspendOpen, onOpen: onSuspendOpen, onClose: onSuspendClose } = useDisclosure();
  const { isOpen: isActivityOpen, onOpen: onActivityOpen, onClose: onActivityClose } = useDisclosure();
  const { isOpen: isResetPasswordOpen, onOpen: onResetPasswordOpen, onClose: onResetPasswordClose } = useDisclosure();
  const { isOpen: isForceLogoutOpen, onOpen: onForceLogoutOpen, onClose: onForceLogoutClose } = useDisclosure();
  
  // Context hooks
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const toast = useToast();
  
  // Permission check - SUPER_ADMIN only
  useEffect(() => {
    if (!hasPermission('admin_management', 'view')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        status: 'error',
        duration: 5000,
      });
      // Redirect to dashboard or show access denied
      window.location.href = '/dashboard';
    }
  }, [hasPermission, toast]);
  
  // Color values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  
  // Fetch admins data
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select(`
          *,
          admin_roles:role,
          admin_actions_log(count)
        `)
        .order('created_at', { ascending: false });
      
      if (adminsError) throw adminsError;
      
      // Calculate statistics
      const total = adminsData?.length || 0;
      const active = adminsData?.filter(a => a.status === 'active')?.length || 0;
      const suspended = adminsData?.filter(a => a.status === 'suspended')?.length || 0;
      const pending = adminsData?.filter(a => a.status === 'pending')?.length || 0;
      const superAdmins = adminsData?.filter(a => a.role === 'SUPER_ADMIN')?.length || 0;
      const online = adminsData?.filter(a => a.last_active_at && 
        new Date(a.last_active_at) > new Date(Date.now() - 5 * 60 * 1000))?.length || 0;
      
      setStats({ total, active, suspended, pending, superAdmins, online });
      setAdmins(adminsData || []);
      
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError(err.message || 'Failed to load admin data');
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('admins_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admins' },
        () => {
          fetchAdmins();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAdmins]);
  
  // Initial fetch
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Create new admin
  const handleCreateAdmin = async () => {
    if (!validateForm()) return;
    
    try {
      setActionLoading(true);
      
      // Check if admin already exists
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('id')
        .eq('email', formData.email)
        .single();
      
      if (existingAdmin) {
        toast({
          title: 'Error',
          description: 'An admin with this email already exists',
          status: 'error',
          duration: 5000,
        });
        return;
      }
      
      // Create admin
      const { data, error } = await supabase
        .from('admins')
        .insert([{
          email: formData.email,
          phone: formData.phone || null,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          department: formData.department || null,
          status: 'active',
          permissions: formData.permissions,
          notes: formData.notes || null,
          created_by: user.id,
          last_updated_by: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'admin_created',
        resource_type: 'admin',
        resource_id: data.id,
        details: {
          email: formData.email,
          role: formData.role,
          created_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      // Send notification to new admin
      await supabase.from('notifications').insert({
        user_id: data.id,
        user_type: 'admin',
        title: 'Admin Account Created',
        message: `Your admin account has been created with ${formData.role} role. You will receive login instructions shortly.`,
        type: 'system',
        priority: 'high',
        created_by: user.id
      });
      
      toast({
        title: 'Success',
        description: 'Admin account created successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Reset form and close modal
      setFormData({
        email: '',
        phone: '',
        first_name: '',
        last_name: '',
        role: 'OPERATIONS',
        department: '',
        permissions: [],
        notes: ''
      });
      onCreateClose();
      
    } catch (err) {
      console.error('Error creating admin:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create admin account',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Update admin
  const handleUpdateAdmin = async () => {
    if (!validateForm() || !selectedAdmin) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('admins')
        .update({
          email: formData.email,
          phone: formData.phone || null,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          department: formData.department || null,
          permissions: formData.permissions,
          notes: formData.notes || null,
          last_updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAdmin.id);
      
      if (error) throw error;
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'admin_updated',
        resource_type: 'admin',
        resource_id: selectedAdmin.id,
        details: {
          previous_email: selectedAdmin.email,
          new_email: formData.email,
          role: formData.role,
          updated_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Admin account updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Close modal
      onEditClose();
      
    } catch (err) {
      console.error('Error updating admin:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update admin account',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Suspend/Reactivate admin
  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const actionType = newStatus === 'suspended' ? 'admin_suspended' : 'admin_reactivated';
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('admins')
        .update({
          status: newStatus,
          last_updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId);
      
      if (error) throw error;
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: actionType,
        resource_type: 'admin',
        resource_id: adminId,
        details: {
          previous_status: currentStatus,
          new_status: newStatus,
          action_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      // Send notification to affected admin
      await supabase.from('notifications').insert({
        user_id: adminId,
        user_type: 'admin',
        title: `Account ${newStatus === 'suspended' ? 'Suspended' : 'Reactivated'}`,
        message: `Your admin account has been ${newStatus === 'suspended' ? 'suspended. Contact super admin for details.' : 'reactivated. You can now access the system.'}`,
        type: 'system',
        priority: 'high',
        created_by: user.id
      });
      
      toast({
        title: 'Success',
        description: `Admin account ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully`,
        status: 'success',
        duration: 3000,
      });
      
      onSuspendClose();
      
    } catch (err) {
      console.error('Error toggling admin status:', err);
      toast({
        title: 'Error',
        description: err.message || `Failed to ${newStatus === 'suspended' ? 'suspend' : 'reactivate'} admin account`,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Reset admin password
  const handleResetPassword = async (adminId) => {
    try {
      setActionLoading(true);
      
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      
      // In a real app, you would send this to the admin's email
      // For demo, we'll just log it
      console.log('Temporary password for admin', adminId, ':', tempPassword);
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'password_reset',
        resource_type: 'admin',
        resource_id: adminId,
        details: {
          reset_by: user.email,
          note: 'Password reset initiated'
        },
        ip_address: 'admin_panel'
      });
      
      // Send notification/email to admin
      await supabase.from('notifications').insert({
        user_id: adminId,
        user_type: 'admin',
        title: 'Password Reset',
        message: 'Your password has been reset. Check your email for temporary password.',
        type: 'system',
        priority: 'high',
        created_by: user.id
      });
      
      toast({
        title: 'Success',
        description: 'Password reset initiated. Admin will receive instructions via email.',
        status: 'success',
        duration: 3000,
      });
      
      onResetPasswordClose();
      
    } catch (err) {
      console.error('Error resetting password:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to reset password',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Force logout admin
  const handleForceLogout = async (adminId) => {
    try {
      setActionLoading(true);
      
      // Invalidate all sessions for this admin
      await supabase
        .from('admin_sessions')
        .update({ valid: false })
        .eq('admin_id', adminId);
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'force_logout',
        resource_type: 'admin',
        resource_id: adminId,
        details: {
          forced_by: user.email,
          reason: 'Admin requested forced logout'
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Admin has been logged out from all devices',
        status: 'success',
        duration: 3000,
      });
      
      onForceLogoutClose();
      
    } catch (err) {
      console.error('Error forcing logout:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to force logout',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Open edit modal
  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      phone: admin.phone || '',
      first_name: admin.first_name,
      last_name: admin.last_name,
      role: admin.role,
      department: admin.department || '',
      permissions: admin.permissions || [],
      notes: admin.notes || ''
    });
    onEditOpen();
  };
  
  // Open suspend modal
  const openSuspendModal = (admin) => {
    setSelectedAdmin(admin);
    onSuspendOpen();
  };
  
  // Open activity modal
  const openActivityModal = (admin) => {
    setSelectedAdmin(admin);
    onActivityOpen();
  };
  
  // Open reset password modal
  const openResetPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    onResetPasswordOpen();
  };
  
  // Open force logout modal
  const openForceLogoutModal = (admin) => {
    setSelectedAdmin(admin);
    onForceLogoutOpen();
  };
  
  // Get role badge color
  const getRoleColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'red';
      case 'ADMIN': return 'purple';
      case 'OPERATIONS': return 'blue';
      case 'FINANCE': return 'green';
      case 'SUPPORT': return 'orange';
      case 'ANALYTICS': return 'teal';
      default: return 'gray';
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'suspended': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };
  
  // Table columns
  const columns = useMemo(() => [
    {
      Header: 'Admin',
      accessor: 'admin',
      Cell: ({ row }) => (
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={`${row.original.first_name} ${row.original.last_name}`}
            src={row.original.avatar_url}
            bg={getRoleColor(row.original.role)}
          />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">
              {row.original.first_name} {row.original.last_name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {row.original.email}
            </Text>
          </VStack>
        </HStack>
      )
    },
    {
      Header: 'Role',
      accessor: 'role',
      Cell: ({ value }) => (
        <Badge
          colorScheme={getRoleColor(value)}
          variant="subtle"
          px={2}
          py={1}
          borderRadius="full"
        >
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      Header: 'Department',
      accessor: 'department',
      Cell: ({ value }) => (
        <Text>{value || '—'}</Text>
      )
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value, row }) => (
        <HStack>
          <Badge
            colorScheme={getStatusColor(value)}
            variant={value === 'active' ? 'solid' : 'subtle'}
            px={2}
            py={1}
            borderRadius="md"
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
          {row.original.last_active_at && 
           new Date(row.original.last_active_at) > new Date(Date.now() - 5 * 60 * 1000) && (
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg="green.500"
              title="Online"
            />
          )}
        </HStack>
      )
    },
    {
      Header: 'Last Active',
      accessor: 'last_active_at',
      Cell: ({ value }) => (
        <Tooltip label={value ? formatDate(value, 'full') : 'Never'}>
          <Text fontSize="sm">
            {value ? formatDate(value, 'relative') : 'Never'}
          </Text>
        </Tooltip>
      )
    },
    {
      Header: 'Created',
      accessor: 'created_at',
      Cell: ({ value }) => (
        <Text fontSize="sm">
          {formatDate(value, 'date')}
        </Text>
      )
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <HStack spacing={2}>
          <Tooltip label="View Activity">
            <IconButton
              size="sm"
              icon={<FaHistory />}
              aria-label="View Activity"
              onClick={() => openActivityModal(row.original)}
              variant="ghost"
            />
          </Tooltip>
          
          {hasPermission('admin_management', 'edit') && (
            <Tooltip label="Edit Admin">
              <IconButton
                size="sm"
                icon={<EditIcon />}
                aria-label="Edit Admin"
                onClick={() => openEditModal(row.original)}
                variant="ghost"
                isDisabled={row.original.id === user.id}
              />
            </Tooltip>
          )}
          
          {hasPermission('admin_management', 'suspend') && (
            <Tooltip label={row.original.status === 'active' ? 'Suspend' : 'Reactivate'}>
              <IconButton
                size="sm"
                icon={row.original.status === 'active' ? <FaUserTimes /> : <FaUserCheck />}
                aria-label={row.original.status === 'active' ? 'Suspend' : 'Reactivate'}
                onClick={() => openSuspendModal(row.original)}
                variant="ghost"
                colorScheme={row.original.status === 'active' ? 'red' : 'green'}
                isDisabled={row.original.id === user.id}
              />
            </Tooltip>
          )}
          
          {hasPermission('admin_management', 'reset_password') && (
            <Tooltip label="Reset Password">
              <IconButton
                size="sm"
                icon={<FaKey />}
                aria-label="Reset Password"
                onClick={() => openResetPasswordModal(row.original)}
                variant="ghost"
              />
            </Tooltip>
          )}
          
          {hasPermission('admin_management', 'force_logout') && (
            <Tooltip label="Force Logout">
              <IconButton
                size="sm"
                icon={<FaUserLock />}
                aria-label="Force Logout"
                onClick={() => openForceLogoutModal(row.original)}
                variant="ghost"
                colorScheme="orange"
                isDisabled={row.original.id === user.id}
              />
            </Tooltip>
          )}
        </HStack>
      )
    }
  ], [hasPermission, user]);
  
  // Loading state
  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Admin Management</Heading>
        </Flex>
        <LoadingSpinner text="Loading admin data..." fullPage={false} />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Error loading admin data</Text>
            <Text fontSize="sm">{error}</Text>
          </Box>
        </Alert>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={fetchAdmins}
          colorScheme="blue"
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Admin Management</Heading>
          <Text color="gray.500" fontSize="sm">
            Manage admin users and their permissions
          </Text>
        </VStack>
        
        {hasPermission('admin_management', 'create') && (
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            Create Admin
          </Button>
        )}
      </Flex>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3, lg: 6 }} spacing={4} mb={6}>
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Total Admins</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                23.36%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Active</StatLabel>
              <StatNumber color="green.500">{stats.active}</StatNumber>
              <StatHelpText>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Suspended</StatLabel>
              <StatNumber color="red.500">{stats.suspended}</StatNumber>
              <StatHelpText>
                {stats.total > 0 ? Math.round((stats.suspended / stats.total) * 100) : 0}% of total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Super Admins</StatLabel>
              <StatNumber color="purple.500">{stats.superAdmins}</StatNumber>
              <StatHelpText>
                Highest privilege
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Online Now</StatLabel>
              <StatNumber color="teal.500">{stats.online}</StatNumber>
              <StatHelpText>
                Last 5 minutes
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Pending</StatLabel>
              <StatNumber color="yellow.500">{stats.pending}</StatNumber>
              <StatHelpText>
                Need activation
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Admins Table */}
      <Card bg={cardBg} border="1px" borderColor={borderColor} mb={6}>
        <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
          <Flex justify="space-between" align="center">
            <Heading size="md">Admin Users</Heading>
            <HStack spacing={2}>
              <Button size="sm" variant="outline" leftIcon={<DownloadIcon />}>
                Export
              </Button>
              <Button size="sm" variant="outline" leftIcon={<FilterIcon />}>
                Filter
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          <DataTable
            columns={columns}
            data={admins}
            isLoading={loading}
            pageSize={10}
            searchable={true}
            searchPlaceholder="Search admins..."
          />
        </CardBody>
      </Card>
      
      {/* Create Admin Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Admin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired isInvalid={!!formErrors.first_name}>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                  />
                  {formErrors.first_name && (
                    <Text color="red.500" fontSize="sm">{formErrors.first_name}</Text>
                  )}
                </FormControl>
                
                <FormControl isRequired isInvalid={!!formErrors.last_name}>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                  />
                  {formErrors.last_name && (
                    <Text color="red.500" fontSize="sm">{formErrors.last_name}</Text>
                  )}
                </FormControl>
              </SimpleGrid>
              
              <FormControl isRequired isInvalid={!!formErrors.email}>
                <FormLabel>Email Address</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@example.com"
                />
                {formErrors.email && (
                  <Text color="red.500" fontSize="sm">{formErrors.email}</Text>
                )}
              </FormControl>
              
              <FormControl isInvalid={!!formErrors.phone}>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
                {formErrors.phone && (
                  <Text color="red.500" fontSize="sm">{formErrors.phone}</Text>
                )}
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired isInvalid={!!formErrors.role}>
                  <FormLabel>Role</FormLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="OPERATIONS">Operations</option>
                    <option value="FINANCE">Finance</option>
                    <option value="SUPPORT">Support</option>
                    <option value="ANALYTICS">Analytics</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </Select>
                  {formErrors.role && (
                    <Text color="red.500" fontSize="sm">{formErrors.role}</Text>
                  )}
                </FormControl>
                
                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Input
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Operations, Finance"
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about this admin..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateAdmin}
              isLoading={actionLoading}
              loadingText="Creating..."
            >
              Create Admin
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Edit Admin Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Admin: {selectedAdmin?.first_name} {selectedAdmin?.last_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired isInvalid={!!formErrors.first_name}>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </FormControl>
                
                <FormControl isRequired isInvalid={!!formErrors.last_name}>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl isRequired isInvalid={!!formErrors.email}>
                <FormLabel>Email Address</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl isInvalid={!!formErrors.phone}>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired isInvalid={!!formErrors.role}>
                  <FormLabel>Role</FormLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="OPERATIONS">Operations</option>
                    <option value="FINANCE">Finance</option>
                    <option value="SUPPORT">Support</option>
                    <option value="ANALYTICS">Analytics</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Input
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdateAdmin}
              isLoading={actionLoading}
              loadingText="Updating..."
            >
              Update Admin
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Suspend/Reactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={isSuspendOpen}
        onClose={onSuspendClose}
        onConfirm={() => handleToggleAdminStatus(selectedAdmin?.id, selectedAdmin?.status)}
        title={`${selectedAdmin?.status === 'active' ? 'Suspend' : 'Reactivate'} Admin`}
        message={`Are you sure you want to ${selectedAdmin?.status === 'active' ? 'suspend' : 'reactivate'} ${selectedAdmin?.first_name} ${selectedAdmin?.last_name}?`}
        type={selectedAdmin?.status === 'active' ? 'warning' : 'confirm'}
        confirmText={selectedAdmin?.status === 'active' ? 'Suspend' : 'Reactivate'}
        isLoading={actionLoading}
      />
      
      {/* Reset Password Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetPasswordOpen}
        onClose={onResetPasswordClose}
        onConfirm={() => handleResetPassword(selectedAdmin?.id)}
        title="Reset Admin Password"
        message={`Reset password for ${selectedAdmin?.first_name} ${selectedAdmin?.last_name}? A temporary password will be sent to their email.`}
        type="warning"
        confirmText="Reset Password"
        isLoading={actionLoading}
      />
      
      {/* Force Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isForceLogoutOpen}
        onClose={onForceLogoutClose}
        onConfirm={() => handleForceLogout(selectedAdmin?.id)}
        title="Force Admin Logout"
        message={`Force logout ${selectedAdmin?.first_name} ${selectedAdmin?.last_name} from all devices? This will invalidate all their active sessions.`}
        type="warning"
        confirmText="Force Logout"
        isLoading={actionLoading}
      />
      
      {/* Admin Activity Modal */}
      <Modal isOpen={isActivityOpen} onClose={onActivityClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Activity Log: {selectedAdmin?.first_name} {selectedAdmin?.last_name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAdmin && (
              <VStack align="stretch" spacing={4}>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Recent Activity</Text>
                    <Text fontSize="sm">Last 30 days of admin actions</Text>
                  </Box>
                </Alert>
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Total Actions</Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {selectedAdmin.admin_actions_log?.[0]?.count || 0}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Last Action</Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {selectedAdmin.last_active_at ? formatDate(selectedAdmin.last_active_at, 'relative') : 'Never'}
                    </Text>
                  </Box>
                </SimpleGrid>
                
                <Text fontSize="sm" color="gray.600">
                  For complete activity history, visit the Audit Logs page.
                </Text>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={() => {
                onActivityClose();
                // Navigate to audit logs with filter for this admin
                window.location.href = '/admin/audit-logs';
              }}
            >
              View Full Audit Log
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminManagement;