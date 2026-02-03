import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Divider,
  IconButton,
  useColorModeValue,
  Tooltip,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Card,
  CardBody,
  Flex,
  Spacer
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  ChevronDownIcon,
  TimeIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  CloseIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon,
  ChatIcon,
  PhoneIcon,
  EmailIcon,
  AttachmentIcon,
  EditIcon,
  DeleteIcon,
  LockIcon,
  UnlockIcon,
  RepeatIcon,
  ViewIcon,
  CalendarIcon
} from '@chakra-ui/icons';
import {
  FaUser,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaUserCog,
  FaCar,
  FaCarSide,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaFileExport,
  FaHistory,
  FaDatabase,
  FaBell,
  FaMapMarkerAlt,
  FaRoute,
  FaCreditCard,
  FaWallet,
  FaShieldAlt,
  FaCog,
  FaChartLine,
  FaFilePdf,
  FaFileCsv,
  FaFileExcel
} from 'react-icons/fa';

// Utils
import { formatDate } from '../../utils/formatters';

const ActionLog = ({ 
  actions = [], 
  maxHeight = '400px',
  showAdmin = true,
  compact = false,
  ...props 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  // Color values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const timelineBg = useColorModeValue('gray.100', 'gray.700');

  // Get action icon
  const getActionIcon = (type) => {
    const iconMap = {
      // User actions
      'user_created': <FaUser color="green" />,
      'user_updated': <FaUserCog color="blue" />,
      'user_deleted': <FaUserTimes color="red" />,
      'user_suspended': <FaUserTimes color="orange" />,
      'user_activated': <FaUserCheck color="green" />,
      'user_verified': <FaUserCheck color="teal" />,
      
      // Driver actions
      'driver_approved': <FaUserCheck color="green" />,
      'driver_rejected': <FaUserTimes color="red" />,
      'driver_suspended': <FaUserTimes color="orange" />,
      'driver_document_verified': <FaShieldAlt color="teal" />,
      'driver_document_rejected': <FaTimesCircle color="red" />,
      
      // Trip actions
      'trip_created': <FaCar color="blue" />,
      'trip_accepted': <FaCarSide color="green" />,
      'trip_completed': <FaCheckCircle color="green" />,
      'trip_cancelled': <FaTimesCircle color="red" />,
      'trip_disputed': <FaExclamationTriangle color="orange" />,
      'trip_refunded': <FaExchangeAlt color="purple" />,
      
      // Payment actions
      'payment_processed': <FaMoneyBillWave color="green" />,
      'payment_failed': <FaTimesCircle color="red" />,
      'payment_refunded': <FaExchangeAlt color="purple" />,
      'payout_processed': <FaWallet color="green" />,
      'payout_failed': <FaTimesCircle color="red" />,
      
      // Emergency actions
      'emergency_reported': <FaExclamationTriangle color="red" />,
      'emergency_acknowledged': <FaBell color="orange" />,
      'emergency_resolved': <FaCheckCircle color="green" />,
      'emergency_escalated': <FaExclamationTriangle color="purple" />,
      
      // Admin actions
      'admin_login': <FaUserShield color="blue" />,
      'admin_logout': <FaUserShield color="gray" />,
      'admin_action': <FaHistory color="blue" />,
      'system_config_updated': <FaCog color="purple" />,
      
      // Notification actions
      'notification_sent': <FaBell color="blue" />,
      'broadcast_sent': <FaBell color="green" />,
      
      // File actions
      'file_uploaded': <FaFileExport color="blue" />,
      'file_downloaded': <FaFileExport color="green" />,
      'report_generated': <FaFilePdf color="purple" />,
      
      // Default
      'default': <InfoIcon color="gray" />
    };

    return iconMap[type] || iconMap.default;
  };

  // Get action color
  const getActionColor = (type) => {
    if (type.includes('created') || type.includes('approved') || type.includes('completed')) return 'green';
    if (type.includes('updated') || type.includes('modified')) return 'blue';
    if (type.includes('deleted') || type.includes('rejected') || type.includes('failed')) return 'red';
    if (type.includes('suspended') || type.includes('warning')) return 'orange';
    if (type.includes('payment') || type.includes('payout')) return 'teal';
    if (type.includes('emergency')) return 'red';
    if (type.includes('login') || type.includes('logout')) return 'purple';
    return 'gray';
  };

  // Filter and sort actions
  const filteredActions = useMemo(() => {
    let result = [...actions];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(action => 
        (action.type?.toLowerCase().includes(term)) ||
        (action.user?.name?.toLowerCase().includes(term)) ||
        (action.details?.note?.toLowerCase().includes(term)) ||
        (action.details?.description?.toLowerCase().includes(term))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(action => action.type === filterType);
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [actions, searchTerm, filterType, sortOrder]);

  // Get unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set();
    actions.forEach(action => {
      if (action.type) types.add(action.type);
    });
    return Array.from(types).sort();
  }, [actions]);

  // Export actions
  const handleExport = (format) => {
    const exportData = filteredActions.map(action => ({
      Timestamp: formatDate(action.timestamp, 'datetime'),
      Type: action.type,
      Admin: action.user?.name || 'System',
      Details: action.details?.note || action.details?.description || '',
      Priority: action.priority || 'medium'
    }));

    if (format === 'csv') {
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
      link.download = `action_log_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  if (compact) {
    return (
      <Card bg={cardBg} border="1px" borderColor={borderColor} {...props}>
        <CardBody>
          <VStack spacing={2} align="stretch">
            {filteredActions.slice(0, 5).map((action, index) => (
              <Box key={action.id || index}>
                <HStack spacing={3} align="start">
                  <Box color={getActionColor(action.type)}>
                    {getActionIcon(action.type)}
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      {action.type?.replace(/_/g, ' ')}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {formatDate(action.timestamp, 'time')}
                    </Text>
                  </VStack>
                </HStack>
                {index < filteredActions.slice(0, 5).length - 1 && <Divider mt={2} />}
              </Box>
            ))}
            
            {filteredActions.length === 0 && (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No actions found
              </Text>
            )}
            
            {filteredActions.length > 5 && (
              <Button size="sm" variant="link" colorScheme="blue">
                View all {filteredActions.length} actions
              </Button>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor} {...props}>
      <CardBody p={0}>
        {/* Header with controls */}
        <Box p={4} borderBottom="1px" borderColor={borderColor}>
          <Flex align="center" gap={4}>
            <HStack flex={1}>
              <InputGroup size="sm" maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search actions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select
                size="sm"
                w="150px"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Actions</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
              
              <Select
                size="sm"
                w="120px"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </Select>
            </HStack>
            
            <Menu>
              <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>
                Export
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FaFileCsv />} onClick={() => handleExport('csv')}>
                  Export as CSV
                </MenuItem>
                <MenuItem icon={<FaFileExcel />} onClick={() => handleExport('csv')}>
                  Export as Excel
                </MenuItem>
                <MenuItem icon={<FaFilePdf />} onClick={() => handleExport('csv')}>
                  Export as PDF
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Box>
        
        {/* Timeline */}
        <Box 
          maxHeight={maxHeight}
          overflowY="auto"
          p={4}
        >
          {filteredActions.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {filteredActions.map((action, index) => (
                <Box key={action.id || index} position="relative" pl={8}>
                  {/* Timeline line */}
                  {index < filteredActions.length - 1 && (
                    <Box
                      position="absolute"
                      left="24px"
                      top="32px"
                      bottom="-20px"
                      w="2px"
                      bg={timelineBg}
                    />
                  )}
                  
                  {/* Timeline dot */}
                  <Box
                    position="absolute"
                    left="20px"
                    top="4px"
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg={`${getActionColor(action.type)}.500`}
                    border="2px solid"
                    borderColor={cardBg}
                    zIndex={1}
                  />
                  
                  {/* Action card */}
                  <Card 
                    bg={cardBg} 
                    border="1px" 
                    borderColor={borderColor}
                    shadow="sm"
                  >
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        {/* Header */}
                        <Flex align="center" gap={3}>
                          <Box color={`${getActionColor(action.type)}.500`} fontSize="lg">
                            {getActionIcon(action.type)}
                          </Box>
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontWeight="bold">
                              {action.type?.replace(/_/g, ' ') || 'Action'}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {formatDate(action.timestamp, 'full')}
                            </Text>
                          </VStack>
                          
                          {action.priority && (
                            <Badge
                              colorScheme={
                                action.priority === 'high' ? 'red' :
                                action.priority === 'medium' ? 'yellow' :
                                action.priority === 'low' ? 'green' : 'gray'
                              }
                            >
                              {action.priority}
                            </Badge>
                          )}
                        </Flex>
                        
                        {/* Admin info */}
                        {showAdmin && action.user && (
                          <HStack spacing={2} bg="gray.50" p={2} borderRadius="md">
                            <Avatar
                              size="xs"
                              name={action.user.name}
                              src={action.user.avatar}
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">
                                {action.user.name}
                              </Text>
                              {action.user.role && (
                                <Text fontSize="xs" color="gray.500">
                                  {action.user.role}
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                        )}
                        
                        {/* Details */}
                        {action.details && (
                          <Box mt={2}>
                            {(action.details.note || action.details.description) && (
                              <Text fontSize="sm" mb={2}>
                                {action.details.note || action.details.description}
                              </Text>
                            )}
                            
                            {/* Additional details */}
                            {Object.keys(action.details).filter(k => !['note', 'description'].includes(k)).length > 0 && (
                              <Box 
                                mt={2} 
                                p={2} 
                                bg="gray.50" 
                                borderRadius="md" 
                                fontSize="xs"
                                fontFamily="mono"
                              >
                                <pre style={{ margin: 0, overflowX: 'auto' }}>
                                  {JSON.stringify(
                                    Object.fromEntries(
                                      Object.entries(action.details)
                                        .filter(([k]) => !['note', 'description'].includes(k))
                                    ),
                                    null,
                                    2
                                  )}
                                </pre>
                              </Box>
                            )}
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </Box>
              ))}
            </VStack>
          ) : (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No actions found</Text>
              {searchTerm || filterType !== 'all' ? (
                <Button
                  size="sm"
                  variant="link"
                  colorScheme="blue"
                  mt={2}
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </Box>
          )}
        </Box>
        
        {/* Footer */}
        {filteredActions.length > 0 && (
          <Box 
            p={4} 
            borderTop="1px" 
            borderColor={borderColor}
            bg={useColorModeValue('gray.50', 'gray.900')}
          >
            <Flex align="center" justify="space-between">
              <Text fontSize="sm" color="gray.500">
                Showing {filteredActions.length} of {actions.length} actions
              </Text>
              
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<RepeatIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setSortOrder('desc');
                  }}
                >
                  Reset
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<DownloadIcon />}
                  onClick={() => handleExport('csv')}
                >
                  Export
                </Button>
              </HStack>
            </Flex>
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

export default ActionLog;