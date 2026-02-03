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
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Stack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RepeatIcon,
  CalendarIcon,
  ChevronDownIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  CopyIcon,
  TimeIcon,
  StarIcon,
  AddIcon,
  PlayIcon,
  AttachmentIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { 
  FaFileExcel, 
  FaFilePdf, 
  FaFileCsv, 
  FaChartBar, 
  FaCalendarAlt,
  FaClock,
  FaUserCog
} from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import DataTable from '../../../components/shared/DataTable';

const Reports = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onClose: onCreateClose 
  } = useDisclosure();
  const { 
    isOpen: isScheduleOpen, 
    onOpen: onScheduleOpen, 
    onClose: onScheduleClose 
  } = useDisclosure();
  const { 
    isOpen: isPreviewOpen, 
    onOpen: onPreviewOpen, 
    onClose: onPreviewClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    report_type: 'financial',
    format: 'pdf',
    schedule: 'manual',
    filters: {},
    recipients: [],
  });
  const [previewData, setPreviewData] = useState(null);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In real implementation, fetch from API
      // For now, generate mock data
      const mockReports = generateMockReports();
      setReports(mockReports);
      
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Generate mock reports
  const generateMockReports = () => {
    const reportTypes = ['financial', 'operational', 'driver', 'passenger', 'safety', 'marketing'];
    const formats = ['pdf', 'excel', 'csv', 'html'];
    const statuses = ['completed', 'processing', 'scheduled', 'failed'];
    const schedules = ['daily', 'weekly', 'monthly', 'quarterly', 'manual'];
    
    const mockReports = [];
    
    for (let i = 1; i <= 20; i++) {
      const type = reportTypes[Math.floor(Math.random() * reportTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const schedule = schedules[Math.floor(Math.random() * schedules.length)];
      const format = formats[Math.floor(Math.random() * formats.length)];
      
      const report = {
        id: i,
        report_code: `REP-${String(i).padStart(5, '0')}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report ${i}`,
        description: `Automated ${type} report for analysis`,
        report_type: type,
        format: format,
        status: status,
        schedule: schedule,
        created_by: user.email,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_run: status === 'completed' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
        next_run: schedule !== 'manual' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        file_size: Math.floor(Math.random() * 5000) + 100,
        record_count: Math.floor(Math.random() * 10000) + 1000,
        download_url: status === 'completed' ? `/reports/${i}.${format}` : null,
        recipients: [`admin@example.com`, `finance${i}@example.com`],
      };
      
      mockReports.push(report);
    }
    
    return mockReports;
  };

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle generate report
  const handleGenerateReport = (report) => {
    setSelectedReport(report);
    setActionLoading(true);
    
    // Simulate report generation
    setTimeout(() => {
      toast({
        title: 'Report generated',
        description: `${report.name} has been generated successfully`,
        status: 'success',
        duration: 3000,
      });
      fetchReports();
      setActionLoading(false);
    }, 2000);
  };

  // Handle download report
  const handleDownloadReport = (report) => {
    if (!report.download_url) {
      toast({
        title: 'Report not available',
        description: 'This report has not been generated yet',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    toast({
      title: 'Download started',
      description: `${report.name} is being downloaded`,
      status: 'info',
      duration: 3000,
    });
    
    // In real implementation, trigger file download
    window.open(report.download_url, '_blank');
  };

  // Handle schedule report
  const handleScheduleReport = (report) => {
    setSelectedReport(report);
    onScheduleOpen();
  };

  // Handle preview report
  const handlePreviewReport = (report) => {
    setSelectedReport(report);
    
    // Generate preview data
    const preview = generatePreviewData(report);
    setPreviewData(preview);
    onPreviewOpen();
  };

  // Generate preview data
  const generatePreviewData = (report) => {
    const data = [];
    for (let i = 1; i <= 10; i++) {
      data.push({
        id: i,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        revenue: Math.floor(Math.random() * 10000) + 5000,
        trips: Math.floor(Math.random() * 500) + 200,
        drivers: Math.floor(Math.random() * 100) + 50,
        passengers: Math.floor(Math.random() * 300) + 100,
        avg_fare: Math.floor(Math.random() * 30) + 15,
      });
    }
    return data;
  };

  // Handle delete report
  const handleDeleteReport = (report) => {
    setSelectedReport(report);
    setModalConfig({
      title: 'Delete Report',
      message: `Are you sure you want to delete "${report.name}"? This action cannot be undone.`,
      action: 'delete',
      type: 'warning',
    });
    onOpen();
  };

  // Handle duplicate report
  const handleDuplicateReport = (report) => {
    setSelectedReport(report);
    setModalConfig({
      title: 'Duplicate Report',
      message: `Are you sure you want to duplicate "${report.name}"? A new report configuration will be created.`,
      action: 'duplicate',
      type: 'confirm',
    });
    onOpen();
  };

  // Handle create new report
  const handleCreateNew = () => {
    setCreateForm({
      name: '',
      description: '',
      report_type: 'financial',
      format: 'pdf',
      schedule: 'manual',
      filters: {},
      recipients: [user.email],
    });
    onCreateOpen();
  };

  // Handle create form submit
  const handleCreateSubmit = () => {
    toast({
      title: 'Report created',
      description: 'New report configuration has been created',
      status: 'success',
      duration: 3000,
    });
    onCreateClose();
    fetchReports();
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filtered reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.report_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.report_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'scheduled': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  // Get format icon
  const getFormatIcon = (format) => {
    switch(format) {
      case 'pdf': return <FaFilePdf />;
      case 'excel': return <FaFileExcel />;
      case 'csv': return <FaFileCsv />;
      default: return <AttachmentIcon />;
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch(type) {
      case 'financial': return <FaChartBar />;
      case 'operational': return <FaClock />;
      case 'driver': return <FaUserCog />;
      case 'passenger': return <FaUserCog />;
      case 'safety': return <FaChartBar />;
      case 'marketing': return <FaChartBar />;
      default: return <FaChartBar />;
    }
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Report',
      accessor: 'name',
      cell: (row) => (
        <Box>
          <Text fontWeight="medium">{row.name}</Text>
          <Text fontSize="sm" color="gray.500">
            {row.report_code} • {row.description}
          </Text>
        </Box>
      ),
    },
    {
      header: 'Type',
      accessor: 'report_type',
      cell: (row) => (
        <HStack>
          <Box color="blue.500">{getTypeIcon(row.report_type)}</Box>
          <Text textTransform="capitalize">{row.report_type}</Text>
        </HStack>
      ),
    },
    {
      header: 'Format',
      accessor: 'format',
      cell: (row) => (
        <HStack>
          <Box color="purple.500">{getFormatIcon(row.format)}</Box>
          <Text textTransform="uppercase">{row.format}</Text>
        </HStack>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge colorScheme={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Schedule',
      accessor: 'schedule',
      cell: (row) => (
        <Text textTransform="capitalize">{row.schedule}</Text>
      ),
    },
    {
      header: 'Last Run',
      accessor: 'last_run',
      cell: (row) => (
        row.last_run ? (
          <Text fontSize="sm">
            {new Date(row.last_run).toLocaleDateString()}
          </Text>
        ) : (
          <Text fontSize="sm" color="gray.500">Never</Text>
        )
      ),
    },
    {
      header: 'File Size',
      accessor: 'file_size',
      cell: (row) => (
        <Text fontSize="sm">
          {(row.file_size / 1024).toFixed(1)} MB
        </Text>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <HStack spacing={1}>
          <Tooltip label="Preview">
            <IconButton
              icon={<ViewIcon />}
              size="sm"
              variant="ghost"
              onClick={() => handlePreviewReport(row)}
            />
          </Tooltip>
          {row.status === 'completed' && (
            <Tooltip label="Download">
              <IconButton
                icon={<DownloadIcon />}
                size="sm"
                colorScheme="green"
                variant="ghost"
                onClick={() => handleDownloadReport(row)}
              />
            </Tooltip>
          )}
          {row.status !== 'processing' && (
            <Tooltip label="Generate">
              <IconButton
                icon={<PlayIcon />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={() => handleGenerateReport(row)}
                isLoading={actionLoading && selectedReport?.id === row.id}
              />
            </Tooltip>
          )}
          <Tooltip label="Schedule">
            <IconButton
              icon={<CalendarIcon />}
              size="sm"
              variant="ghost"
              onClick={() => handleScheduleReport(row)}
            />
          </Tooltip>
          <Tooltip label="Duplicate">
            <IconButton
              icon={<CopyIcon />}
              size="sm"
              variant="ghost"
              onClick={() => handleDuplicateReport(row)}
            />
          </Tooltip>
          <Tooltip label="Delete">
            <IconButton
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              variant="ghost"
              onClick={() => handleDeleteReport(row)}
            />
          </Tooltip>
        </HStack>
      ),
    },
  ];

  // Report statistics
  const calculateStats = () => {
    return {
      total: reports.length,
      completed: reports.filter(r => r.status === 'completed').length,
      scheduled: reports.filter(r => r.schedule !== 'manual').length,
      failed: reports.filter(r => r.status === 'failed').length,
      total_size: reports.reduce((sum, r) => sum + r.file_size, 0) / 1024, // MB
    };
  };

  const stats = calculateStats();

  if (loading && reports.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading reports...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load reports</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchReports} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Report Management</Heading>
          <Text color="gray.600" mt={1}>
            Create, schedule, and manage analytical reports
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchReports}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          {hasPermission('reports', 'create') && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={handleCreateNew}
            >
              New Report
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Report Statistics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Reports</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
              <StatHelpText>
                {stats.completed} completed
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Scheduled Reports</StatLabel>
              <StatNumber color="blue.600">{stats.scheduled}</StatNumber>
              <StatHelpText>
                Automated generation
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Failed Reports</StatLabel>
              <StatNumber color="red.600">{stats.failed}</StatNumber>
              <StatHelpText>
                Needs attention
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Data</StatLabel>
              <StatNumber>{stats.total_size.toFixed(1)} MB</StatNumber>
              <StatHelpText>
                Across all reports
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Search Reports</FormLabel>
              <InputGroup size="sm">
                <InputLeftAddon>
                  <SearchIcon />
                </InputLeftAddon>
                <Input
                  placeholder="Search by name, code, or description"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Report Type</FormLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Types</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="driver">Driver</option>
                <option value="passenger">Passenger</option>
                <option value="safety">Safety</option>
                <option value="marketing">Marketing</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Status</FormLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="scheduled">Scheduled</option>
                <option value="failed">Failed</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Format</FormLabel>
              <Select
                size="sm"
                onChange={(e) => {
                  // Implement format filter
                }}
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="html">HTML</option>
              </Select>
            </FormControl>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>All Reports ({reports.length})</Tab>
          <Tab>Scheduled ({stats.scheduled})</Tab>
          <Tab>Completed ({stats.completed})</Tab>
          <Tab>Failed ({stats.failed})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredReports}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredReports.filter(r => r.schedule !== 'manual')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredReports.filter(r => r.status === 'completed')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredReports.filter(r => r.status === 'failed')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Create Report Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Report</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Report Name</FormLabel>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Enter report name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Enter report description"
                  rows={2}
                />
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Report Type</FormLabel>
                  <Select
                    value={createForm.report_type}
                    onChange={(e) => setCreateForm({...createForm, report_type: e.target.value})}
                  >
                    <option value="financial">Financial Report</option>
                    <option value="operational">Operational Report</option>
                    <option value="driver">Driver Performance</option>
                    <option value="passenger">Passenger Analysis</option>
                    <option value="safety">Safety Report</option>
                    <option value="marketing">Marketing Report</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Output Format</FormLabel>
                  <Select
                    value={createForm.format}
                    onChange={(e) => setCreateForm({...createForm, format: e.target.value})}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                    <option value="html">HTML Report</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Schedule</FormLabel>
                <Select
                  value={createForm.schedule}
                  onChange={(e) => setCreateForm({...createForm, schedule: e.target.value})}
                >
                  <option value="manual">Manual Only</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Recipients (Email)</FormLabel>
                <Input
                  value={createForm.recipients.join(', ')}
                  onChange={(e) => setCreateForm({
                    ...createForm, 
                    recipients: e.target.value.split(',').map(email => email.trim())
                  })}
                  placeholder="Enter email addresses separated by commas"
                />
              </FormControl>
              
              {/* Report Parameters */}
              <Card width="100%" variant="outline">
                <CardHeader pb={2}>
                  <Heading size="sm">Report Parameters</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Date Range</FormLabel>
                      <Select size="sm">
                        <option value="last_7_days">Last 7 Days</option>
                        <option value="last_30_days">Last 30 Days</option>
                        <option value="last_quarter">Last Quarter</option>
                        <option value="last_year">Last Year</option>
                        <option value="custom">Custom Range</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Include Charts</FormLabel>
                      <Switch size="sm" defaultChecked />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Data Granularity</FormLabel>
                      <Select size="sm">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Compress Files</FormLabel>
                      <Switch size="sm" defaultChecked />
                    </FormControl>
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
              onClick={handleCreateSubmit}
            >
              Create Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Schedule Report Modal */}
      {selectedReport && (
        <Modal isOpen={isScheduleOpen} onClose={onScheduleClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Schedule Report</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Card variant="outline" width="100%">
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <Text fontWeight="medium">{selectedReport.name}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {selectedReport.report_code} • {selectedReport.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                <FormControl>
                  <FormLabel>Schedule Frequency</FormLabel>
                  <Select defaultValue={selectedReport.schedule}>
                    <option value="manual">Manual Only</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </Select>
                </FormControl>
                
                {selectedReport.schedule !== 'manual' && (
                  <>
                    <FormControl>
                      <FormLabel>Schedule Time</FormLabel>
                      <Input type="time" defaultValue="09:00" />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Start Date</FormLabel>
                      <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Input type="date" />
                    </FormControl>
                  </>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onScheduleClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={() => {
                toast({
                  title: 'Report scheduled',
                  description: `${selectedReport.name} has been scheduled`,
                  status: 'success',
                  duration: 3000,
                });
                onScheduleClose();
              }}>
                Save Schedule
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Report Preview Modal */}
      {selectedReport && previewData && (
        <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="full">
          <ModalOverlay />
          <ModalContent maxW="90vw" maxH="90vh">
            <ModalHeader>
              <HStack>
                <ViewIcon />
                <Text>Preview: {selectedReport.name}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody overflow="auto">
              <VStack align="stretch" spacing={4}>
                {/* Report Header */}
                <Card>
                  <CardBody>
                    <VStack align="center" spacing={2}>
                      <Heading size="lg">{selectedReport.name}</Heading>
                      <Text color="gray.600">{selectedReport.description}</Text>
                      <Text fontSize="sm" color="gray.500">
                        Generated on {new Date().toLocaleDateString()} • Report Code: {selectedReport.report_code}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                {/* Summary Stats */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Card>
                    <CardBody>
                      <VStack>
                        <Text fontSize="sm" color="gray.600">Total Revenue</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          $45,230
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <VStack>
                        <Text fontSize="sm" color="gray.600">Total Trips</Text>
                        <Text fontSize="2xl" fontWeight="bold">2,450</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <VStack>
                        <Text fontSize="sm" color="gray.600">Active Drivers</Text>
                        <Text fontSize="2xl" fontWeight="bold">125</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <VStack>
                        <Text fontSize="sm" color="gray.600">Avg. Rating</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
                          4.7
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
                
                {/* Data Table */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Report Data</Heading>
                  </CardHeader>
                  <CardBody>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th isNumeric>Revenue</Th>
                          <Th isNumeric>Trips</Th>
                          <Th isNumeric>Drivers</Th>
                          <Th isNumeric>Passengers</Th>
                          <Th isNumeric>Avg. Fare</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {previewData.map(row => (
                          <Tr key={row.id}>
                            <Td>{row.date}</Td>
                            <Td isNumeric>
                              <Text color="green.600">${row.revenue.toLocaleString()}</Text>
                            </Td>
                            <Td isNumeric>{row.trips.toLocaleString()}</Td>
                            <Td isNumeric>{row.drivers.toLocaleString()}</Td>
                            <Td isNumeric>{row.passengers.toLocaleString()}</Td>
                            <Td isNumeric>${row.avg_fare}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
                
                {/* Notes */}
                <Card>
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <Text fontWeight="bold">Report Notes</Text>
                      <Text fontSize="sm">
                        This is a preview of how the report will look when generated. Actual report data may vary based on generation time and parameters.
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Format: {selectedReport.format.toUpperCase()} • Estimated size: {(selectedReport.file_size / 1024).toFixed(1)} MB
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onPreviewClose}>
                Close Preview
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => handleGenerateReport(selectedReport)}
                isLoading={actionLoading}
              >
                Generate Report
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => {
          if (modalConfig.action === 'delete') {
            toast({
              title: 'Report deleted',
              description: `${selectedReport?.name} has been deleted`,
              status: 'success',
              duration: 3000,
            });
            fetchReports();
          } else if (modalConfig.action === 'duplicate') {
            toast({
              title: 'Report duplicated',
              description: `${selectedReport?.name} has been duplicated`,
              status: 'success',
              duration: 3000,
            });
            fetchReports();
          }
          onClose();
          setSelectedReport(null);
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={actionLoading}
      />
    </Box>
  );
};

export default Reports;