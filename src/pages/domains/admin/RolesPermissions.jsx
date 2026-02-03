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
  Portal, Spinner, Progress, Skeleton, SkeletonCircle, SkeletonText,
  InputGroup, InputLeftElement, InputRightElement,
  Checkbox, CheckboxGroup, Stack, RadioGroup, Radio,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack,
  RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, SliderMark, Grid, GridItem,
  Accordion, AccordionItem, AccordionButton, AccordionPanel,
  AccordionIcon, Image, Link, List, ListItem, ListIcon,
  OrderedList, UnorderedList, Code, Kbd, Drawer,
  DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, CloseButton,
  Editable, EditablePreview, EditableInput,
  VisuallyHidden, CircularProgress, CircularProgressLabel,
  Collapse
} from '@chakra-ui/react';

// Icons
import {
  SearchIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon,
  CheckIcon, CloseIcon, WarningIcon, RepeatIcon,
  DownloadIcon, CopyIcon, LockIcon, UnlockIcon,
  ChevronRightIcon, ChevronDownIcon, InfoIcon,
  PhoneIcon, EmailIcon, CalendarIcon, TimeIcon,
  ArrowUpIcon, ArrowDownIcon, ExternalLinkIcon,
  HamburgerIcon, SettingsIcon, StarIcon, FilterIcon,
  ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon as ChakraChevronDownIcon,
  ArrowBackIcon, ArrowForwardIcon, ArrowRightIcon,
  AttachmentIcon, AtSignIcon, BellIcon, ChatIcon,
  CheckCircleIcon, WarningTwoIcon, NotAllowedIcon,
  DownloadIcon as ChakraDownloadIcon, SunIcon, MoonIcon,
  SmallAddIcon, SmallCloseIcon, StarIcon as ChakraStarIcon,
  UpDownIcon, TimeIcon as ChakraTimeIcon, CalendarIcon as ChakraCalendarIcon,
  InfoOutlineIcon, QuestionIcon, QuestionOutlineIcon,
  SettingsIcon as ChakraSettingsIcon, ViewIcon as ChakraViewIcon,
  ViewOffIcon, TriangleUpIcon, TriangleDownIcon,
  MinusIcon, PlusIcon, ArrowLeftIcon, ArrowRightIcon as ChakraArrowRightIcon
} from '@chakra-ui/icons';
import {
  FaUserShield, FaUserTie, FaUserCheck, FaUserTimes,
  FaUserClock, FaUserLock, FaUserCog, FaChartLine,
  FaHistory, FaKey, FaBell, FaShieldAlt, FaDatabase,
  FaFilter, FaFileExport, FaFilePdf, FaFileCsv,
  FaFileExcel, FaSearch, FaCalendarAlt, FaClock,
  FaUser, FaCog, FaEye, FaEyeSlash, FaTrash,
  FaRedo, FaUndo, FaExclamationTriangle, FaInfoCircle,
  FaTable, FaColumns, FaSort, FaSortUp, FaSortDown,
  FaExpand, FaCompress, FaSave, FaPrint, FaShare,
  FaLink, FaUnlink, FaCopy, FaPaste, FaCut,
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaList, FaListOl, FaListUl, FaQuoteRight,
  FaCode, FaSuperscript, FaSubscript, FaParagraph,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaIndent, FaOutdent, FaFont, FaHeading,
  FaImage, FaVideo, FaMusic, FaFilm,
  FaMapMarker, FaMapMarkerAlt, FaGlobe, FaGlobeAmericas,
  FaPhone, FaPhoneAlt, FaEnvelope, FaEnvelopeOpen,
  FaPaperPlane, FaInbox, FaArchive, FaTrashAlt,
  FaFolder, FaFolderOpen, FaFile, FaFileAlt,
  FaFileArchive, FaFileCode, FaFileImage, FaFileVideo,
  FaFileAudio, FaFileWord, FaFilePowerpoint, FaFileExcel as FaFileExcelIcon,
  FaFilePdf as FaFilePdfIcon, FaFileSignature, FaFileContract,
  FaFileMedical, FaFileInvoice, FaFileInvoiceDollar,
  FaFileUpload, FaFileDownload, FaFileImport, FaFileExport as FaFileExportIcon,
  FaCloudUploadAlt, FaCloudDownloadAlt, FaSync, FaSyncAlt,
  FaRedoAlt, FaUndoAlt, FaRandom, FaRetweet,
  FaExchangeAlt, FaShuffle, FaRandom as FaRandomIcon,
  FaNetworkWired, FaServer, FaDatabase as FaDatabaseIcon,
  FaHdd, FaMemory, FaMicrochip, FaMicroprocessor,
  FaDesktop, FaLaptop, FaTabletAlt, FaMobileAlt,
  FaMobile, FaPhoneSquare, FaPhoneSquareAlt,
  FaChartBar, FaChartPie, FaChartArea, FaLineChart,
  FaBarChart, FaPieChart, FaAreaChart, FaChartBar as FaChartBarIcon,
  FaUserTag, FaUserFriends, FaUserPlus, FaUserMinus,
  FaUserEdit, FaUserSecret, FaUserNinja, FaUserGraduate,
  FaUserMd, FaUserInjured, FaUserAstronaut, FaUserCheck as FaUserCheckIcon,
  FaUserTimes as FaUserTimesIcon, FaUserLock as FaUserLockIcon,
  FaUserCog as FaUserCogIcon, FaUserShield as FaUserShieldIcon,
  FaUserTie as FaUserTieIcon, FaUserClock as FaUserClockIcon,
  FaUsers, FaUsersCog, FaUserCircle, FaUserAlt,
  FaIdCard, FaIdCardAlt, FaAddressCard, FaAddressBook,
  FaUserTag as FaUserTagIcon, FaUserFriends as FaUserFriendsIcon,
  FaUserPlus as FaUserPlusIcon, FaUserMinus as FaUserMinusIcon,
  FaUserEdit as FaUserEditIcon, FaUserSecret as FaUserSecretIcon,
  FaUserNinja as FaUserNinjaIcon, FaUserGraduate as FaUserGraduateIcon,
  FaUserMd as FaUserMdIcon, FaUserInjured as FaUserInjuredIcon,
  FaUserAstronaut as FaUserAstronautIcon
} from 'react-icons/fa';

// Services & Contexts
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';

// Components
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import StatusBadge from '../../../components/shared/StatusBadge';

// Utils
import { formatDate } from '../../../utils/formatters';

const RolesPermissions = () => {
  // State declarations
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 50,
    permissions: {},
    is_default: false,
    is_system: false
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Test mode state
  const [testMode, setTestMode] = useState(false);
  const [testAdminId, setTestAdminId] = useState('');
  const [testResource, setTestResource] = useState('');
  const [testAction, setTestAction] = useState('');
  const [testResult, setTestResult] = useState(null);
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  const { isOpen: isTestOpen, onOpen: onTestOpen, onClose: onTestClose } = useDisclosure();
  
  // Context hooks
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  
  // Color values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const subtleBg = useColorModeValue('gray.50', 'gray.700');
  
  // Permission categories
  const permissionCategories = useMemo(() => [
    {
      id: 'dashboard',
      name: 'Dashboard',
      permissions: [
        { id: 'dashboard.view', name: 'View Dashboard', description: 'Access main dashboard' },
        { id: 'dashboard.analytics', name: 'View Analytics', description: 'Access analytics widgets' }
      ]
    },
    {
      id: 'users',
      name: 'User Management',
      permissions: [
        { id: 'users.view', name: 'View Users', description: 'View user lists' },
        { id: 'users.create', name: 'Create Users', description: 'Create new users' },
        { id: 'users.edit', name: 'Edit Users', description: 'Edit user details' },
        { id: 'users.delete', name: 'Delete Users', description: 'Delete users' },
        { id: 'users.suspend', name: 'Suspend Users', description: 'Suspend user accounts' }
      ]
    },
    {
      id: 'drivers',
      name: 'Driver Management',
      permissions: [
        { id: 'drivers.view', name: 'View Drivers', description: 'View driver lists' },
        { id: 'drivers.create', name: 'Create Drivers', description: 'Create new drivers' },
        { id: 'drivers.edit', name: 'Edit Drivers', description: 'Edit driver details' },
        { id: 'drivers.approve', name: 'Approve Drivers', description: 'Approve driver applications' },
        { id: 'drivers.suspend', name: 'Suspend Drivers', description: 'Suspend driver accounts' },
        { id: 'drivers.verify', name: 'Verify Documents', description: 'Verify driver documents' }
      ]
    },
    {
      id: 'trips',
      name: 'Trip Management',
      permissions: [
        { id: 'trips.view', name: 'View Trips', description: 'View trip lists' },
        { id: 'trips.create', name: 'Create Trips', description: 'Create manual trips' },
        { id: 'trips.edit', name: 'Edit Trips', description: 'Edit trip details' },
        { id: 'trips.cancel', name: 'Cancel Trips', description: 'Cancel trips' },
        { id: 'trips.refund', name: 'Process Refunds', description: 'Process trip refunds' },
        { id: 'trips.dispute', name: 'Handle Disputes', description: 'Handle trip disputes' }
      ]
    },
    {
      id: 'finance',
      name: 'Finance Management',
      permissions: [
        { id: 'finance.view', name: 'View Finance', description: 'View financial data' },
        { id: 'finance.payouts', name: 'Process Payouts', description: 'Process driver payouts' },
        { id: 'finance.refunds', name: 'Process Refunds', description: 'Process payment refunds' },
        { id: 'finance.invoices', name: 'Manage Invoices', description: 'Manage invoices' },
        { id: 'finance.reports', name: 'Generate Reports', description: 'Generate financial reports' },
        { id: 'finance.adjust', name: 'Adjust Balances', description: 'Adjust wallet balances' }
      ]
    },
    {
      id: 'system',
      name: 'System Management',
      permissions: [
        { id: 'system.settings', name: 'Manage Settings', description: 'Manage system settings' },
        { id: 'system.rules', name: 'Manage Rules', description: 'Manage business rules' },
        { id: 'system.backup', name: 'Backup System', description: 'Backup system data' },
        { id: 'system.restore', name: 'Restore System', description: 'Restore from backup' },
        { id: 'system.logs', name: 'View System Logs', description: 'View system logs' }
      ]
    },
    {
      id: 'admin',
      name: 'Admin Management',
      permissions: [
        { id: 'admin_management.view', name: 'View Admins', description: 'View admin users' },
        { id: 'admin_management.create', name: 'Create Admins', description: 'Create admin accounts' },
        { id: 'admin_management.edit', name: 'Edit Admins', description: 'Edit admin details' },
        { id: 'admin_management.suspend', name: 'Suspend Admins', description: 'Suspend admin accounts' },
        { id: 'admin_management.roles', name: 'Manage Roles', description: 'Manage admin roles' }
      ]
    },
    {
      id: 'audit',
      name: 'Audit & Monitoring',
      permissions: [
        { id: 'audit_logs.view', name: 'View Audit Logs', description: 'View audit trail' },
        { id: 'audit_logs.export', name: 'Export Audit Logs', description: 'Export audit logs' },
        { id: 'audit_logs.clear', name: 'Clear Audit Logs', description: 'Clear old audit logs' },
        { id: 'reports.view', name: 'View Reports', description: 'View system reports' },
        { id: 'reports.generate', name: 'Generate Reports', description: 'Generate custom reports' }
      ]
    },
    {
      id: 'notifications',
      name: 'Notifications',
      permissions: [
        { id: 'notifications.view', name: 'View Notifications', description: 'View notifications' },
        { id: 'notifications.send', name: 'Send Notifications', description: 'Send notifications' },
        { id: 'notifications.broadcast', name: 'Broadcast Messages', description: 'Send broadcast messages' },
        { id: 'notifications.templates', name: 'Manage Templates', description: 'Manage notification templates' }
      ]
    },
    {
      id: 'emergencies',
      name: 'Emergency Management',
      permissions: [
        { id: 'emergencies.view', name: 'View Emergencies', description: 'View emergency reports' },
        { id: 'emergencies.respond', name: 'Respond to Emergencies', description: 'Respond to emergencies' },
        { id: 'emergencies.resolve', name: 'Resolve Emergencies', description: 'Resolve emergency cases' },
        { id: 'emergencies.escalate', name: 'Escalate Emergencies', description: 'Escalate to authorities' }
      ]
    }
  ], []);
  
  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch roles from system_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'admin_roles')
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching roles:', settingsError);
      }
      
      const rolesData = settingsData?.value || [
        {
          id: 'super_admin',
          name: 'Super Admin',
          description: 'Full system access',
          level: 100,
          permissions: { '*': true },
          is_default: false,
          is_system: true,
          created_at: new Date().toISOString(),
          created_by: 'system'
        },
        {
          id: 'admin',
          name: 'Admin',
          description: 'Administrative access',
          level: 90,
          permissions: {},
          is_default: false,
          is_system: true,
          created_at: new Date().toISOString(),
          created_by: 'system'
        },
        {
          id: 'operations',
          name: 'Operations',
          description: 'Operations management',
          level: 80,
          permissions: {
            'dashboard.view': true,
            'dashboard.analytics': true,
            'drivers.view': true,
            'drivers.approve': true,
            'drivers.verify': true,
            'trips.view': true,
            'trips.edit': true,
            'trips.cancel': true,
            'emergencies.view': true,
            'emergencies.respond': true
          },
          is_default: true,
          is_system: true,
          created_at: new Date().toISOString(),
          created_by: 'system'
        },
        {
          id: 'finance',
          name: 'Finance',
          description: 'Financial operations',
          level: 70,
          permissions: {
            'dashboard.view': true,
            'finance.view': true,
            'finance.payouts': true,
            'finance.refunds': true,
            'finance.invoices': true,
            'finance.reports': true,
            'trips.view': true
          },
          is_default: false,
          is_system: true,
          created_at: new Date().toISOString(),
          created_by: 'system'
        },
        {
          id: 'support',
          name: 'Support',
          description: 'Customer support',
          level: 60,
          permissions: {
            'dashboard.view': true,
            'users.view': true,
            'drivers.view': true,
            'trips.view': true,
            'trips.dispute': true,
            'emergencies.view': true,
            'emergencies.respond': true,
            'notifications.view': true,
            'notifications.send': true
          },
          is_default: false,
          is_system: true,
          created_at: new Date().toISOString(),
          created_by: 'system'
        }
      ];
      
      setRoles(Array.isArray(rolesData) ? rolesData : [rolesData].filter(Boolean));
      
      // Fetch admin users
      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select('id, email, first_name, last_name, role, status')
        .order('created_at', { ascending: false });
      
      if (adminsError) throw adminsError;
      setAdminUsers(adminsData || []);
      
      // Build permissions list from categories
      const allPermissions = [];
      permissionCategories.forEach(category => {
        category.permissions.forEach(perm => {
          allPermissions.push({
            ...perm,
            category: category.name,
            categoryId: category.id
          });
        });
      });
      setPermissions(allPermissions);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load roles and permissions');
      toast({
        title: 'Error',
        description: 'Failed to load roles and permissions',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [permissionCategories, toast]);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Role name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (formData.level < 1 || formData.level > 100) {
      errors.level = 'Level must be between 1 and 100';
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
  
  // Handle permission toggle
  const handlePermissionToggle = (permissionId, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: checked
      }
    }));
  };
  
  // Handle category permission toggle
  const handleCategoryToggle = (categoryId, checked) => {
    const category = permissionCategories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    const newPermissions = { ...formData.permissions };
    
    category.permissions.forEach(perm => {
      newPermissions[perm.id] = checked;
    });
    
    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };
  
  // Create new role
  const handleCreateRole = async () => {
    if (!validateForm()) return;
    
    try {
      setActionLoading(true);
      
      // Check if role already exists
      const roleExists = roles.some(role => 
        role.name.toLowerCase() === formData.name.toLowerCase() ||
        role.id === formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      );
      
      if (roleExists) {
        toast({
          title: 'Error',
          description: 'A role with this name already exists',
          status: 'error',
          duration: 5000,
        });
        return;
      }
      
      const newRole = {
        id: formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: formData.name,
        description: formData.description,
        level: parseInt(formData.level),
        permissions: formData.permissions,
        is_default: formData.is_default,
        is_system: false,
        created_at: new Date().toISOString(),
        created_by: user.id,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };
      
      // Get existing roles from system_settings
      const { data: existingSettings, error: fetchError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'admin_roles')
        .single();
      
      let updatedRoles = [];
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // No settings exist yet, create new
        updatedRoles = [newRole];
      } else {
        // Update existing roles
        const existingRoles = existingSettings.value || [];
        updatedRoles = [...existingRoles, newRole];
      }
      
      // Save to system_settings
      const { error: saveError } = await supabase
        .from('system_settings')
        .upsert({
          category: 'admin_roles',
          key: 'roles',
          value: updatedRoles,
          data_type: 'json',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'category,key'
        });
      
      if (saveError) throw saveError;
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'role_created',
        resource_type: 'admin_role',
        resource_id: newRole.id,
        details: {
          role_name: newRole.name,
          permissions_count: Object.keys(newRole.permissions).filter(k => newRole.permissions[k]).length,
          created_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Role created successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        level: 50,
        permissions: {},
        is_default: false,
        is_system: false
      });
      onCreateClose();
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Error creating role:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create role',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Update role
  const handleUpdateRole = async () => {
    if (!validateForm() || !selectedRole) return;
    
    try {
      setActionLoading(true);
      
      const updatedRole = {
        ...selectedRole,
        name: formData.name,
        description: formData.description,
        level: parseInt(formData.level),
        permissions: formData.permissions,
        is_default: formData.is_default,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };
      
      // Get existing roles
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'admin_roles')
        .single();
      
      const existingRoles = existingSettings?.value || [];
      const updatedRoles = existingRoles.map(role => 
        role.id === selectedRole.id ? updatedRole : role
      );
      
      // Save updated roles
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          category: 'admin_roles',
          key: 'roles',
          value: updatedRoles,
          data_type: 'json',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'category,key'
        });
      
      if (error) throw error;
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'role_updated',
        resource_type: 'admin_role',
        resource_id: selectedRole.id,
        details: {
          role_name: selectedRole.name,
          new_name: formData.name,
          permissions_changed: true,
          updated_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Role updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Close modal
      onEditClose();
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Error updating role:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update role',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Delete role
  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    try {
      setActionLoading(true);
      
      // Check if role is in use
      const adminsWithRole = adminUsers.filter(admin => admin.role === selectedRole.id);
      if (adminsWithRole.length > 0 && !selectedRole.is_system) {
        toast({
          title: 'Cannot Delete',
          description: `Role is assigned to ${adminsWithRole.length} admin(s). Reassign them first.`,
          status: 'error',
          duration: 5000,
        });
        onDeleteClose();
        return;
      }
      
      // Prevent deletion of system roles
      if (selectedRole.is_system) {
        toast({
          title: 'Cannot Delete',
          description: 'System roles cannot be deleted',
          status: 'error',
          duration: 5000,
        });
        onDeleteClose();
        return;
      }
      
      // Get existing roles
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'admin_roles')
        .single();
      
      const existingRoles = existingSettings?.value || [];
      const updatedRoles = existingRoles.filter(role => role.id !== selectedRole.id);
      
      // Save updated roles
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          category: 'admin_roles',
          key: 'roles',
          value: updatedRoles,
          data_type: 'json',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'category,key'
        });
      
      if (error) throw error;
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'role_deleted',
        resource_type: 'admin_role',
        resource_id: selectedRole.id,
        details: {
          role_name: selectedRole.name,
          deleted_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Close modal
      onDeleteClose();
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Error deleting role:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete role',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Assign role to admin
  const handleAssignRole = async (adminId, roleId) => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('admins')
        .update({
          role: roleId,
          updated_at: new Date().toISOString(),
          last_updated_by: user.id
        })
        .eq('id', adminId);
      
      if (error) throw error;
      
      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'role_assigned',
        resource_type: 'admin',
        resource_id: adminId,
        details: {
          admin_id: adminId,
          role_id: roleId,
          assigned_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Role assigned successfully',
        status: 'success',
        duration: 3000,
      });
      
      onAssignClose();
      fetchData();
      
    } catch (err) {
      console.error('Error assigning role:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign role',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Test permission
  const handleTestPermission = async () => {
    if (!testAdminId || !testResource || !testAction) {
      toast({
        title: 'Error',
        description: 'Please fill all test fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    try {
      setTestResult(null);
      
      // Get admin's role
      const admin = adminUsers.find(a => a.id === testAdminId);
      if (!admin) {
        setTestResult({
          allowed: false,
          reason: 'Admin not found'
        });
        return;
      }
      
      const role = roles.find(r => r.id === admin.role);
      if (!role) {
        setTestResult({
          allowed: false,
          reason: 'Role not found'
        });
        return;
      }
      
      // Check permission
      const permissionKey = `${testResource}.${testAction}`;
      const hasWildcard = role.permissions['*'] === true;
      const hasSpecific = role.permissions[permissionKey] === true;
      const allowed = hasWildcard || hasSpecific;
      
      setTestResult({
        allowed,
        admin: `${admin.first_name} ${admin.last_name}`,
        role: role.name,
        permission: permissionKey,
        wildcard: hasWildcard,
        specific: hasSpecific,
        level: role.level
      });
      
    } catch (err) {
      console.error('Error testing permission:', err);
      setTestResult({
        allowed: false,
        reason: err.message || 'Test failed'
      });
    }
  };
  
  // Open edit modal
  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      level: role.level,
      permissions: role.permissions || {},
      is_default: role.is_default || false,
      is_system: role.is_system || false
    });
    onEditOpen();
  };
  
  // Open delete modal
  const openDeleteModal = (role) => {
    setSelectedRole(role);
    onDeleteOpen();
  };
  
  // Open assign modal
  const openAssignModal = (role) => {
    setSelectedRole(role);
    onAssignOpen();
  };
  
  // Get role color
  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 'super_admin': return 'red';
      case 'admin': return 'purple';
      case 'operations': return 'blue';
      case 'finance': return 'green';
      case 'support': return 'orange';
      case 'analytics': return 'teal';
      default: return 'gray';
    }
  };
  
  // Get permission count for role
  const getPermissionCount = (role) => {
    if (!role.permissions) return 0;
    if (role.permissions['*'] === true) return 'All';
    return Object.keys(role.permissions).filter(k => role.permissions[k] === true).length;
  };
  
  // Get admin count for role
  const getAdminCount = (roleId) => {
    return adminUsers.filter(admin => admin.role === roleId).length;
  };
  
  // Loading state
  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Roles & Permissions</Heading>
        </Flex>
        <LoadingSpinner text="Loading roles and permissions..." fullPage={false} />
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
            <Text fontWeight="bold">Error loading data</Text>
            <Text fontSize="sm">{error}</Text>
          </Box>
        </Alert>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={fetchData}
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
          <Heading size="lg">Roles & Permissions</Heading>
          <Text color="gray.500" fontSize="sm">
            Configure admin roles and granular permissions
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<FaSearch />}
            variant="outline"
            onClick={onTestOpen}
          >
            Test Permissions
          </Button>
          
          {hasPermission('admin_management', 'roles') && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onCreateOpen}
            >
              Create Role
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Total Roles</StatLabel>
              <StatNumber>{roles.length}</StatNumber>
              <StatHelpText>
                {roles.filter(r => !r.is_system).length} custom
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Total Permissions</StatLabel>
              <StatNumber>{permissions.length}</StatNumber>
              <StatHelpText>
                Across {permissionCategories.length} categories
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Admin Users</StatLabel>
              <StatNumber>{adminUsers.length}</StatNumber>
              <StatHelpText>
                Across all roles
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>System Roles</StatLabel>
              <StatNumber>{roles.filter(r => r.is_system).length}</StatNumber>
              <StatHelpText>
                Protected from deletion
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Main Content Tabs */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Roles</Tab>
          <Tab>Permission Matrix</Tab>
          <Tab>Admin Assignments</Tab>
          <Tab>Permission Categories</Tab>
        </TabList>
        
        <TabPanels>
          {/* Roles Tab */}
          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Admin Roles</Heading>
                  <Text fontSize="sm" color="gray.500">
                    {roles.length} roles defined
                  </Text>
                </Flex>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {roles.map((role) => (
                    <Card 
                      key={role.id} 
                      border="1px" 
                      borderColor={borderColor}
                      bg={role.is_default ? 'blue.50' : cardBg}
                      _dark={{ bg: role.is_default ? 'blue.900' : cardBg }}
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between" align="start">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Heading size="md">{role.name}</Heading>
                                {role.is_system && (
                                  <Badge colorScheme="purple" fontSize="xs">
                                    System
                                  </Badge>
                                )}
                                {role.is_default && (
                                  <Badge colorScheme="blue" fontSize="xs">
                                    Default
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="sm" color="gray.500">
                                {role.description}
                              </Text>
                            </VStack>
                            <Badge
                              colorScheme={getRoleColor(role.id)}
                              variant="solid"
                              px={2}
                              py={1}
                            >
                              Level {role.level}
                            </Badge>
                          </Flex>
                          
                          <Divider />
                          
                          <SimpleGrid columns={2} spacing={2}>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Permissions</Text>
                              <Text fontWeight="bold">
                                {getPermissionCount(role)}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Admins</Text>
                              <Text fontWeight="bold">
                                {getAdminCount(role.id)}
                              </Text>
                            </Box>
                          </SimpleGrid>
                          
                          <Divider />
                          
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<ViewIcon />}
                              onClick={() => openEditModal(role)}
                              flex={1}
                            >
                              View
                            </Button>
                            
                            {hasPermission('admin_management', 'roles') && !role.is_system && (
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                leftIcon={<DeleteIcon />}
                                onClick={() => openDeleteModal(role)}
                              >
                                Delete
                              </Button>
                            )}
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Permission Matrix Tab */}
          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                <Heading size="md">Permission Matrix</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Permission</Th>
                        {roles.map(role => (
                          <Th key={role.id} textAlign="center">
                            <VStack spacing={1}>
                              <Text fontSize="xs">{role.name}</Text>
                              <Badge
                                size="xs"
                                colorScheme={getRoleColor(role.id)}
                              >
                                L{role.level}
                              </Badge>
                            </VStack>
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {permissionCategories.map(category => (
                        <React.Fragment key={category.id}>
                          <Tr bg={subtleBg}>
                            <Th colSpan={roles.length + 1}>
                              <HStack>
                                <Text fontWeight="bold">{category.name}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  ({category.permissions.length} permissions)
                                </Text>
                              </HStack>
                            </Th>
                          </Tr>
                          {category.permissions.map(permission => (
                            <Tr key={permission.id} _hover={{ bg: 'gray.50' }}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">{permission.name}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {permission.id}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {permission.description}
                                  </Text>
                                </VStack>
                              </Td>
                              {roles.map(role => (
                                <Td key={`${permission.id}-${role.id}`} textAlign="center">
                                  {role.permissions['*'] === true ? (
                                    <Badge colorScheme="green" variant="subtle">
                                      All
                                    </Badge>
                                  ) : role.permissions[permission.id] === true ? (
                                    <CheckIcon color="green.500" />
                                  ) : (
                                    <CloseIcon color="red.500" />
                                  )}
                                </Td>
                              ))}
                            </Tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Admin Assignments Tab */}
          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                <Heading size="md">Admin Role Assignments</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Admin</Th>
                        <Th>Current Role</Th>
                        <Th>Status</Th>
                        <Th>Last Active</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {adminUsers.map(admin => {
                        const role = roles.find(r => r.id === admin.role);
                        return (
                          <Tr key={admin.id}>
                            <Td>
                              <HStack spacing={3}>
                                <Avatar
                                  size="sm"
                                  name={`${admin.first_name} ${admin.last_name}`}
                                />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">
                                    {admin.first_name} {admin.last_name}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {admin.email}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Td>
                            <Td>
                              {role ? (
                                <Badge
                                  colorScheme={getRoleColor(role.id)}
                                  px={2}
                                  py={1}
                                >
                                  {role.name}
                                </Badge>
                              ) : (
                                <Badge colorScheme="red">Unknown</Badge>
                              )}
                            </Td>
                            <Td>
                              <StatusBadge
                                status={admin.status}
                                variant="subtle"
                              />
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {/* Last active would come from admin data */}
                                Recently
                              </Text>
                            </Td>
                            <Td>
                              {hasPermission('admin_management', 'edit') && (
                                <Menu>
                                  <MenuButton as={Button} size="xs">
                                    Change Role
                                  </MenuButton>
                                  <MenuList>
                                    {roles.map(r => (
                                      <MenuItem
                                        key={r.id}
                                        onClick={() => handleAssignRole(admin.id, r.id)}
                                        isDisabled={r.id === admin.role}
                                      >
                                        {r.name}
                                      </MenuItem>
                                    ))}
                                  </MenuList>
                                </Menu>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Permission Categories Tab */}
          <TabPanel p={0} pt={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {permissionCategories.map(category => (
                <Card key={category.id} bg={cardBg} border="1px" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">{category.name}</Heading>
                    <Text fontSize="sm" color="gray.500">
                      {category.permissions.length} permissions
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      {category.permissions.map(permission => (
                        <Box
                          key={permission.id}
                          p={3}
                          border="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          _hover={{ bg: subtleBg }}
                        >
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">{permission.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {permission.description}
                            </Text>
                            <Code fontSize="xs" p={1} borderRadius="sm">
                              {permission.id}
                            </Code>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Create Role Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="full">
        <ModalOverlay />
        <ModalContent maxW="90vw" h="90vh">
          <ModalHeader>Create New Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <VStack spacing={6} align="stretch">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <Heading size="md">Basic Information</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired isInvalid={!!formErrors.name}>
                      <FormLabel>Role Name</FormLabel>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Support Manager"
                      />
                      {formErrors.name && (
                        <Text color="red.500" fontSize="sm">{formErrors.name}</Text>
                      )}
                    </FormControl>
                    
                    <FormControl isRequired isInvalid={!!formErrors.level}>
                      <FormLabel>Role Level (1-100)</FormLabel>
                      <NumberInput
                        min={1}
                        max={100}
                        value={formData.level}
                        onChange={(value) => handleInputChange({ target: { name: 'level', value } })}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text fontSize="xs" color="gray.500">
                        Higher level roles override lower levels
                      </Text>
                      {formErrors.level && (
                        <Text color="red.500" fontSize="sm">{formErrors.level}</Text>
                      )}
                    </FormControl>
                    
                    <FormControl isRequired isInvalid={!!formErrors.description}>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the role's purpose and responsibilities"
                        rows={3}
                      />
                      {formErrors.description && (
                        <Text color="red.500" fontSize="sm">{formErrors.description}</Text>
                      )}
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Settings</FormLabel>
                      <VStack align="start" spacing={3}>
                        <Checkbox
                          name="is_default"
                          isChecked={formData.is_default}
                          onChange={(e) => handleInputChange(e)}
                        >
                          Set as default role for new admins
                        </Checkbox>
                        <Text fontSize="xs" color="gray.500">
                          Only one role can be default
                        </Text>
                      </VStack>
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>
              
              {/* Permissions Selection */}
              <Card>
                <CardHeader>
                  <Heading size="md">Permissions</Heading>
                  <Text fontSize="sm" color="gray.500">
                    Select permissions for this role
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    {/* Quick Actions */}
                    <HStack spacing={4} wrap="wrap">
                      <Button
                        size="sm"
                        onClick={() => {
                          const allPerms = {};
                          permissions.forEach(p => {
                            allPerms[p.id] = true;
                          });
                          setFormData(prev => ({ ...prev, permissions: allPerms }));
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, permissions: {} }))}
                      >
                        Clear All
                      </Button>
                      <Checkbox
                        isChecked={formData.permissions['*'] === true}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: { '*': true } 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: {} 
                            }));
                          }
                        }}
                      >
                        Grant All Permissions (Wildcard)
                      </Checkbox>
                    </HStack>
                    
                    {/* Permission Categories */}
                    {permissionCategories.map(category => (
                      <Card key={category.id} variant="outline">
                        <CardHeader py={3}>
                          <Flex justify="space-between" align="center">
                            <Heading size="sm">{category.name}</Heading>
                            <Checkbox
                              isChecked={category.permissions.every(p => formData.permissions[p.id] === true)}
                              isIndeterminate={
                                category.permissions.some(p => formData.permissions[p.id] === true) &&
                                !category.permissions.every(p => formData.permissions[p.id] === true)
                              }
                              onChange={(e) => handleCategoryToggle(category.id, e.target.checked)}
                            >
                              Select All
                            </Checkbox>
                          </Flex>
                        </CardHeader>
                        <CardBody pt={0}>
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                            {category.permissions.map(permission => (
                              <Box
                                key={permission.id}
                                p={3}
                                border="1px"
                                borderColor={borderColor}
                                borderRadius="md"
                                bg={formData.permissions[permission.id] ? 'blue.50' : 'transparent'}
                                _dark={{ bg: formData.permissions[permission.id] ? 'blue.900' : 'transparent' }}
                              >
                                <Checkbox
                                  isChecked={formData.permissions[permission.id] === true || formData.permissions['*'] === true}
                                  isDisabled={formData.permissions['*'] === true}
                                  onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                                >
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">{permission.name}</Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {permission.description}
                                    </Text>
                                    <Code fontSize="xs">{permission.id}</Code>
                                  </VStack>
                                </Checkbox>
                              </Box>
                            ))}
                          </SimpleGrid>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
              
              {/* Summary */}
              <Card>
                <CardHeader>
                  <Heading size="md">Summary</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontWeight="medium" color="gray.500">Role Name</Text>
                      <Text>{formData.name || '—'}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.500">Role Level</Text>
                      <Text>{formData.level}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.500">Permissions Count</Text>
                      <Text>
                        {formData.permissions['*'] === true 
                          ? 'All permissions (wildcard)'
                          : `${Object.keys(formData.permissions).filter(k => formData.permissions[k] === true).length} selected`
                        }
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.500">Default Role</Text>
                      <Text>{formData.is_default ? 'Yes' : 'No'}</Text>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateRole}
              isLoading={actionLoading}
              loadingText="Creating..."
            >
              Create Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Edit Role Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="full">
        <ModalOverlay />
        <ModalContent maxW="90vw" h="90vh">
          <ModalHeader>Edit Role: {selectedRole?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {selectedRole && (
              <VStack spacing={6} align="stretch">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Basic Information</Heading>
                    {selectedRole.is_system && (
                      <Alert status="info" mt={2} size="sm">
                        <AlertIcon />
                        This is a system role. Some properties cannot be modified.
                      </Alert>
                    )}
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired isInvalid={!!formErrors.name}>
                        <FormLabel>Role Name</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          isDisabled={selectedRole.is_system}
                        />
                      </FormControl>
                      
                      <FormControl isRequired isInvalid={!!formErrors.level}>
                        <FormLabel>Role Level (1-100)</FormLabel>
                        <NumberInput
                          min={1}
                          max={100}
                          value={formData.level}
                          onChange={(value) => handleInputChange({ target: { name: 'level', value } })}
                          isDisabled={selectedRole.is_system}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        {formErrors.level && (
                          <Text color="red.500" fontSize="sm">{formErrors.level}</Text>
                        )}
                      </FormControl>
                      
                      <FormControl isRequired isInvalid={!!formErrors.description}>
                        <FormLabel>Description</FormLabel>
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Settings</FormLabel>
                        <VStack align="start" spacing={3}>
                          <Checkbox
                            name="is_default"
                            isChecked={formData.is_default}
                            onChange={(e) => handleInputChange(e)}
                            isDisabled={selectedRole.is_system}
                          >
                            Set as default role for new admins
                          </Checkbox>
                        </VStack>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>
                
                {/* Permissions - Same as create modal but with current values */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Permissions</Heading>
                    <Text fontSize="sm" color="gray.500">
                      {getPermissionCount(selectedRole)} permissions currently assigned
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      <HStack spacing={4} wrap="wrap">
                        <Button
                          size="sm"
                          onClick={() => {
                            const allPerms = {};
                            permissions.forEach(p => {
                              allPerms[p.id] = true;
                            });
                            setFormData(prev => ({ ...prev, permissions: allPerms }));
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, permissions: {} }))}
                        >
                          Clear All
                        </Button>
                      </HStack>
                      
                      {permissionCategories.map(category => (
                        <Card key={category.id} variant="outline">
                          <CardHeader py={3}>
                            <Flex justify="space-between" align="center">
                              <Heading size="sm">{category.name}</Heading>
                              <Checkbox
                                isChecked={category.permissions.every(p => formData.permissions[p.id] === true)}
                                isIndeterminate={
                                  category.permissions.some(p => formData.permissions[p.id] === true) &&
                                  !category.permissions.every(p => formData.permissions[p.id] === true)
                                }
                                onChange={(e) => handleCategoryToggle(category.id, e.target.checked)}
                              >
                                Select All
                              </Checkbox>
                            </Flex>
                          </CardHeader>
                          <CardBody pt={0}>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                              {category.permissions.map(permission => (
                                <Box
                                  key={permission.id}
                                  p={3}
                                  border="1px"
                                  borderColor={borderColor}
                                  borderRadius="md"
                                  bg={formData.permissions[permission.id] ? 'blue.50' : 'transparent'}
                                  _dark={{ bg: formData.permissions[permission.id] ? 'blue.900' : 'transparent' }}
                                >
                                  <Checkbox
                                    isChecked={formData.permissions[permission.id] === true}
                                    onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                                  >
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="medium">{permission.name}</Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {permission.description}
                                      </Text>
                                      <Code fontSize="xs">{permission.id}</Code>
                                    </VStack>
                                  </Checkbox>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdateRole}
              isLoading={actionLoading}
              loadingText="Updating..."
            >
              Update Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Role Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
        type="warning"
        confirmText="Delete Role"
        isLoading={actionLoading}
      />
      
      {/* Test Permissions Modal */}
      <Modal isOpen={isTestOpen} onClose={onTestClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Test Permissions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Test if an admin has specific permissions
                </Text>
              </Alert>
              
              <FormControl>
                <FormLabel>Select Admin</FormLabel>
                <Select
                  value={testAdminId}
                  onChange={(e) => setTestAdminId(e.target.value)}
                  placeholder="Choose an admin"
                >
                  {adminUsers.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.first_name} {admin.last_name} ({admin.email})
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Resource</FormLabel>
                  <Select
                    value={testResource}
                    onChange={(e) => setTestResource(e.target.value)}
                    placeholder="Select resource"
                  >
                    {permissionCategories.map(category => (
                      <optgroup key={category.id} label={category.name}>
                        {category.permissions.map(perm => (
                          <option key={perm.id} value={perm.id.split('.')[0]}>
                            {perm.id.split('.')[0]}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Action</FormLabel>
                  <Select
                    value={testAction}
                    onChange={(e) => setTestAction(e.target.value)}
                    placeholder="Select action"
                  >
                    <option value="view">view</option>
                    <option value="create">create</option>
                    <option value="edit">edit</option>
                    <option value="delete">delete</option>
                    <option value="suspend">suspend</option>
                    <option value="approve">approve</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              
              <Button
                colorScheme="blue"
                onClick={handleTestPermission}
                isDisabled={!testAdminId || !testResource || !testAction}
              >
                Test Permission
              </Button>
              
              {testResult && (
                <Card 
                  bg={testResult.allowed ? 'green.50' : 'red.50'} 
                  borderColor={testResult.allowed ? 'green.200' : 'red.200'}
                >
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Result:</Text>
                        <Badge
                          colorScheme={testResult.allowed ? 'green' : 'red'}
                          fontSize="md"
                        >
                          {testResult.allowed ? 'ALLOWED' : 'DENIED'}
                        </Badge>
                      </HStack>
                      
                      <Divider />
                      
                      <SimpleGrid columns={2} spacing={2}>
                        <Text fontWeight="medium">Admin:</Text>
                        <Text>{testResult.admin}</Text>
                        
                        <Text fontWeight="medium">Role:</Text>
                        <Text>{testResult.role}</Text>
                        
                        <Text fontWeight="medium">Permission:</Text>
                        <Code fontSize="sm">{testResult.permission}</Code>
                        
                        <Text fontWeight="medium">Access Type:</Text>
                        <Text>
                          {testResult.wildcard ? 'Wildcard (*)' : testResult.specific ? 'Specific' : 'None'}
                        </Text>
                        
                        <Text fontWeight="medium">Role Level:</Text>
                        <Text>{testResult.level}</Text>
                      </SimpleGrid>
                      
                      {testResult.reason && (
                        <>
                          <Divider />
                          <Text fontWeight="medium">Reason:</Text>
                          <Text color="red.500">{testResult.reason}</Text>
                        </>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onTestClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Assign Role Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Role: {selectedRole?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRole && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Select admins to assign the <strong>{selectedRole.name}</strong> role to:
                </Text>
                
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Admin</Th>
                        <Th>Current Role</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {adminUsers.map(admin => {
                        const currentRole = roles.find(r => r.id === admin.role);
                        return (
                          <Tr key={admin.id}>
                            <Td>
                              <Text>
                                {admin.first_name} {admin.last_name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {admin.email}
                              </Text>
                            </Td>
                            <Td>
                              {currentRole ? (
                                <Badge colorScheme={getRoleColor(currentRole.id)}>
                                  {currentRole.name}
                                </Badge>
                              ) : (
                                <Text fontSize="sm">—</Text>
                              )}
                            </Td>
                            <Td>
                              <Button
                                size="xs"
                                onClick={() => handleAssignRole(admin.id, selectedRole.id)}
                                isDisabled={admin.role === selectedRole.id}
                              >
                                {admin.role === selectedRole.id ? 'Assigned' : 'Assign'}
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onAssignClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RolesPermissions;