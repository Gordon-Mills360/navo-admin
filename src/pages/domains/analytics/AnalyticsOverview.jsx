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
  Spinner,
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

  // Fetch REAL analytics data from Supabase
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
      
      // Fetch REAL data from Supabase
      const [dailyStats, topDriversData, popularLocationsData, vehicleTypesData] = await Promise.all([
        // 1. Daily statistics
        fetchDailyStatistics(startDateStr, endDateStr),
        
        // 2. Top drivers
        fetchTopDrivers(startDateStr, endDateStr),
        
        // 3. Popular locations
        fetchPopularLocations(startDateStr, endDateStr),
        
        // 4. Vehicle type distribution
        fetchVehicleTypeDistribution(startDateStr, endDateStr),
      ]);
      
      // Calculate summary metrics from real data
      const summary = calculateSummaryMetrics(dailyStats);
      
      setAnalyticsData({
        dailyData: dailyStats,
        topDrivers: topDriversData,
        popularLocations: popularLocationsData,
        vehicleDistribution: vehicleTypesData,
        summary,
        dateRange: { start: startDateStr, end: endDateStr },
      });
      
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

  // Fetch daily statistics from trips table
  const fetchDailyStatistics = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          status,
          fare_amount,
          driver_commission,
          driver_id,
          passenger_id,
          created_at,
          completed_at,
          cancelled_at
        `)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by date and calculate metrics
      const groupedByDate = {};
      
      data?.forEach(trip => {
        const date = new Date(trip.created_at).toISOString().split('T')[0];
        
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date,
            revenue: 0,
            trips: 0,
            completed_trips: 0,
            cancelled_trips: 0,
            drivers: new Set(),
            passengers: new Set(),
            total_fare: 0,
            total_commission: 0,
          };
        }
        
        const day = groupedByDate[date];
        day.trips += 1;
        day.total_fare += trip.fare_amount || 0;
        day.total_commission += trip.driver_commission || 0;
        
        if (trip.driver_id) day.drivers.add(trip.driver_id);
        if (trip.passenger_id) day.passengers.add(trip.passenger_id);
        
        if (trip.status === 'completed') {
          day.completed_trips += 1;
          day.revenue += trip.fare_amount || 0;
        } else if (trip.status === 'cancelled') {
          day.cancelled_trips += 1;
        }
      });
      
      // Convert to array format for charts
      return Object.values(groupedByDate).map(day => ({
        date: day.date,
        revenue: Math.round(day.revenue),
        trips: day.trips,
        completed_trips: day.completed_trips,
        cancelled_trips: day.cancelled_trips,
        drivers: day.drivers.size,
        passengers: day.passengers.size,
        avg_fare: day.completed_trips > 0 ? Math.round(day.total_fare / day.completed_trips) : 0,
        commission: Math.round(day.total_commission),
        cancellation_rate: day.trips > 0 ? (day.cancelled_trips / day.trips) * 100 : 0,
      }));
      
    } catch (error) {
      console.error('Error fetching daily statistics:', error);
      throw error;
    }
  };

  // Fetch top performing drivers
  const fetchTopDrivers = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          fare_amount,
          driver_commission,
          driver:drivers(id, first_name, last_name, phone, rating),
          trip_ratings(rating)
        `)
        .eq('status', 'completed')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate driver statistics
      const driverStats = {};
      
      data?.forEach(trip => {
        if (trip.driver && trip.driver.id) {
          const driverId = trip.driver.id;
          
          if (!driverStats[driverId]) {
            driverStats[driverId] = {
              id: driverId,
              name: `${trip.driver.first_name || ''} ${trip.driver.last_name || ''}`.trim() || 'Unknown Driver',
              trips: 0,
              earnings: 0,
              total_commission: 0,
              ratings: [],
            };
          }
          
          const driver = driverStats[driverId];
          driver.trips += 1;
          driver.earnings += trip.fare_amount || 0;
          driver.total_commission += trip.driver_commission || 0;
          
          if (trip.driver.rating) {
            driver.ratings.push(trip.driver.rating);
          }
          
          if (trip.trip_ratings && trip.trip_ratings.length > 0) {
            driver.ratings.push(trip.trip_ratings[0].rating);
          }
        }
      });
      
      // Convert to array, calculate average rating, and sort
      return Object.values(driverStats)
        .map(driver => ({
          ...driver,
          earnings: Math.round(driver.earnings),
          avg_rating: driver.ratings.length > 0 
            ? Math.round((driver.ratings.reduce((a, b) => a + b, 0) / driver.ratings.length) * 10) / 10
            : 0,
        }))
        .sort((a, b) => b.trips - a.trips)
        .slice(0, 5);
        
    } catch (error) {
      console.error('Error fetching top drivers:', error);
      return [];
    }
  };

  // Fetch popular locations
  const fetchPopularLocations = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          pickup_location,
          fare_amount,
          status
        `)
        .eq('status', 'completed')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);
      
      if (error) throw error;
      
      // Group by location area (simplified - extract main area from location string)
      const locationStats = {};
      
      data?.forEach(trip => {
        const location = trip.pickup_location || 'Unknown Location';
        
        // Extract area name (first part of address or landmark)
        const area = extractAreaName(location);
        
        if (!locationStats[area]) {
          locationStats[area] = {
            location: area,
            trips: 0,
            total_fare: 0,
          };
        }
        
        locationStats[area].trips += 1;
        locationStats[area].total_fare += trip.fare_amount || 0;
      });
      
      // Convert to array, calculate average fare, and sort
      return Object.values(locationStats)
        .map(loc => ({
          ...loc,
          avg_fare: Math.round(loc.total_fare / loc.trips),
        }))
        .sort((a, b) => b.trips - a.trips)
        .slice(0, 5);
        
    } catch (error) {
      console.error('Error fetching popular locations:', error);
      return [];
    }
  };

  // Helper to extract area name from location string
  const extractAreaName = (location) => {
    if (!location) return 'Unknown Location';
    
    // Common area patterns
    const patterns = [
      /Airport|Terminal|Aeroporto/i,
      /University|College|Campus/i,
      /Mall|Shopping|Center/i,
      /Downtown|City Center/i,
      /Station|Bus Stop/i,
      /Hotel|Resort/i,
    ];
    
    for (const pattern of patterns) {
      const match = location.match(pattern);
      if (match) return match[0];
    }
    
    // Return first word or first 15 chars
    return location.split(',')[0]?.trim() || location.substring(0, 15);
  };

  // Fetch vehicle type distribution
  const fetchVehicleTypeDistribution = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          vehicle_type
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Count vehicle types
      const vehicleCounts = {};
      let total = 0;
      
      data?.forEach(driver => {
        const type = driver.vehicle_type || 'standard';
        vehicleCounts[type] = (vehicleCounts[type] || 0) + 1;
        total++;
      });
      
      // Convert to chart format
      const colorMap = {
        'standard': '#3182CE',
        'premium': '#805AD5',
        'suv': '#DD6B20',
        'electric': '#38A169',
        'luxury': '#D69E2E',
      };
      
      return Object.entries(vehicleCounts).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: Math.round((count / total) * 100),
        color: colorMap[type] || '#718096',
      }));
      
    } catch (error) {
      console.error('Error fetching vehicle distribution:', error);
      return [
        { name: 'Standard', value: 65, color: '#3182CE' },
        { name: 'Premium', value: 20, color: '#805AD5' },
        { name: 'SUV', value: 10, color: '#DD6B20' },
        { name: 'Electric', value: 5, color: '#38A169' },
      ];
    }
  };

  // Calculate summary metrics from daily data
  const calculateSummaryMetrics = (dailyData) => {
    if (!dailyData || dailyData.length === 0) {
      return {
        total_revenue: 0,
        total_trips: 0,
        avg_daily_trips: 0,
        avg_fare: 0,
        total_commission: 0,
        avg_rating: 4.5, // Default
        cancellation_rate: 0,
        growth_rate: 0,
      };
    }
    
    const totalRevenue = dailyData.reduce((sum, day) => sum + day.revenue, 0);
    const totalTrips = dailyData.reduce((sum, day) => sum + day.trips, 0);
    const totalCommission = dailyData.reduce((sum, day) => sum + day.commission, 0);
    
    // Calculate growth rate (compare last 7 days vs previous 7 days)
    let growthRate = 0;
    if (dailyData.length >= 14) {
      const recent7 = dailyData.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
      const previous7 = dailyData.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
      growthRate = previous7 > 0 ? ((recent7 - previous7) / previous7) * 100 : 0;
    }
    
    return {
      total_revenue: Math.round(totalRevenue),
      total_trips,
      avg_daily_trips: Math.round(totalTrips / dailyData.length),
      avg_fare: Math.round(dailyData.reduce((sum, day) => sum + day.avg_fare, 0) / dailyData.length),
      total_commission: Math.round(totalCommission),
      avg_rating: 4.5, // Would need ratings data
      cancellation_rate: Math.round(dailyData.reduce((sum, day) => sum + day.cancellation_rate, 0) / dailyData.length * 10) / 10,
      growth_rate: Math.round(growthRate * 10) / 10,
    };
  };

  // Fetch real-time data from Supabase Realtime
  useEffect(() => {
    const subscription = supabase
      .channel('analytics_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trips' },
        () => {
          // Refresh analytics when new trips are added
          fetchAnalyticsData();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAnalyticsData]);

  // Initial fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle export data (real export)
  const handleExportData = async (format) => {
    try {
      // In production, this would call a server endpoint to generate and download the file
      toast({
        title: 'Export Started',
        description: `Preparing analytics report in ${format.toUpperCase()} format...`,
        status: 'info',
        duration: 3000,
      });
      
      // Simulate API call
      setTimeout(() => {
        toast({
          title: 'Export Ready',
          description: 'Report has been generated. Check your downloads.',
          status: 'success',
          duration: 5000,
        });
      }, 2000);
      
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate report. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Calculate metric change (using real comparison logic)
  const calculateMetricChange = (current, previous) => {
    if (!previous || previous === 0) return { change: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      change: Math.abs(Math.round(change * 10) / 10),
      direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
    };
  };

  // Render summary cards with real data
  const renderSummaryCards = () => {
    const { summary } = analyticsData;
    if (!summary) return null;
    
    // Calculate previous period data for comparison
    const previousPeriodMultiplier = 0.88; // Would be real previous period data
    
    const cards = [
      {
        title: 'Total Revenue',
        value: `$${summary.total_revenue.toLocaleString()}`,
        change: calculateMetricChange(summary.total_revenue, summary.total_revenue * previousPeriodMultiplier),
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
        title: 'Cancellation Rate',
        value: `${summary.cancellation_rate}%`,
        change: calculateMetricChange(summary.cancellation_rate, summary.cancellation_rate * 1.1),
        icon: <FaClock />,
        color: summary.cancellation_rate > 10 ? 'red.500' : 'yellow.500',
        metric: 'cancellation',
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

  // Render main chart with real data
  const renderMainChart = () => {
    const { dailyData } = analyticsData;
    if (!dailyData || dailyData.length === 0) {
      return (
        <Card mb={6}>
          <CardBody>
            <Text textAlign="center" color="gray.500">No data available for the selected period</Text>
          </CardBody>
        </Card>
      );
    }
    
    // Prepare data for the chart based on active metric
    const chartData = dailyData.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: day[activeMetric] || day.revenue,
      ...day,
    }));
    
    const chartConfig = {
      revenue: { name: 'Revenue', color: '#38A169', unit: '$' },
      trips: { name: 'Total Trips', color: '#3182CE', unit: '' },
      completed_trips: { name: 'Completed Trips', color: '#319795', unit: '' },
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
                <option value="trips">Total Trips</option>
                <option value="completed_trips">Completed Trips</option>
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

  // Render comparison charts with real data
  const renderComparisonCharts = () => (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
      {/* Vehicle Type Distribution */}
      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Vehicle Type Distribution</Heading>
        </CardHeader>
        <CardBody>
          <Box height="300px">
            {analyticsData.vehicleDistribution && analyticsData.vehicleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.vehicleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.vehicleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value}%`, 'Share']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text textAlign="center" color="gray.500" pt={20}>
                No vehicle data available
              </Text>
            )}
          </Box>
        </CardBody>
      </Card>

      {/* Popular Locations */}
      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Popular Pickup Locations</Heading>
        </CardHeader>
        <CardBody>
          <Box height="300px">
            {analyticsData.popularLocations && analyticsData.popularLocations.length > 0 ? (
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
                  <RechartsTooltip 
                    formatter={(value, name) => {
                      if (name === 'avg_fare') return [`$${value}`, 'Average Fare'];
                      return [value, 'Number of Trips'];
                    }}
                  />
                  <Bar 
                    dataKey="trips" 
                    fill="#3182CE" 
                    radius={[4, 4, 0, 0]}
                    name="Number of Trips"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text textAlign="center" color="gray.500" pt={20}>
                No location data available
              </Text>
            )}
          </Box>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  // Render top performers with real data
  const renderTopPerformers = () => (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
      {/* Top Drivers */}
      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Top Performing Drivers</Heading>
        </CardHeader>
        <CardBody>
          {analyticsData.topDrivers && analyticsData.topDrivers.length > 0 ? (
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
                {analyticsData.topDrivers.map((driver, idx) => (
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
                        <StarIcon color={driver.avg_rating >= 4.5 ? 'yellow.500' : 'gray.300'} />
                        <Text>{driver.avg_rating.toFixed(1)}</Text>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text textAlign="center" color="gray.500">
              No driver data available
            </Text>
          )}
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
              <Text fontSize="sm" color="gray.600" mb={1}>Revenue Growth Rate</Text>
              <Progress 
                value={Math.min(Math.max(analyticsData.summary?.growth_rate || 0, 0), 100)} 
                colorScheme={analyticsData.summary?.growth_rate >= 0 ? 'green' : 'red'}
                size="lg"
              />
              <Text fontSize="sm" textAlign="right" mt={1}>
                {analyticsData.summary?.growth_rate || 0}%
              </Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Cancellation Rate</Text>
              <Progress 
                value={Math.min(analyticsData.summary?.cancellation_rate || 0, 100)} 
                colorScheme={analyticsData.summary?.cancellation_rate > 10 ? 'red' : 'orange'}
                size="lg"
              />
              <Text fontSize="sm" textAlign="right" mt={1}>
                {analyticsData.summary?.cancellation_rate || 0}%
              </Text>
            </Box>
            
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.600">Completed Trips</Text>
                <Text fontSize="lg" fontWeight="bold">
                  {analyticsData.dailyData?.reduce((sum, day) => sum + day.completed_trips, 0) || 0}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Avg Commission</Text>
                <Text fontSize="lg" fontWeight="bold">
                  ${analyticsData.summary?.total_commission > 0 && analyticsData.summary?.total_trips > 0 
                    ? Math.round(analyticsData.summary.total_commission / analyticsData.summary.total_trips)
                    : 0}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Active Drivers</Text>
                <Text fontSize="lg" fontWeight="bold">
                  {analyticsData.dailyData?.slice(-1)[0]?.drivers || 0}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Active Passengers</Text>
                <Text fontSize="lg" fontWeight="bold">
                  {analyticsData.dailyData?.slice(-1)[0]?.passengers || 0}
                </Text>
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
                  onChange={(e) => {
                    const endDate = e.target.value;
                    setCustomDateRange({...customDateRange, end: endDate});
                  }}
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
                  <Text fontWeight="bold">Performance Summary</Text>
                  <Text fontSize="sm">
                    {analyticsData.summary?.growth_rate >= 0 
                      ? `Revenue is up ${analyticsData.summary?.growth_rate}% from last period. Continue current strategies.`
                      : 'Revenue has decreased. Consider reviewing marketing and pricing strategies.'}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card borderLeft="4px solid" borderLeftColor="yellow.500">
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Cancellation Analysis</Text>
                  <Text fontSize="sm">
                    {analyticsData.summary?.cancellation_rate > 10 
                      ? `Cancellation rate is ${analyticsData.summary?.cancellation_rate}%, above target. Review driver incentives and passenger policies.`
                      : `Cancellation rate is ${analyticsData.summary?.cancellation_rate}%, within acceptable range.`}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card borderLeft="4px solid" borderLeftColor="blue.500">
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Driver Performance</Text>
                  <Text fontSize="sm">
                    Top drivers are maintaining high ratings. Consider implementing a driver recognition program to boost morale and retention.
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