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
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Stack,
  Tag,
  TagLabel,
  TagCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  AvatarGroup,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FaUserShield, 
  FaUsers, 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaUserTag,
  FaUserCheck,
  FaUserTimes,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFilter,
  FaSortAmountDown,
  FaCrown,
  FaUserCircle,
  FaShieldAlt
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer';
import SettingsMenu from '../../components/SettingsMenu';
import { supabase } from '../../services/supabase';

const RolesPermissions = () => {
  const toast = useToast();
  
  // State for roles
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for permissions
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  
  // State for admin users
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // State for new role
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    isDefault: false,
  });
  
  // State for editing role
  const [editingRole, setEditingRole] = useState(null);
  
  // Modals
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isAssignModalOpen, onOpen: onAssignModalOpen, onClose: onAssignModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  
  // Selected user for role assignment
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Permission categories
  const permissionCategories = {
    user_management: 'User Management',
    driver_management: 'Driver Management',
    ride_management: 'Ride Management',
    payment_management: 'Payment Management',
    platform_settings: 'Platform Settings',
    analytics: 'Analytics & Reports',
    security: 'Security & Compliance',
  };
  
  // Fetch all roles from database
  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all permissions from database
  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setPermissions(data);
        
        // Initialize role permissions mapping
        const rolePerms = {};
        data.forEach(perm => {
          rolePerms[perm.id] = false;
        });
        setRolePermissions(rolePerms);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };
  
  // Fetch role permissions for a specific role
  const fetchRolePermissions = async (roleId) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
      
      if (error) throw error;
      
      if (data) {
        const rolePerms = { ...rolePermissions };
        data.forEach(rp => {
          rolePerms[rp.permission_id] = true;
        });
        setRolePermissions(rolePerms);
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };
  
  // Fetch admin users
  const fetchAdminUsers = async () => {
    try {
      setUsersLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          avatar_url,
          created_at,
          role_details:role_id (
            name,
            description
          )
        `)
        .in('role', ['admin', 'super_admin', 'support', 'finance', 'viewer'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setAdminUsers(data);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setUsersLoading(false);
    }
  };
  
  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      fetchRoles(),
      fetchPermissions(),
      fetchAdminUsers(),
    ]);
  };
  
  // Create new role
  const createRole = async () => {
    if (!newRole.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Role name is required',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Create role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: newRole.name.trim(),
          description: newRole.description.trim(),
          is_default: newRole.isDefault,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (roleError) throw roleError;
      
      // Get selected permissions
      const selectedPermIds = Object.keys(rolePermissions).filter(permId => rolePermissions[permId]);
      
      if (selectedPermIds.length > 0) {
        // Insert role permissions
        const rolePermsData = selectedPermIds.map(permId => ({
          role_id: roleData.id,
          permission_id: permId,
        }));
        
        const { error: permsError } = await supabase
          .from('role_permissions')
          .insert(rolePermsData);
        
        if (permsError) throw permsError;
      }
      
      toast({
        title: 'Success',
        description: `Role "${newRole.name}" created successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setNewRole({
        name: '',
        description: '',
        isDefault: false,
      });
      
      // Reset permissions
      const resetPerms = { ...rolePermissions };
      Object.keys(resetPerms).forEach(key => {
        resetPerms[key] = false;
      });
      setRolePermissions(resetPerms);
      
      onCreateModalClose();
      loadAllData(); // Refresh data
      
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to create role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Update existing role
  const updateRole = async () => {
    if (!editingRole) return;
    
    try {
      setSaving(true);
      
      // Update role
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          name: editingRole.name.trim(),
          description: editingRole.description.trim(),
          is_default: editingRole.isDefault,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRole.id);
      
      if (roleError) throw roleError;
      
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', editingRole.id);
      
      if (deleteError) throw deleteError;
      
      // Get selected permissions
      const selectedPermIds = Object.keys(rolePermissions).filter(permId => rolePermissions[permId]);
      
      if (selectedPermIds.length > 0) {
        // Insert new permissions
        const rolePermsData = selectedPermIds.map(permId => ({
          role_id: editingRole.id,
          permission_id: permId,
        }));
        
        const { error: permsError } = await supabase
          .from('role_permissions')
          .insert(rolePermsData);
        
        if (permsError) throw permsError;
      }
      
      toast({
        title: 'Success',
        description: `Role "${editingRole.name}" updated successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onEditModalClose();
      loadAllData(); // Refresh data
      
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Delete role
  const deleteRole = async (roleId, roleName) => {
    try {
      // Check if role is assigned to any users
      const { data: usersWithRole, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role_id', roleId)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (usersWithRole && usersWithRole.length > 0) {
        toast({
          title: 'Cannot Delete',
          description: `Role "${roleName}" is assigned to ${usersWithRole.length} user(s). Reassign them first.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Delete role permissions first
      const { error: permsError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);
      
      if (permsError) throw permsError;
      
      // Delete role
      const { error: roleError } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);
      
      if (roleError) throw roleError;
      
      toast({
        title: 'Success',
        description: `Role "${roleName}" deleted successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteModalClose();
      loadAllData(); // Refresh data
      
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Assign role to user
  const assignRoleToUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role_id: selectedUser.roleId,
          role: selectedUser.roleName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.userId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Role assigned to user successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onAssignModalClose();
      fetchAdminUsers(); // Refresh users
      
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Duplicate role
  const duplicateRole = async (role) => {
    try {
      setSaving(true);
      
      // Create new role with "Copy of" prefix
      const { data: newRoleData, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: `Copy of ${role.name}`,
          description: role.description,
          is_default: false,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (roleError) throw roleError;
      
      // Get original role's permissions
      const { data: originalPerms, error: permsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', role.id);
      
      if (permsError) throw permsError;
      
      if (originalPerms && originalPerms.length > 0) {
        // Duplicate permissions
        const rolePermsData = originalPerms.map(perm => ({
          role_id: newRoleData.id,
          permission_id: perm.permission_id,
        }));
        
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(rolePermsData);
        
        if (insertError) throw insertError;
      }
      
      toast({
        title: 'Success',
        description: `Role duplicated successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadAllData(); // Refresh data
      
    } catch (error) {
      console.error('Error duplicating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permissionId) => {
    setRolePermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };
  
  // Select all permissions in category
  const selectAllInCategory = (category) => {
    const categoryPerms = permissions.filter(p => p.category === category);
    const updatedPerms = { ...rolePermissions };
    
    categoryPerms.forEach(perm => {
      updatedPerms[perm.id] = true;
    });
    
    setRolePermissions(updatedPerms);
  };
  
  // Deselect all permissions in category
  const deselectAllInCategory = (category) => {
    const categoryPerms = permissions.filter(p => p.category === category);
    const updatedPerms = { ...rolePermissions };
    
    categoryPerms.forEach(perm => {
      updatedPerms[perm.id] = false;
    });
    
    setRolePermissions(updatedPerms);
  };
  
  // Open edit modal
  const openEditModal = (role) => {
    setEditingRole(role);
    fetchRolePermissions(role.id);
    onEditModalOpen();
  };
  
  // Open delete modal
  const openDeleteModal = (role) => {
    setEditingRole(role);
    onDeleteModalOpen();
  };
  
  // Open assign modal
  const openAssignModal = (user) => {
    setSelectedUser({
      userId: user.id,
      userName: user.full_name || user.email,
      currentRole: user.role,
      roleId: null,
      roleName: '',
    });
    onAssignModalOpen();
  };
  
  // Refresh all data
  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Load data on component mount
  useEffect(() => {
    loadAllData();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('roles_permissions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'roles' }, 
        () => {
          fetchRoles();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'role_permissions' }, 
        () => {
          fetchPermissions();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Get role badge color
  const getRoleBadgeColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'super_admin':
        return 'purple';
      case 'admin':
        return 'red';
      case 'support':
        return 'blue';
      case 'finance':
        return 'green';
      case 'viewer':
        return 'gray';
      default:
        return 'teal';
    }
  };
  
  if (loading) {
    return (
      <PageContainer title="Roles & Permissions" subtitle="Manage admin roles and access permissions">
        <Flex gap={6}>
          <SettingsMenu />
          <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="400px">
            <Text>Loading roles and permissions...</Text>
          </Box>
        </Flex>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      title="Roles & Permissions" 
      subtitle="Manage admin roles, permissions, and access control"
    >
      <Flex gap={6}>
        <SettingsMenu />
        
        <Box flex={1}>
          {/* Header with actions */}
          <Card mb={6} borderColor="gray.200">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="md" color="gray.800">
                    Access Control System
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Define roles and permissions for admin users
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
                    leftIcon={<FaPlus />}
                    colorScheme="brand"
                    size="sm"
                    onClick={onCreateModalOpen}
                  >
                    Create Role
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
          
          <Tabs colorScheme="brand">
            <TabList>
              <Tab fontWeight="semibold">
                <Icon as={FaUserShield} mr={2} />
                Roles
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaUsers} mr={2} />
                Admin Users
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaKey} mr={2} />
                Permission Matrix
              </Tab>
            </TabList>
            
            <TabPanels>
              {/* Tab 1: Roles */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {roles.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>No roles defined</AlertTitle>
                        <AlertDescription>
                          Create roles to manage admin access permissions.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ) : (
                    <Card borderColor="gray.200">
                      <CardHeader pb={3}>
                        <Heading size="md">System Roles</Heading>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Role</Th>
                              <Th>Description</Th>
                              <Th>Default</Th>
                              <Th>Users</Th>
                              <Th>Created</Th>
                              <Th textAlign="right">Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {roles.map((role) => (
                              <Tr key={role.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <HStack>
                                    <Badge
                                      colorScheme={getRoleBadgeColor(role.name)}
                                      fontSize="sm"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                    >
                                      {role.name}
                                    </Badge>
                                    {role.is_default && (
                                      <Tag size="sm" colorScheme="green" variant="subtle">
                                        Default
                                      </Tag>
                                    )}
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                    {role.description}
                                  </Text>
                                </Td>
                                <Td>
                                  {role.is_default ? (
                                    <Tag size="sm" colorScheme="green">
                                      Yes
                                    </Tag>
                                  ) : (
                                    <Tag size="sm" colorScheme="gray">
                                      No
                                    </Tag>
                                  )}
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {role.user_count || 0}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color="gray.600">
                                    {new Date(role.created_at).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack spacing={2} justify="flex-end">
                                    <Tooltip label="Edit Role">
                                      <IconButton
                                        icon={<FaEdit />}
                                        colorScheme="blue"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Edit Role"
                                        onClick={() => openEditModal(role)}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Duplicate Role">
                                      <IconButton
                                        icon={<FaCopy />}
                                        colorScheme="teal"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Duplicate Role"
                                        onClick={() => duplicateRole(role)}
                                        isLoading={saving}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Delete Role">
                                      <IconButton
                                        icon={<FaTrash />}
                                        colorScheme="red"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Delete Role"
                                        onClick={() => openDeleteModal(role)}
                                        isDisabled={role.is_default || role.name === 'super_admin'}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </CardBody>
                    </Card>
                  )}
                  
                  {/* Pre-defined roles info */}
                  <Card borderColor="gray.200" variant="outline">
                    <CardHeader pb={3}>
                      <Heading size="sm">Pre-defined Role Hierarchy</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                          <HStack>
                            <Icon as={FaCrown} color="purple.500" />
                            <Text fontWeight="semibold">Super Admin</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">Full system control</Text>
                        </HStack>
                        
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                          <HStack>
                            <Icon as={FaShieldAlt} color="red.500" />
                            <Text fontWeight="semibold">Admin</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">Operations & payments</Text>
                        </HStack>
                        
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                          <HStack>
                            <Icon as={FaUserCheck} color="blue.500" />
                            <Text fontWeight="semibold">Support</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">Users & drivers only</Text>
                        </HStack>
                        
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                          <HStack>
                            <Icon as={FaUserTag} color="green.500" />
                            <Text fontWeight="semibold">Finance</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">Payments & earnings</Text>
                        </HStack>
                        
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                          <HStack>
                            <Icon as={FaEye} color="gray.500" />
                            <Text fontWeight="semibold">Viewer</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">Read-only analytics</Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 2: Admin Users */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Admin Users</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {usersLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading admin users...</Text>
                        </Box>
                      ) : adminUsers.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No admin users found</AlertTitle>
                            <AlertDescription>
                              There are no users with admin roles in the system.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>User</Th>
                              <Th>Email</Th>
                              <Th>Role</Th>
                              <Th>Joined</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {adminUsers.map((user) => (
                              <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <HStack>
                                    <Avatar
                                      size="sm"
                                      name={user.full_name || user.email}
                                      src={user.avatar_url}
                                      bg="brand.500"
                                    />
                                    <Box>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {user.full_name || 'No Name'}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        ID: {user.id.substring(0, 8)}...
                                      </Text>
                                    </Box>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {user.email}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack>
                                    <Badge
                                      colorScheme={getRoleBadgeColor(user.role)}
                                      fontSize="xs"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                    >
                                      {user.role}
                                    </Badge>
                                    {user.role_details && (
                                      <Text fontSize="xs" color="gray.600">
                                        {user.role_details.name}
                                      </Text>
                                    )}
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {new Date(user.created_at).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <Button
                                    size="xs"
                                    colorScheme="brand"
                                    variant="outline"
                                    leftIcon={<FaUserTag />}
                                    onClick={() => openAssignModal(user)}
                                  >
                                    Change Role
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                    <CardFooter pt={3}>
                      <Text fontSize="xs" color="gray.600">
                        Showing {adminUsers.length} admin users with special permissions
                      </Text>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 3: Permission Matrix */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Permission Matrix</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={8} align="stretch">
                        {Object.entries(permissionCategories).map(([categoryKey, categoryName]) => {
                          const categoryPermissions = permissions.filter(p => p.category === categoryKey);
                          
                          if (categoryPermissions.length === 0) return null;
                          
                          return (
                            <Box key={categoryKey}>
                              <HStack justify="space-between" mb={4}>
                                <Heading size="sm" color="gray.700">
                                  {categoryName}
                                </Heading>
                                <HStack spacing={2}>
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    variant="outline"
                                    onClick={() => selectAllInCategory(categoryKey)}
                                  >
                                    Select All
                                  </Button>
                                  <Button
                                    size="xs"
                                    colorScheme="red"
                                    variant="outline"
                                    onClick={() => deselectAllInCategory(categoryKey)}
                                  >
                                    Deselect All
                                  </Button>
                                </HStack>
                              </HStack>
                              
                              <Stack spacing={3} pl={4}>
                                {categoryPermissions.map((permission) => (
                                  <Checkbox
                                    key={permission.id}
                                    isChecked={rolePermissions[permission.id]}
                                    onChange={() => handlePermissionToggle(permission.id)}
                                    colorScheme="brand"
                                  >
                                    <Box>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {permission.name}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {permission.description}
                                      </Text>
                                    </Box>
                                  </Checkbox>
                                ))}
                              </Stack>
                            </Box>
                          );
                        })}
                      </VStack>
                    </CardBody>
                    <CardFooter pt={3} borderTopWidth="1px" borderColor="gray.100">
                      <Text fontSize="sm" color="gray.600">
                        Permissions are checked on every admin route and enforced via Supabase RLS
                      </Text>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
      
      {/* Modal for creating new role */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Role Name</FormLabel>
                <Input
                  placeholder="e.g., Support Agent, Finance Manager"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                />
                <FormHelperText>
                  Unique name for this role
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Describe what this role can do..."
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  rows={3}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <Checkbox
                  isChecked={newRole.isDefault}
                  onChange={(e) => setNewRole({...newRole, isDefault: e.target.checked})}
                  colorScheme="brand"
                  mr={3}
                >
                  Set as default role for new admins
                </Checkbox>
              </FormControl>
              
              <Divider />
              
              <Box width="100%">
                <Text fontWeight="semibold" mb={3}>
                  Permissions for this role:
                </Text>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  {Object.keys(rolePermissions).filter(key => rolePermissions[key]).length} permissions selected
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={createRole}
              isLoading={saving}
              leftIcon={<FaCheckCircle />}
            >
              Create Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for editing role */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Role: {editingRole?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingRole && (
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Role Name</FormLabel>
                  <Input
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                    rows={3}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <Checkbox
                    isChecked={editingRole.isDefault}
                    onChange={(e) => setEditingRole({...editingRole, isDefault: e.target.checked})}
                    colorScheme="brand"
                    mr={3}
                  >
                    Default role for new admins
                  </Checkbox>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={updateRole}
              isLoading={saving}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for deleting role */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Warning!</AlertTitle>
                <AlertDescription>
                  Are you sure you want to delete the role "{editingRole?.name}"? This action cannot be undone.
                </AlertDescription>
              </Box>
            </Alert>
            <Text color="gray.600" fontSize="sm">
              This will remove the role and all its permissions. Users assigned to this role will need to be reassigned.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={() => deleteRole(editingRole?.id, editingRole?.name)}
              leftIcon={<FaTrash />}
            >
              Delete Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for assigning role to user */}
      <Modal isOpen={isAssignModalOpen} onClose={onAssignModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Role to User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack spacing={4}>
                <Box width="100%">
                  <Text fontWeight="medium">User:</Text>
                  <Text fontSize="lg">{selectedUser.userName}</Text>
                </Box>
                
                <Box width="100%">
                  <Text fontWeight="medium">Current Role:</Text>
                  <Badge
                    colorScheme={getRoleBadgeColor(selectedUser.currentRole)}
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {selectedUser.currentRole}
                  </Badge>
                </Box>
                
                <FormControl>
                  <FormLabel>New Role</FormLabel>
                  <Select
                    placeholder="Select a role"
                    onChange={(e) => {
                      const selected = roles.find(r => r.id === e.target.value);
                      setSelectedUser({
                        ...selectedUser,
                        roleId: selected?.id,
                        roleName: selected?.name,
                      });
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAssignModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={assignRoleToUser}
              isDisabled={!selectedUser?.roleId}
            >
              Assign Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default RolesPermissions;