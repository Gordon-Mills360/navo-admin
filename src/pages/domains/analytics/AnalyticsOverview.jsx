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
  InputRightAddon,
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RepeatIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ViewIcon,
  EditIcon,
  SettingsIcon,
  TimeIcon,
  StarIcon,
} from '@chakra-ui/icons';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaUsers, 
  FaCar, 
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaClock,
  FaPercentage
} from 'react-icons/fa';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import DataTable from '../../../components/shared/DataTable';

const AnalyticsOverview = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({});
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, 1y, custom
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  });
  const [compareMode, setCompareMode] = useState(false);
  const [compareRange, setCompareRange] = useState('previous_period');
  const [activeMetric, setActiveMetric] = useState('revenue');

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch(dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            startDate = new Date(customDateRange.start);
            endDate = new Date(customDateRange.end);
          }
          break;
      }
      
      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch analytics data (in real implementation, this would be API calls)
      // For now, we'll generate mock data
      const mockData = generateMockAnalyticsData(startDateStr, endDateStr);
      setAnalyticsData(mockData);
      
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, customDateRange, toast]);

  // Generate mock analytics data
  const generateMockAnalyticsData = (startDate, endDate) => {
    // Generate daily data for the period
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    const dailyData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 10000) + 5000,
        trips: Math.floor(Math.random() * 500) + 200,
        drivers: Math.floor(Math.random() * 100) + 50,
        passengers: Math.floor(Math.random() * 300) + 100,
        avg_fare: Math.floor(Math.random() * 30) + 15,
        commission: Math.floor(Math.random() * 2000) + 1000,
        cancellation_rate: Math.random() * 10 + 5,
        rating: Math.random() * 1 + 4.0,
      });
    }
    
    // Generate top drivers
    const topDrivers = [
      { id: 1, name: 'John Smith', trips: 245, earnings: 12560, rating: 4.9 },
      { id: 2, name: 'Maria Garcia', trips: 218, earnings: 11230, rating: 4.8 },
      { id: 3, name: 'David Chen', trips: 198, earnings: 9870, rating: 4.7 },
      { id: 4, name: 'Sarah Johnson', trips: 185, earnings: 9450, rating: 4.9 },
      { id: 5, name: 'Michael Brown', trips: 172, earnings: 8760, rating: 4.6 },
    ];
    
    // Generate popular locations
    const popularLocations = [
      { location: 'Downtown Central', trips: 560, avg_fare: 25.50 },
      { location: 'Airport Terminal', trips: 480, avg_fare: 35.75 },
      { location: 'University Campus', trips: 420, avg_fare: 18.25 },
      { location: 'Shopping Mall', trips: 380, avg_fare: 22.00 },
      { location: 'Business District', trips: 320, avg_fare: 28.50 },
    ];
    
    // Generate vehicle type distribution
    const vehicleDistribution = [
      { name: 'Standard', value: 65, color: '#3182CE' },
      { name: 'Premium', value: 20, color: '#805AD5' },
      { name: 'SUV', value: 10, color: '#DD6B20' },
      { name: 'Electric', value: 5, color: '#38A169' },
    ];
    
    // Calculate summary metrics
    const summary = {
      total_revenue: dailyData.reduce((sum, day) => sum + day.revenue, 0),
      total_trips: dailyData.reduce((sum, day) => sum + day.trips, 0),
      avg_daily_trips: Math.round(dailyData.reduce((sum, day) => sum + day.trips, 0) / days),
      avg_fare: Math.round(dailyData.reduce((sum, day) => sum + day.avg_fare, 0) / days * 10) / 10,
      total_commission: dailyData.reduce((sum, day) => sum + day.commission, 0),
      avg_rating: Math.round(dailyData.reduce((sum, day) => sum + day.rating, 0) / days * 10) / 10,
      cancellation_rate: Math.round(dailyData.reduce((sum, day) => sum + day.cancellation_rate, 0) / days * 10) / 10,
      growth_rate: 12.5, // Mock growth rate
    };
    
    return {
      dailyData,
      topDrivers,
      popularLocations,
      vehicleDistribution,
      summary,
      dateRange: { start: startDate, end: endDate },
    };
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle export data
  const handleExportData = (format) => {
    toast({
      title: `Exporting ${format.toUpperCase()}`,
      description: `Analytics data will be exported in ${format} format`,
      status: 'info',
      duration: 3000,
    });
  };

  // Calculate metric change
  const calculateMetricChange = (current, previous) => {
    if (!previous || previous === 0) return { change: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      change: Math.abs(Math.round(change * 10) / 10),
      direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
    };
  };

  // Get metric icon
  const getMetricIcon = (metric) => {
    switch(metric) {
      case 'revenue':
        return <FaMoneyBillWave />;
      case 'trips':
        return <FaCar />;
      case 'drivers':
        return <FaUsers />;
      case 'passengers':
        return <FaUsers />;
      case 'commission':
        return <FaPercentage />;
      default:
        return <FaChartLine />;
    }
  };

  // Render summary cards
  const renderSummaryCards = () => {
    const { summary } = analyticsData;
    if (!summary) return null;
    
    const cards = [
      {
        title: 'Total Revenue',
        value: `$${summary.total_revenue.toLocaleString()}`,
        change: calculateMetricChange(summary.total_revenue, summary.total_revenue * 0.88),
        icon: <FaMoneyBillWave />,
        color: 'green.500',
        metric: 'revenue',
      },
      {
        title: 'Total Trips',
        value: summary.total_trips.toLocaleString(),
        change: calculateMetricChange(summary.total_trips, summary.total_trips * 0.92),
        icon: <FaCar />,
        color: 'blue.500',
        metric: 'trips',
      },
      {
        title: 'Avg Daily Trips',
        value: summary.avg_daily_trips.toLocaleString(),
        change: calculateMetricChange(summary.avg_daily_trips, summary.avg_daily_trips * 0.95),
        icon: <FaChartBar />,
        color: 'purple.500',
        metric: 'daily_trips',
      },
      {
        title: 'Avg Fare',
        value: `$${summary.avg_fare}`,
        change: calculateMetricChange(summary.avg_fare, summary.avg_fare * 1.05),
        icon: <FaMoneyBillWave />,
        color: 'orange.500',
        metric: 'avg_fare',
      },
      {
        title: 'Commission',
        value: `$${summary.total_commission.toLocaleString()}`,
        change: calculateMetricChange(summary.total_commission, summary.total_commission * 0.9),
        icon: <FaPercentage />,
        color: 'teal.500',
        metric: 'commission',
      },
      {
        title: 'Avg Rating',
        value: summary.avg_rating.toFixed(1),
        change: calculateMetricChange(summary.avg_rating, summary.avg_rating * 0.99),
        icon: <StarIcon />,
        color: 'yellow.500',
        metric: 'rating',
      },
    ];
    
    return (
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={6}>
        {cards.map((card, idx) => (
          <Card 
            key={idx} 
            cursor="pointer"
            onClick={() => setActiveMetric(card.metric)}
            borderColor={activeMetric === card.metric ? card.color : 'transparent'}
            borderWidth={activeMetric === card.metric ? '2px' : '0'}
            transition="all 0.2s"
          >
            <CardBody>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">{card.title}</Text>
                  <Box color={card.color}>{card.icon}</Box>
                </HStack>
                <Text fontSize="xl" fontWeight="bold">{card.value}</Text>
                <HStack>
                  <StatArrow 
                    type={card.change.direction === 'increase' ? 'increase' : 'decrease'} 
                    color={card.change.direction === 'increase' ? 'green.500' : 'red.500'}
                  />
                  <Text 
                    fontSize="sm" 
                    color={card.change.direction === 'increase' ? 'green.500' : card.change.direction === 'decrease' ? 'red.500' : 'gray.500'}
                  >
                    {card.change.direction !== 'neutral' ? `${card.change.change}%` : 'No change'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">vs last period</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  // Render main chart
  const renderMainChart = () => {
    const { dailyData } = analyticsData;
    if (!dailyData) return null;
    
    // Prepare data for the chart based on active metric
    const chartData = dailyData.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: day[activeMetric] || day.revenue,
      ...day,
    }));
    
    const chartConfig = {
      revenue: { name: 'Revenue', color: '#38A169', unit: '$' },
      trips: { name: 'Trips', color: '#3182CE', unit: '' },
      drivers: { name: 'Active Drivers', color: '#805AD5', unit: '' },
      passengers: { name: 'Active Passengers', color: '#DD6B20', unit: '' },
      avg_fare: { name: 'Average Fare', color: '#D69E2E', unit: '$' },
      commission: { name: 'Commission', color: '#00B5D8', unit: '$' },
    };
    
    const config = chartConfig[activeMetric] || chartConfig.revenue;
    
    return (
      <Card mb={6}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="md">{config.name} Trend</Heading>
              <Text color="gray.600" fontSize="sm">
                {analyticsData.dateRange?.start} to {analyticsData.dateRange?.end}
              </Text>
            </Box>
            <HStack spacing={2}>
              <Select size="sm" value={activeMetric} onChange={(e) => setActiveMetric(e.target.value)}>
                <option value="revenue">Revenue</option>
                <option value="trips">Trips</option>
                <option value="drivers">Active Drivers</option>
                <option value="passengers">Active Passengers</option>
                <option value="avg_fare">Average Fare</option>
                <option value="commission">Commission</option>
              </Select>
              <Button size="sm" leftIcon={<DownloadIcon />} onClick={() => handleExportData('csv')}>
                Export
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          <Box height="400px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#718096"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#718096"
                  fontSize={12}
                  tickFormatter={(value) => config.unit ? `${config.unit}${value.toLocaleString()}` : value.toLocaleString()}
                />
                <RechartsTooltip 
                  formatter={(value) => [config.unit ? `${config.unit}${value.toLocaleString()}` : value.toLocaleString(), config.name]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={config.color} 
                  fill={config.color}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{ stroke: config.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    );
  };

  // Render comparison charts
  const renderComparisonCharts = () => (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
      {/* Vehicle Type Distribution */}
      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Vehicle Type Distribution</Heading>
        </CardHeader>
        <CardBody>
          <Box height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.vehicleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.vehicleDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, 'Share']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>

      {/* Popular Locations */}
      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Popular Locations</Heading>
        </CardHeader>
        <CardBody>
          <Box height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.popularLocations} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="location" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  stroke="#718096"
                  fontSize={12}
                />
                <YAxis stroke="#718096" fontSize={12} />
                <RechartsTooltip formatter={(value) => [value, 'Trips']} />
                <Bar 
                  dataKey="trips" 
                  fill="#3182CE" 
                  radius={[4, 4, 0, 0]}
                  name="Number of Trips"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  // Render top performers
  const renderTopPerformers = () => (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
      {/* Top Drivers */}
      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Top Performing Drivers</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Driver</Th>
                <Th isNumeric>Trips</Th>
                <Th isNumeric>Earnings</Th>
                <Th isNumeric>Rating</Th>
              </Tr>
            </Thead>
            <Tbody>
              {analyticsData.topDrivers?.map((driver, idx) => (
                <Tr key={driver.id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <HStack>
                      <Badge colorScheme="blue">{idx + 1}</Badge>
                      <Text>{driver.name}</Text>
                    </HStack>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="medium">{driver.trips}</Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="medium" color="green.600">${driver.earnings.toLocaleString()}</Text>
                  </Td>
                  <Td isNumeric>
                    <HStack justify="flex-end">
                      <StarIcon color="yellow.500" />
                      <Text>{driver.rating.toFixed(1)}</Text>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Key Performance Indicators</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Growth Rate</Text>
              <Progress value={analyticsData.summary?.growth_rate || 0} colorScheme="green" size="lg" />
              <Text fontSize="sm" textAlign="right" mt={1}>
                {analyticsData.summary?.growth_rate || 0}%
              </Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Cancellation Rate</Text>
              <Progress 
                value={analyticsData.summary?.cancellation_rate || 0} 
                colorScheme={analyticsData.summary?.cancellation_rate > 10 ? 'red' : 'orange'}
                size="lg"
              />
              <Text fontSize="sm" textAlign="right" mt={1}>
                {analyticsData.summary?.cancellation_rate || 0}%
              </Text>
            </Box>
            
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.600">Peak Hours</Text>
                <Text fontSize="lg" fontWeight="bold">5-7 PM</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Avg Trip Duration</Text>
                <Text fontSize="lg" fontWeight="bold">24 min</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Response Time</Text>
                <Text fontSize="lg" fontWeight="bold">3.2 min</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Acceptance Rate</Text>
                <Text fontSize="lg" fontWeight="bold">92%</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  // Render date range selector
  const renderDateRangeSelector = () => (
    <Card mb={6}>
      <CardBody>
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <HStack>
              <Button
                size="sm"
                variant={dateRange === '7d' ? 'solid' : 'outline'}
                colorScheme={dateRange === '7d' ? 'blue' : 'gray'}
                onClick={() => handleDateRangeChange('7d')}
              >
                7D
              </Button>
              <Button
                size="sm"
                variant={dateRange === '30d' ? 'solid' : 'outline'}
                colorScheme={dateRange === '30d' ? 'blue' : 'gray'}
                onClick={() => handleDateRangeChange('30d')}
              >
                30D
              </Button>
              <Button
                size="sm"
                variant={dateRange === '90d' ? 'solid' : 'outline'}
                colorScheme={dateRange === '90d' ? 'blue' : 'gray'}
                onClick={() => handleDateRangeChange('90d')}
              >
                90D
              </Button>
              <Button
                size="sm"
                variant={dateRange === '1y' ? 'solid' : 'outline'}
                colorScheme={dateRange === '1y' ? 'blue' : 'gray'}
                onClick={() => handleDateRangeChange('1y')}
              >
                1Y
              </Button>
            </HStack>
            
            {dateRange === 'custom' && (
              <HStack>
                <Input
                  type="date"
                  size="sm"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                  width="150px"
                />
                <Text>to</Text>
                <Input
                  type="date"
                  size="sm"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                  width="150px"
                />
              </HStack>
            )}
            
            <Button
              size="sm"
              variant={dateRange === 'custom' ? 'solid' : 'outline'}
              colorScheme={dateRange === 'custom' ? 'blue' : 'gray'}
              onClick={() => handleDateRangeChange('custom')}
              leftIcon={<CalendarIcon />}
            >
              Custom
            </Button>
          </HStack>
          
          <HStack spacing={3}>
            <FormControl display="flex" alignItems="center">
              <Switch
                isChecked={compareMode}
                onChange={() => setCompareMode(!compareMode)}
                mr={2}
                size="sm"
              />
              <FormLabel mb={0} fontSize="sm">Compare</FormLabel>
            </FormControl>
            
            {compareMode && (
              <Select size="sm" width="200px" value={compareRange} onChange={(e) => setCompareRange(e.target.value)}>
                <option value="previous_period">Previous Period</option>
                <option value="same_period_last_year">Same Period Last Year</option>
                <option value="last_week">Last Week</option>
                <option value="last_month">Last Month</option>
              </Select>
            )}
            
            <Button
              leftIcon={<RepeatIcon />}
              onClick={fetchAnalyticsData}
              isLoading={loading}
              size="sm"
            >
              Refresh
            </Button>
          </HStack>
        </Flex>
      </CardBody>
    </Card>
  );

  if (loading && !analyticsData.dailyData) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading analytics data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load analytics</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchAnalyticsData} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Analytics Dashboard</Heading>
          <Text color="gray.600" mt={1}>
            Comprehensive view of platform performance and metrics
          </Text>
        </Box>
        <Button
          leftIcon={<DownloadIcon />}
          colorScheme="blue"
          onClick={() => handleExportData('pdf')}
        >
          Export Report
        </Button>
      </Flex>

      {renderDateRangeSelector()}
      {renderSummaryCards()}
      {renderMainChart()}
      {renderComparisonCharts()}
      {renderTopPerformers()}

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <Heading size="md">Insights & Recommendations</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            <Card borderLeft="4px solid" borderLeftColor="green.500">
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Strong Performance</Text>
                  <Text fontSize="sm">
                    Weekend trips have increased by 25% compared to last month. Consider adding more drivers during weekends.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card borderLeft="4px solid" borderLeftColor="yellow.500">
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Attention Needed</Text>
                  <Text fontSize="sm">
                    Cancellation rate is 8.5%, above the target of 5%. Review cancellation policies and driver incentives.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card borderLeft="4px solid" borderLeftColor="blue.500">
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Growth Opportunity</Text>
                  <Text fontSize="sm">
                    Airport trips show high average fare ($35.75). Consider promoting airport services to premium users.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AnalyticsOverview;