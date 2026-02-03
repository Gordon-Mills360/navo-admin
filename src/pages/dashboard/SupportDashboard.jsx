import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Flex,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Textarea,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Avatar,
  Tag,
} from '@chakra-ui/react';
import {
  FaCommentDots,
  FaHeadset,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaPaperPlane,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaFilter,
  FaSort,
  FaEye,
  FaEdit,
  FaTrash,
  FaReply,
  FaEllipsisV,
  FaBell,
  FaComments,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/shared/StatCard';
import DataTable from '../../components/shared/DataTable';

const SupportDashboard = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState({
    openTickets: 0,
    pendingReplies: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    activeChats: 0,
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd have support_tickets and support_chats tables
      // For now, we'll use existing tables and mock some data
      
      // Mock data for demonstration
      const mockTickets = [
        {
          id: '1',
          user_id: 'user1',
          user_name: 'John Driver',
          user_type: 'driver',
          subject: 'Payment issue - missing payout',
          category: 'payment',
          priority: 'high',
          status: 'open',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          user_id: 'user2',
          user_name: 'Sarah Passenger',
          user_type: 'passenger',
          subject: 'Driver was rude',
          category: 'behavior',
          priority: 'medium',
          status: 'pending',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '3',
          user_id: 'user3',
          user_name: 'Mike Driver',
          user_type: 'driver',
          subject: 'App crash on trip start',
          category: 'technical',
          priority: 'high',
          status: 'open',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: '4',
          user_id: 'user4',
          user_name: 'Lisa Passenger',
          user_type: 'passenger',
          subject: 'Refund request',
          category: 'payment',
          priority: 'medium',
          status: 'resolved',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 14400000).toISOString(),
        },
        {
          id: '5',
          user_id: 'user5',
          user_name: 'David Driver',
          user_type: 'driver',
          subject: 'Document upload failed',
          category: 'technical',
          priority: 'low',
          status: 'open',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 18000000).toISOString(),
        },
      ];

      const mockChats = [
        {
          id: 'chat1',
          user_id: 'user6',
          user_name: 'Emma Passenger',
          user_type: 'passenger',
          last_message: 'How do I change my payment method?',
          unread_count: 2,
          last_active: new Date().toISOString(),
          status: 'active',
        },
        {
          id: 'chat2',
          user_id: 'user7',
          user_name: 'Tom Driver',
          user_type: 'driver',
          last_message: 'My rating dropped suddenly',
          unread_count: 0,
          last_active: new Date(Date.now() - 600000).toISOString(),
          status: 'active',
        },
        {
          id: 'chat3',
          user_id: 'user8',
          user_name: 'Anna Passenger',
          user_type: 'passenger',
          last_message: 'Trip cancellation policy',
          unread_count: 1,
          last_active: new Date(Date.now() - 1200000).toISOString(),
          status: 'active',
        },
      ];

      const openTickets = mockTickets.filter(t => t.status === 'open').length;
      const pendingTickets = mockTickets.filter(t => t.status === 'pending').length;

      setStats({
        openTickets,
        pendingReplies: pendingTickets,
        resolvedToday: 12,
        avgResponseTime: 15, // minutes
        satisfactionRate: 92,
        activeChats: mockChats.length,
      });

      setRecentTickets(mockTickets);
      setActiveChats(mockChats);
      setQuickReplies([
        'Please check your email for verification.',
        'Your payment has been processed successfully.',
        'We apologize for the inconvenience.',
        'Your account has been verified.',
        'Please update your app to the latest version.',
      ]);
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchSupportData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    // In real app, send message to backend
    console.log('Sending message:', newMessage, 'to ticket:', selectedTicket);
    setNewMessage('');
    alert('Message sent!');
  };

  const handleQuickReply = (reply) => {
    setNewMessage(reply);
  };

  const handleTicketAction = (ticketId, action) => {
    const ticket = recentTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    switch (action) {
      case 'view':
        setSelectedTicket(ticket);
        break;
      case 'resolve':
        if (window.confirm('Mark this ticket as resolved?')) {
          alert(`Ticket ${ticketId} marked as resolved`);
          fetchSupportData();
        }
        break;
      case 'assign':
        alert(`Assigning ticket ${ticketId} to yourself`);
        break;
      case 'priority':
        const newPriority = prompt('Enter new priority (low/medium/high):');
        if (newPriority) {
          alert(`Priority updated to ${newPriority}`);
        }
        break;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'red';
      case 'pending': return 'orange';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000); // minutes
    
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Support Dashboard
            </Heading>
            <Text color="gray.600" mt={1}>
              Customer support and communication management
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FaBell />}
              colorScheme="brand"
              size="sm"
              onClick={() => window.location.href = '/communication/notifications'}
            >
              Send Notification
            </Button>
            <Button
              leftIcon={<FaComments />}
              colorScheme="green"
              size="sm"
              onClick={() => window.location.href = '/support/live-chat'}
            >
              Live Chat
            </Button>
          </HStack>
        </Flex>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Open Tickets"
            value={stats.openTickets.toString()}
            icon={FaCommentDots}
            color="red"
            change="Requiring attention"
            trend="up"
          />
          
          <StatCard
            title="Pending Replies"
            value={stats.pendingReplies.toString()}
            icon={FaClock}
            color="orange"
            change="Awaiting response"
            trend="up"
          />
          
          <StatCard
            title="Resolved Today"
            value={stats.resolvedToday.toString()}
            icon={FaCheckCircle}
            color="green"
            change="Issues resolved"
            trend="up"
          />
          
          <StatCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime}m`}
            icon={FaHeadset}
            color="blue"
            change="First response time"
            trend="down"
          />
        </SimpleGrid>

        {/* Second Row Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Satisfaction Rate"
            value={`${stats.satisfactionRate}%`}
            icon={FaCheckCircle}
            color="teal"
            change="Customer satisfaction"
            trend="up"
          />
          
          <StatCard
            title="Active Chats"
            value={stats.activeChats.toString()}
            icon={FaComments}
            color="purple"
            change="Live conversations"
            trend="up"
          />
          
          <StatCard
            title="New Today"
            value="18"
            icon={FaExclamationCircle}
            color="brand"
            change="New support requests"
            trend="up"
          />
          
          <StatCard
            title="Escalated"
            value="3"
            icon={FaTimesCircle}
            color="red"
            change="Require supervisor"
            trend="stable"
          />
        </SimpleGrid>

        {/* Recent Tickets & Active Chats Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Tickets */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Recent Support Tickets</Heading>
                <Badge colorScheme="orange" variant="subtle">
                  {recentTickets.length} total
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody pt={0} px={0}>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>User</Th>
                      <Th>Subject</Th>
                      <Th>Priority</Th>
                      <Th>Status</Th>
                      <Th>Time</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {recentTickets.map((ticket) => (
                      <Tr key={ticket.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <HStack spacing={2}>
                            <Avatar
                              size="xs"
                              name={ticket.user_name}
                              bg={ticket.user_type === 'driver' ? 'blue.500' : 'green.500'}
                            />
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">
                                {ticket.user_name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {ticket.user_type}
                              </Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm" noOfLines={1}>
                            {ticket.subject}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getPriorityColor(ticket.priority)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {ticket.priority}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getStatusColor(ticket.status)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {ticket.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color="gray.500">
                            {formatTimeAgo(ticket.created_at)}
                          </Text>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FaEllipsisV />}
                              size="xs"
                              variant="ghost"
                            />
                            <MenuList minW="150px">
                              <MenuItem
                                icon={<FaEye />}
                                fontSize="sm"
                                onClick={() => handleTicketAction(ticket.id, 'view')}
                              >
                                View
                              </MenuItem>
                              <MenuItem
                                icon={<FaCheckCircle />}
                                fontSize="sm"
                                onClick={() => handleTicketAction(ticket.id, 'resolve')}
                              >
                                Resolve
                              </MenuItem>
                              <MenuItem
                                icon={<FaUser />}
                                fontSize="sm"
                                onClick={() => handleTicketAction(ticket.id, 'assign')}
                              >
                                Assign to Me
                              </MenuItem>
                              <MenuItem
                                icon={<FaFilter />}
                                fontSize="sm"
                                onClick={() => handleTicketAction(ticket.id, 'priority')}
                              >
                                Change Priority
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaCommentDots />}
                variant="ghost"
                size="sm"
                w="100%"
                onClick={() => window.location.href = '/support/tickets'}
              >
                View All Tickets
              </Button>
            </CardFooter>
          </Card>

          {/* Active Chats */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Active Chats</Heading>
                <Badge colorScheme="green" variant="subtle">
                  Live
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {activeChats.map((chat) => (
                  <Flex
                    key={chat.id}
                    justify="space-between"
                    align="center"
                    p={3}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                    onClick={() => setSelectedTicket({ id: chat.id, user_name: chat.user_name })}
                  >
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={chat.user_name}
                        bg={chat.user_type === 'driver' ? 'blue.500' : 'green.500'}
                      />
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">
                          {chat.user_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {chat.last_message}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack spacing={2}>
                      {chat.unread_count > 0 && (
                        <Badge
                          colorScheme="red"
                          variant="solid"
                          borderRadius="full"
                          minW={5}
                          h={5}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {chat.unread_count}
                        </Badge>
                      )}
                      <Text fontSize="xs" color="gray.500">
                        {formatTimeAgo(chat.last_active)}
                      </Text>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaComments />}
                variant="ghost"
                size="sm"
                w="100%"
                onClick={() => window.location.href = '/support/live-chat'}
              >
                Open Chat Dashboard
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>

        {/* Quick Reply & Message Box */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Quick Replies */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Heading size="md">Quick Replies</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    justifyContent="flex-start"
                    textAlign="left"
                    h="auto"
                    py={2}
                    whiteSpace="normal"
                    onClick={() => handleQuickReply(reply)}
                  >
                    <Text fontSize="sm">{reply}</Text>
                  </Button>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Message Box */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Heading size="md">
                {selectedTicket ? `Reply to ${selectedTicket.user_name}` : 'New Message'}
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                {selectedTicket && (
                  <Alert status="info" borderRadius="lg" size="sm">
                    <AlertIcon />
                    <Box flex="1">
                      <AlertTitle fontSize="sm">Ticket #{selectedTicket.id}</AlertTitle>
                      <AlertDescription fontSize="xs">
                        {selectedTicket.subject || 'No subject'}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
                
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  minH="120px"
                  borderRadius="lg"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
                
                <HStack spacing={3} w="100%">
                  <Button
                    leftIcon={<FaPaperPlane />}
                    colorScheme="brand"
                    flex={1}
                    onClick={handleSendMessage}
                    isDisabled={!newMessage.trim()}
                  >
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewMessage('');
                      setSelectedTicket(null);
                    }}
                  >
                    Clear
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Support Tools */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <Heading size="md">Support Tools</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Button
                leftIcon={<FaUser />}
                colorScheme="blue"
                variant="outline"
                h="auto"
                py={6}
                onClick={() => window.location.href = '/support/knowledge-base'}
              >
                <Box textAlign="left">
                  <Text fontWeight="semibold">Knowledge Base</Text>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Articles & guides
                  </Text>
                </Box>
              </Button>
              
              <Button
                leftIcon={<FaPhone />}
                colorScheme="green"
                variant="outline"
                h="auto"
                py={6}
                onClick={() => window.location.href = '/support/call-logs'}
              >
                <Box textAlign="left">
                  <Text fontWeight="semibold">Call Logs</Text>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Voice support history
                  </Text>
                </Box>
              </Button>
              
              <Button
                leftIcon={<FaEnvelope />}
                colorScheme="purple"
                variant="outline"
                h="auto"
                py={6}
                onClick={() => window.location.href = '/support/email-templates'}
              >
                <Box textAlign="left">
                  <Text fontWeight="semibold">Email Templates</Text>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Pre-written responses
                  </Text>
                </Box>
              </Button>
              
              <Button
                leftIcon={<FaChartBar />}
                colorScheme="orange"
                variant="outline"
                h="auto"
                py={6}
                onClick={() => window.location.href = '/support/analytics'}
              >
                <Box textAlign="left">
                  <Text fontWeight="semibold">Support Analytics</Text>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Performance metrics
                  </Text>
                </Box>
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  );
};

export default SupportDashboard;