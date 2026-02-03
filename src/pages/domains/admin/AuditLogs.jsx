import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  VisuallyHidden, CircularProgress, CircularProgressLabel
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
  ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon,
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
  FaBarChart, FaPieChart, FaAreaChart, FaChartBar as FaChartBarIcon
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
import StatusBadge from '../../../components/shared/StatusBadge';

// Utils
import { formatDate, formatCurrency, formatPhone, truncateText } from '../../../utils/formatters';

const AuditLogs = () => {
  // State declarations
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    byActionType: {},
    byResource: {},
    topAdmins: []
  });
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    admin_id: '',
    action_type: '',
    resource_type: '',
    resource_id: '',
    start_date: '',
    end_date: '',
    search: '',
    page: 1,
    pageSize: 50,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Modal states
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isClearOpen, onOpen: onClearOpen, onClose: onClearClose } = useDisclosure();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  
  // Context hooks
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const toast = useToast();
  
  // Refs
  const exportFormRef = useRef();
  const clearFormRef = useRef();
  
  // Color values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const subtleBg = useColorModeValue('gray.50', 'gray.700');
  
  // Fetch audit logs with filters
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query
      let query = supabase
        .from('admin_actions_log')
        .select(`
          *,
          admin:admin_id (
            id,
            email,
            first_name,
            last_name,
            role
          )
        `, { count: 'exact' });
      
      // Apply filters
      if (filters.admin_id) {
        query = query.eq('admin_id', filters.admin_id);
      }
      
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      
      if (filters.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
      }
      
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date + ' 23:59:59');
      }
      
      if (filters.search) {
        query = query.or(`action_type.ilike.%${filters.search}%,resource_type.ilike.%${filters.search}%,details->>description.ilike.%${filters.search}%`);
      }
      
      // Apply sorting
      query = query.order(filters.sortBy, { 
        ascending: filters.sortOrder === 'asc' 
      });
      
      // Apply pagination
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);
      
      const { data, error: queryError, count } = await query;
      
      if (queryError) throw queryError;
      
      setAuditLogs(data || []);
      setTotalRecords(count || 0);
      setTotalPages(Math.ceil((count || 0) / filters.pageSize));
      
      // Fetch statistics
      await fetchStatistics();
      
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);
  
  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      // Today's count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('admin_actions_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      
      // This week's count
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weekCount } = await supabase
        .from('admin_actions_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());
      
      // Action type distribution
      const { data: actionTypes } = await supabase
        .from('admin_actions_log')
        .select('action_type')
        .gte('created_at', weekAgo.toISOString());
      
      const actionTypeCount = {};
      actionTypes?.forEach(item => {
        actionTypeCount[item.action_type] = (actionTypeCount[item.action_type] || 0) + 1;
      });
      
      // Resource type distribution
      const { data: resourceTypes } = await supabase
        .from('admin_actions_log')
        .select('resource_type')
        .gte('created_at', weekAgo.toISOString());
      
      const resourceTypeCount = {};
      resourceTypes?.forEach(item => {
        resourceTypeCount[item.resource_type] = (resourceTypeCount[item.resource_type] || 0) + 1;
      });
      
      // Top admins
      const { data: topAdmins } = await supabase
        .from('admin_actions_log')
        .select('admin_id, admin:admin_id(email, first_name, last_name)')
        .gte('created_at', weekAgo.toISOString());
      
      const adminCount = {};
      topAdmins?.forEach(item => {
        if (item.admin_id) {
          adminCount[item.admin_id] = {
            count: (adminCount[item.admin_id]?.count || 0) + 1,
            admin: item.admin
          };
        }
      });
      
      const topAdminsList = Object.entries(adminCount)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Total count
      const { count: totalCount } = await supabase
        .from('admin_actions_log')
        .select('*', { count: 'exact', head: true });
      
      setStats({
        total: totalCount || 0,
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        byActionType: actionTypeCount,
        byResource: resourceTypeCount,
        topAdmins: topAdminsList
      });
      
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);
  
  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'admin_actions_log' },
        () => {
          fetchAuditLogs();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAuditLogs]);
  
  // Initial fetch
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page on filter change
    }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      admin_id: '',
      action_type: '',
      resource_type: '',
      resource_id: '',
      start_date: '',
      end_date: '',
      search: '',
      page: 1,
      pageSize: 50,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };
  
  // Export audit logs
  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      
      // Build export query
      let query = supabase
        .from('admin_actions_log')
        .select(`
          *,
          admin:admin_id (
            email,
            first_name,
            last_name
          )
        `);
      
      // Apply same filters
      if (filters.admin_id) query = query.eq('admin_id', filters.admin_id);
      if (filters.action_type) query = query.eq('action_type', filters.action_type);
      if (filters.resource_type) query = query.eq('resource_type', filters.resource_type);
      if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);
      if (filters.start_date) query = query.gte('created_at', filters.start_date);
      if (filters.end_date) query = query.lte('created_at', filters.end_date + ' 23:59:59');
      if (filters.search) {
        query = query.or(`action_type.ilike.%${filters.search}%,resource_type.ilike.%${filters.search}%,details->>description.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format data for export
      const exportData = data.map(log => ({
        'Timestamp': formatDate(log.created_at, 'datetime'),
        'Admin': log.admin ? `${log.admin.first_name} ${log.admin.last_name}` : 'System',
        'Admin Email': log.admin?.email || '',
        'Action Type': log.action_type,
        'Resource Type': log.resource_type,
        'Resource ID': log.resource_id || '',
        'Description': log.details?.description || '',
        'IP Address': log.ip_address,
        'User Agent': log.user_agent || '',
        'Details': JSON.stringify(log.details || {}, null, 2)
      }));
      
      if (format === 'csv') {
        // Convert to CSV
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
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
      } else if (format === 'pdf') {
        // In a real app, you would use a PDF library like jsPDF or generate on server
        toast({
          title: 'PDF Export',
          description: 'PDF export would be generated on server side. Using CSV for now.',
          status: 'info',
          duration: 5000,
        });
        
        // Fallback to CSV
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
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }
      
      // Log export action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'audit_logs_exported',
        resource_type: 'audit_logs',
        resource_id: null,
        details: {
          format: format,
          filter_count: exportData.length,
          filters_applied: filters
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: `Audit logs exported successfully (${exportData.length} records)`,
        status: 'success',
        duration: 3000,
      });
      
      onExportClose();
      
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to export audit logs',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setExportLoading(false);
    }
  };
  
  // Clear old logs
  const handleClearOldLogs = async (days) => {
    try {
      setClearLoading(true);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const { data: logsToDelete, error: fetchError } = await supabase
        .from('admin_actions_log')
        .select('id, created_at')
        .lt('created_at', cutoffDate.toISOString());
      
      if (fetchError) throw fetchError;
      
      const { error: deleteError } = await supabase
        .from('admin_actions_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (deleteError) throw deleteError;
      
      // Log the cleanup action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'audit_logs_cleared',
        resource_type: 'audit_logs',
        resource_id: null,
        details: {
          days_old: days,
          records_deleted: logsToDelete?.length || 0,
          cutoff_date: cutoffDate.toISOString()
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: `Cleared ${logsToDelete?.length || 0} audit logs older than ${days} days`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh data
      fetchAuditLogs();
      onClearClose();
      
    } catch (err) {
      console.error('Error clearing old logs:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to clear old logs',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setClearLoading(false);
    }
  };
  
  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    onDetailsOpen();
  };
  
  // Get action type color
  const getActionColor = (actionType) => {
    if (actionType.includes('create') || actionType.includes('add')) return 'green';
    if (actionType.includes('update') || actionType.includes('edit')) return 'blue';
    if (actionType.includes('delete') || actionType.includes('remove')) return 'red';
    if (actionType.includes('suspend') || actionType.includes('block')) return 'orange';
    if (actionType.includes('approve') || actionType.includes('activate')) return 'teal';
    if (actionType.includes('login') || actionType.includes('logout')) return 'purple';
    if (actionType.includes('export') || actionType.includes('download')) return 'cyan';
    return 'gray';
  };
  
  // Table columns
  const columns = useMemo(() => [
    {
      Header: 'Timestamp',
      accessor: 'created_at',
      Cell: ({ value }) => (
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" fontWeight="medium">
            {formatDate(value, 'time')}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {formatDate(value, 'date')}
          </Text>
        </VStack>
      ),
      width: 120
    },
    {
      Header: 'Admin',
      accessor: 'admin',
      Cell: ({ value }) => (
        value ? (
          <HStack spacing={2}>
            <Avatar
              size="xs"
              name={`${value.first_name} ${value.last_name}`}
              bg={value.role === 'SUPER_ADMIN' ? 'red.500' : 'blue.500'}
            />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm">
                {value.first_name} {value.last_name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {value.email}
              </Text>
            </VStack>
          </HStack>
        ) : (
          <Text fontSize="sm" color="gray.500">System</Text>
        )
      ),
      width: 150
    },
    {
      Header: 'Action',
      accessor: 'action_type',
      Cell: ({ value }) => (
        <Badge
          colorScheme={getActionColor(value)}
          variant="subtle"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
        >
          {value.replace(/_/g, ' ')}
        </Badge>
      ),
      width: 120
    },
    {
      Header: 'Resource',
      accessor: 'resource_type',
      Cell: ({ row }) => (
        <HStack spacing={2}>
          <Badge
            colorScheme="gray"
            variant="outline"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
          >
            {row.original.resource_type || '—'}
          </Badge>
          {row.original.resource_id && (
            <Text fontSize="xs" color="gray.500">
              ID: {truncateText(row.original.resource_id, 8)}
            </Text>
          )}
        </HStack>
      ),
      width: 140
    },
    {
      Header: 'Description',
      accessor: 'details.description',
      Cell: ({ row }) => (
        <Text fontSize="sm" noOfLines={2}>
          {row.original.details?.description || 
           row.original.details?.message || 
           `${row.original.action_type} on ${row.original.resource_type}`}
        </Text>
      ),
      width: 200
    },
    {
      Header: 'IP Address',
      accessor: 'ip_address',
      Cell: ({ value }) => (
        <Code fontSize="xs" p={1} borderRadius="sm">
          {value}
        </Code>
      ),
      width: 120
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <HStack spacing={1}>
          <Tooltip label="View Details">
            <IconButton
              size="xs"
              icon={<ViewIcon />}
              aria-label="View Details"
              onClick={() => viewLogDetails(row.original)}
              variant="ghost"
            />
          </Tooltip>
          
          <Tooltip label="Copy ID">
            <IconButton
              size="xs"
              icon={<CopyIcon />}
              aria-label="Copy ID"
              onClick={() => {
                navigator.clipboard.writeText(row.original.id);
                toast({
                  title: 'Copied',
                  description: 'Log ID copied to clipboard',
                  status: 'success',
                  duration: 2000,
                });
              }}
              variant="ghost"
            />
          </Tooltip>
        </HStack>
      ),
      width: 80
    }
  ], [toast]);
  
  // Action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set();
    auditLogs.forEach(log => {
      if (log.action_type) types.add(log.action_type);
    });
    return Array.from(types).sort();
  }, [auditLogs]);
  
  // Resource types for filter dropdown
  const resourceTypes = useMemo(() => {
    const types = new Set();
    auditLogs.forEach(log => {
      if (log.resource_type) types.add(log.resource_type);
    });
    return Array.from(types).sort();
  }, [auditLogs]);
  
  // Loading state
  if (loading && auditLogs.length === 0) {
    return (
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Audit Logs</Heading>
        </Flex>
        <LoadingSpinner text="Loading audit logs..." fullPage={false} />
      </Box>
    );
  }
  
  // Error state
  if (error && auditLogs.length === 0) {
    return (
      <Box p={6}>
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Error loading audit logs</Text>
            <Text fontSize="sm">{error}</Text>
          </Box>
        </Alert>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={fetchAuditLogs}
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
          <Heading size="lg">Audit Logs</Heading>
          <Text color="gray.500" fontSize="sm">
            Complete audit trail of all admin actions
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<FilterIcon />}
            variant="outline"
            onClick={onFilterOpen}
          >
            Filters
          </Button>
          
          <Menu>
            <MenuButton as={Button} leftIcon={<DownloadIcon />} colorScheme="blue">
              Export
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FaFileCsv />} onClick={() => handleExport('csv')}>
                Export as CSV
              </MenuItem>
              <MenuItem icon={<FaFilePdf />} onClick={() => handleExport('pdf')}>
                Export as PDF
              </MenuItem>
              <MenuItem icon={<FaFileExcel />} onClick={() => handleExport('csv')}>
                Export as Excel
              </MenuItem>
            </MenuList>
          </Menu>
          
          {hasPermission('audit_logs', 'clear') && (
            <Button
              leftIcon={<FaTrash />}
              colorScheme="red"
              variant="outline"
              onClick={onClearOpen}
            >
              Clear Old Logs
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Total Logs</StatLabel>
              <StatNumber>{stats.total.toLocaleString()}</StatNumber>
              <StatHelpText>
                All time records
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Today</StatLabel>
              <StatNumber color="blue.500">{stats.today}</StatNumber>
              <StatHelpText>
                Actions today
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>This Week</StatLabel>
              <StatNumber color="green.500">{stats.thisWeek}</StatNumber>
              <StatHelpText>
                Last 7 days
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Live Updates</StatLabel>
              <StatNumber color="teal.500">
                <HStack>
                  <Box w={2} h={2} borderRadius="full" bg="green.500" />
                  <Text>Active</Text>
                </HStack>
              </StatNumber>
              <StatHelpText>
                Real-time monitoring
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Action Distribution */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={6}>
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Action Type Distribution</Heading>
          </CardHeader>
          <CardBody>
            {Object.entries(stats.byActionType).length > 0 ? (
              <VStack align="stretch" spacing={2}>
                {Object.entries(stats.byActionType)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([action, count]) => (
                    <Flex key={action} justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Box w={3} h={3} borderRadius="sm" bg={`${getActionColor(action)}.500`} />
                        <Text fontSize="sm">{action.replace(/_/g, ' ')}</Text>
                      </HStack>
                      <Badge colorScheme="gray">{count}</Badge>
                    </Flex>
                  ))}
              </VStack>
            ) : (
              <Text color="gray.500" textAlign="center">No action data available</Text>
            )}
          </CardBody>
        </Card>
        
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Top Admins by Activity</Heading>
          </CardHeader>
          <CardBody>
            {stats.topAdmins.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {stats.topAdmins.map((admin, index) => (
                  <Flex key={admin.id} justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={`${admin.admin?.first_name} ${admin.admin?.last_name}`}
                        src={admin.admin?.avatar_url}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {admin.admin?.first_name} {admin.admin?.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {admin.admin?.email}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme="blue">{admin.count} actions</Badge>
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500" textAlign="center">No admin activity data</Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Audit Logs Table */}
      <Card bg={cardBg} border="1px" borderColor={borderColor} mb={6}>
        <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
          <Flex justify="space-between" align="center">
            <Heading size="md">Audit Trail</Heading>
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.500">
                {totalRecords.toLocaleString()} records
              </Text>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<RepeatIcon />}
                onClick={fetchAuditLogs}
                isLoading={loading}
              >
                Refresh
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          {/* Quick Filters */}
          <HStack spacing={3} mb={4} wrap="wrap">
            <InputGroup size="sm" maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </InputGroup>
            
            <Select
              size="sm"
              w="150px"
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              placeholder="Action Type"
            >
              {actionTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
            
            <Select
              size="sm"
              w="150px"
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              placeholder="Resource Type"
            >
              {resourceTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          </HStack>
          
          <DataTable
            columns={columns}
            data={auditLogs}
            isLoading={loading}
            pageSize={filters.pageSize}
            currentPage={filters.page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onPageChange={(page) => handleFilterChange('page', page)}
            onPageSizeChange={(size) => handleFilterChange('pageSize', size)}
            onSortChange={(sortBy, sortOrder) => {
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            searchable={false}
          />
        </CardBody>
      </Card>
      
      {/* Log Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Log Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLog && (
              <VStack align="stretch" spacing={4}>
                {/* Basic Info */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Log ID</Text>
                    <Code fontSize="sm" p={2} borderRadius="md" display="block">
                      {selectedLog.id}
                    </Code>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Timestamp</Text>
                    <Text>{formatDate(selectedLog.created_at, 'full')}</Text>
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                {/* Admin Info */}
                <Box>
                  <Text fontWeight="medium" color="gray.500" fontSize="sm" mb={2}>Admin</Text>
                  {selectedLog.admin ? (
                    <HStack spacing={3}>
                      <Avatar
                        size="md"
                        name={`${selectedLog.admin.first_name} ${selectedLog.admin.last_name}`}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">
                          {selectedLog.admin.first_name} {selectedLog.admin.last_name}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {selectedLog.admin.email}
                        </Text>
                        <Badge colorScheme={selectedLog.admin.role === 'SUPER_ADMIN' ? 'red' : 'blue'}>
                          {selectedLog.admin.role}
                        </Badge>
                      </VStack>
                    </HStack>
                  ) : (
                    <Text color="gray.500">System Action</Text>
                  )}
                </Box>
                
                <Divider />
                
                {/* Action Info */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Action Type</Text>
                    <Badge
                      colorScheme={getActionColor(selectedLog.action_type)}
                      fontSize="md"
                      px={3}
                      py={1}
                    >
                      {selectedLog.action_type.replace(/_/g, ' ')}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Resource</Text>
                    <HStack>
                      <Badge colorScheme="gray">
                        {selectedLog.resource_type || '—'}
                      </Badge>
                      {selectedLog.resource_id && (
                        <Text fontSize="sm">
                          ID: {selectedLog.resource_id}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                {/* Technical Info */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">IP Address</Text>
                    <Code fontSize="sm" p={2} borderRadius="md" display="block">
                      {selectedLog.ip_address}
                    </Code>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">User Agent</Text>
                    <Text fontSize="sm" fontFamily="mono">
                      {selectedLog.user_agent || '—'}
                    </Text>
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                {/* Details */}
                <Box>
                  <Text fontWeight="medium" color="gray.500" fontSize="sm" mb={2}>Details</Text>
                  <Card bg={subtleBg} p={4}>
                    <pre style={{ 
                      margin: 0, 
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace'
                    }}>
                      {JSON.stringify(selectedLog.details || {}, null, 2)}
                    </pre>
                  </Card>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDetailsClose}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<CopyIcon />}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                toast({
                  title: 'Copied',
                  description: 'Log details copied to clipboard',
                  status: 'success',
                  duration: 2000,
                });
              }}
            >
              Copy Details
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={onExportClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export Audit Logs</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Export will include {totalRecords.toLocaleString()} records with current filters applied.
                </Text>
              </Alert>
              
              <FormControl>
                <FormLabel>Export Format</FormLabel>
                <Select defaultValue="csv">
                  <option value="csv">CSV (Comma Separated Values)</option>
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Date Range</FormLabel>
                <HStack>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                  <Text>to</Text>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => handleExport('csv')}
              isLoading={exportLoading}
              loadingText="Exporting..."
            >
              Export Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Clear Logs Modal */}
      <ConfirmationModal
        isOpen={isClearOpen}
        onClose={onClearClose}
        onConfirm={() => handleClearOldLogs(90)}
        title="Clear Old Audit Logs"
        message="Are you sure you want to clear audit logs older than 90 days? This action cannot be undone."
        type="warning"
        confirmText="Clear Logs"
        isLoading={clearLoading}
      />
      
      {/* Filter Drawer */}
      <Drawer isOpen={isFilterOpen} placement="right" onClose={onFilterClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filter Audit Logs</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Admin</FormLabel>
                <Select
                  value={filters.admin_id}
                  onChange={(e) => handleFilterChange('admin_id', e.target.value)}
                  placeholder="Select admin"
                >
                  <option value="">All Admins</option>
                  {/* In production, you would fetch admins list */}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Action Type</FormLabel>
                <Select
                  value={filters.action_type}
                  onChange={(e) => handleFilterChange('action_type', e.target.value)}
                  placeholder="Select action type"
                >
                  <option value="">All Actions</option>
                  {actionTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Resource Type</FormLabel>
                <Select
                  value={filters.resource_type}
                  onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                  placeholder="Select resource type"
                >
                  <option value="">All Resources</option>
                  {resourceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Resource ID</FormLabel>
                <Input
                  value={filters.resource_id}
                  onChange={(e) => handleFilterChange('resource_id', e.target.value)}
                  placeholder="Enter resource ID"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Date Range</FormLabel>
                <VStack spacing={2}>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </VStack>
              </FormControl>
              
              <FormControl>
                <FormLabel>Search</FormLabel>
                <Input
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search in logs..."
                />
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button colorScheme="blue" onClick={onFilterClose}>
              Apply Filters
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default AuditLogs;