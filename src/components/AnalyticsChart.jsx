import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/helpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  VStack,
  Text,
  Spinner,
  SimpleGrid,
  Icon,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
} from '@chakra-ui/react';
import {
  FaChartLine,
  FaDollarSign,
  FaUserFriends,
  FaSyncAlt,
  FaCalendarAlt,
} from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('rides'); // 'rides', 'revenue', 'drivers'
  const [timeRange, setTimeRange] = useState('7days'); // '7days', '30days', '90days'

  useEffect(() => {
    fetchChartData();
  }, [timeRange, chartType]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }
      
      // Format dates for Supabase
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch rides data
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('created_at, fare, status')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('created_at', { ascending: true });
      
      if (ridesError) throw ridesError;
      
      // Fetch drivers data
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('created_at, approved')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('created_at', { ascending: true });
      
      if (driversError) throw driversError;
      
      // Process data for charts
      processChartData(ridesData || [], driversData || []);
      
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (rides, drivers) => {
    // Create date labels based on time range
    const labels = [];
    const daysCount = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    // Initialize data arrays
    const ridesPerDay = new Array(daysCount).fill(0);
    const revenuePerDay = new Array(daysCount).fill(0);
    const driversPerDay = new Array(daysCount).fill(0);
    const approvedDriversPerDay = new Array(daysCount).fill(0);
    
    // Process rides data
    rides.forEach(ride => {
      const rideDate = new Date(ride.created_at);
      const dayIndex = Math.floor((rideDate - new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
      
      if (dayIndex >= 0 && dayIndex < daysCount) {
        ridesPerDay[dayIndex]++;
        if (ride.status === 'completed') {
          revenuePerDay[dayIndex] += ride.fare || 0;
        }
      }
    });
    
    // Process drivers data
    drivers.forEach(driver => {
      const driverDate = new Date(driver.created_at);
      const dayIndex = Math.floor((driverDate - new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
      
      if (dayIndex >= 0 && dayIndex < daysCount) {
        driversPerDay[dayIndex]++;
        if (driver.approved) {
          approvedDriversPerDay[dayIndex]++;
        }
      }
    });
    
    // Calculate cumulative drivers
    const cumulativeDrivers = [];
    let total = 0;
    driversPerDay.forEach(count => {
      total += count;
      cumulativeDrivers.push(total);
    });
    
    // Prepare chart data based on selected type
    let data, options;
    
    switch (chartType) {
      case 'rides':
        data = {
          labels,
          datasets: [
            {
              label: 'Total Rides',
              data: ridesPerDay,
              borderColor: '#2196f3', // Blue
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: 'Completed Rides',
              data: ridesPerDay.map((_, index) => 
                rides.filter(r => {
                  const rideDate = new Date(r.created_at);
                  const dayIndex = Math.floor((rideDate - new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
                  return dayIndex === index && r.status === 'completed';
                }).length
              ),
              borderColor: '#4caf50', // Green
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
            }
          ]
        };
        options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
              }
            },
            title: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              titleColor: '#333',
              bodyColor: '#666',
              borderColor: '#DDD',
              borderWidth: 1,
              boxPadding: 10,
              cornerRadius: 8,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              ticks: {
                color: '#666',
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              ticks: {
                color: '#666',
              }
            }
          }
        };
        break;
        
      case 'revenue':
        data = {
          labels,
          datasets: [
            {
              label: 'Daily Revenue',
              data: revenuePerDay,
              backgroundColor: '#FF9800', // Orange/Brand
              borderColor: '#F57C00',
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.7,
            },
            {
              label: '7-Day Average',
              data: calculateMovingAverage(revenuePerDay, 7),
              borderColor: '#9c27b0', // Purple
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0
            }
          ]
        };
        options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
              }
            },
            title: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              titleColor: '#333',
              bodyColor: '#666',
              borderColor: '#DDD',
              borderWidth: 1,
              boxPadding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (context) => {
                  return `Revenue: ${formatCurrency(context.raw)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              ticks: {
                color: '#666',
                callback: (value) => formatCurrency(value)
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              ticks: {
                color: '#666',
              }
            }
          }
        };
        break;
        
      case 'drivers':
        data = {
          labels,
          datasets: [
            {
              type: 'bar',
              label: 'New Drivers',
              data: driversPerDay,
              backgroundColor: '#2196f3', // Blue
              borderColor: '#1976d2',
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.7,
            },
            {
              type: 'line',
              label: 'Total Drivers',
              data: cumulativeDrivers,
              borderColor: '#4caf50', // Green
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#4caf50',
            },
            {
              type: 'line',
              label: 'Approved Drivers',
              data: approvedDriversPerDay.reduce((acc, count, index) => {
                const prev = acc[index - 1] || 0;
                acc.push(prev + count);
                return acc;
              }, []),
              borderColor: '#FF9800', // Orange/Brand
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              borderDash: [5, 5],
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: '#FF9800',
            }
          ]
        };
        options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
              }
            },
            title: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              titleColor: '#333',
              bodyColor: '#666',
              borderColor: '#DDD',
              borderWidth: 1,
              boxPadding: 10,
              cornerRadius: 8,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              ticks: {
                color: '#666',
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              ticks: {
                color: '#666',
              }
            }
          }
        };
        break;
        
      default:
        data = { labels: [], datasets: [] };
        options = {};
    }
    
    setChartData({ data, options });
  };

  const calculateMovingAverage = (data, windowSize) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const values = data.slice(start, i + 1);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      result.push(average);
    }
    return result;
  };

  const refreshChart = () => {
    fetchChartData();
  };

  const getChartTypeIcon = () => {
    switch (chartType) {
      case 'rides': return FaChartLine;
      case 'revenue': return FaDollarSign;
      case 'drivers': return FaUserFriends;
      default: return FaChartLine;
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        h="400px"
        bg="white"
        borderRadius="xl"
        boxShadow="sm"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <VStack spacing={4}>
          <Spinner 
            size="xl" 
            color="brand.500"
            thickness="4px"
            speed="0.65s"
          />
          <Text color="gray.600" fontSize="sm">
            Loading analytics data...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (!chartData) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="gray.500">No chart data available</Text>
      </Box>
    );
  }

  const totalRides = chartType === 'rides' ? chartData.data.datasets[0].data.reduce((a, b) => a + b, 0) : 0;
  const totalRevenue = chartType === 'revenue' ? chartData.data.datasets[0].data.reduce((a, b) => a + b, 0) : 0;
  const totalDrivers = chartType === 'drivers' ? chartData.data.datasets[1].data[chartData.data.datasets[1].data.length - 1] || 0 : 0;

  return (
    <Box>
      {/* Chart Controls */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'stretch', md: 'center' }}
        mb={6}
        gap={4}
      >
        <HStack spacing={4}>
          <ButtonGroup isAttached variant="outline" size={{ base: 'sm', md: 'md' }}>
            <Button
              onClick={() => setChartType('rides')}
              leftIcon={<Icon as={FaChartLine} />}
              colorScheme={chartType === 'rides' ? 'blue' : 'gray'}
              variant={chartType === 'rides' ? 'solid' : 'outline'}
            >
              Rides
            </Button>
            <Button
              onClick={() => setChartType('revenue')}
              leftIcon={<Icon as={FaDollarSign} />}
              colorScheme={chartType === 'revenue' ? 'brand' : 'gray'}
              variant={chartType === 'revenue' ? 'solid' : 'outline'}
            >
              Revenue
            </Button>
            <Button
              onClick={() => setChartType('drivers')}
              leftIcon={<Icon as={FaUserFriends} />}
              colorScheme={chartType === 'drivers' ? 'green' : 'gray'}
              variant={chartType === 'drivers' ? 'solid' : 'outline'}
            >
              Drivers
            </Button>
          </ButtonGroup>
          
          <Badge 
            colorScheme="brand" 
            variant="subtle" 
            borderRadius="full" 
            px={3} 
            py={1}
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={FaCalendarAlt} boxSize={3} />
            <Text fontSize="xs" fontWeight="medium">
              {timeRange === '7days' ? '7 Days' : timeRange === '30days' ? '30 Days' : '90 Days'}
            </Text>
          </Badge>
        </HStack>
        
        <HStack spacing={2}>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              onClick={() => setTimeRange('7days')}
              colorScheme={timeRange === '7days' ? 'brand' : 'gray'}
              variant={timeRange === '7days' ? 'solid' : 'outline'}
            >
              7D
            </Button>
            <Button
              onClick={() => setTimeRange('30days')}
              colorScheme={timeRange === '30days' ? 'brand' : 'gray'}
              variant={timeRange === '30days' ? 'solid' : 'outline'}
            >
              30D
            </Button>
            <Button
              onClick={() => setTimeRange('90days')}
              colorScheme={timeRange === '90days' ? 'brand' : 'gray'}
              variant={timeRange === '90days' ? 'solid' : 'outline'}
            >
              90D
            </Button>
          </ButtonGroup>
          
          <Button
            size="sm"
            onClick={refreshChart}
            isLoading={loading}
            leftIcon={<Icon as={FaSyncAlt} />}
            colorScheme="gray"
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* Chart Container */}
      <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
        <CardBody p={6}>
          <Box h={{ base: '300px', md: '400px' }} w="100%">
            {chartType === 'revenue' ? (
              <Bar data={chartData.data} options={chartData.options} />
            ) : (
              <Line data={chartData.data} options={chartData.options} />
            )}
          </Box>
        </CardBody>
      </Card>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={6}>
        {chartType === 'rides' && (
          <>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="blue.200">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaChartLine} color="blue.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {totalRides}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Total Rides
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="green.200">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaChartLine} color="green.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {chartData.data.datasets[1].data.reduce((a, b) => a + b, 0)}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Completed Rides
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaChartLine} color="gray.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {totalRides > 0 
                      ? (totalRides / chartData.data.datasets[0].data.length).toFixed(1)
                      : 0}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Avg Daily Rides
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </>
        )}
        
        {chartType === 'revenue' && (
          <>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="brand.100">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaDollarSign} color="brand.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {formatCurrency(totalRevenue)}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Total Revenue
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="yellow.200">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaDollarSign} color="yellow.600" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {formatCurrency(totalRevenue * 0.2)}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Platform Commission
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaDollarSign} color="gray.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {formatCurrency(
                      totalRevenue > 0 
                        ? totalRevenue / chartData.data.datasets[0].data.length
                        : 0
                    )}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Avg Daily Revenue
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </>
        )}
        
        {chartType === 'drivers' && (
          <>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="blue.200">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaUserFriends} color="blue.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {chartData.data.datasets[0].data.reduce((a, b) => a + b, 0)}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    New Drivers
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="green.200">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaUserFriends} color="green.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {totalDrivers}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Total Drivers
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="brand.100">
              <CardBody p={4}>
                <VStack align="center" spacing={2}>
                  <Icon as={FaUserFriends} color="brand.500" boxSize={5} />
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {chartData.data.datasets[2].data[chartData.data.datasets[2].data.length - 1] || 0}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Approved Drivers
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </>
        )}
      </SimpleGrid>
    </Box>
  );
};

export default AnalyticsChart;