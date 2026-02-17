import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  Icon,
  Flex,
  Card,
  CardBody,
  CardHeader,
  InputGroup,
  InputRightElement,
  Image,
  useToast,
  Link,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  FaLock,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setLoading(true);

    try {
      // OPTION 1: Use your AuthContext login function
      const result = await login(email.trim(), password.trim());
      
      if (result.success) {
        // Show success toast
        toast({
          title: 'Login successful',
          description: 'Redirecting to dashboard...',
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'top',
        });

        // IMPORTANT: Wait a bit for auth state to update
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 200);
        
      } else {
        // Handle specific error messages
        let errorMessage = 'Invalid email or password';
        if (result.error && result.error.includes('Email')) {
          errorMessage = 'Invalid email format';
        } else if (result.error && result.error.includes('password')) {
          errorMessage = 'Invalid password';
        }
        
        throw new Error(result.error || errorMessage);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      // User-friendly error messages
      let userMessage = error.message || 'Login failed. Please check your credentials.';
      
      if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please verify your email before logging in';
      } else if (error.message.includes('network')) {
        userMessage = 'Network error. Please check your connection.';
      }
      
      toast({
        title: 'Login failed',
        description: userMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      
    } finally {
      setLoading(false);
    }
  };

  // OPTIONAL: Alternative direct Supabase login function
  const handleDirectLogin = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setLoading(true);

    try {
      // Direct Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // IMPORTANT: Check if user exists in admins table
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (adminError) {
          // User is not in admins table - sign them out
          await supabase.auth.signOut();
          throw new Error('Access denied. Not an authorized admin.');
        }

        // Check if admin is active
        if (adminData.status !== 'active') {
          await supabase.auth.signOut();
          throw new Error('Account is suspended. Contact system administrator.');
        }

        // Force redirect to dashboard
        toast({
          title: 'Login successful',
          description: 'Welcome to NAVO Admin Dashboard',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });

        // ADD THIS LOG
        console.log('LOGIN SUCCESS - Redirecting to /dashboard');

        // Force redirect to dashboard
        setTimeout(() => {
          console.log('Navigating now...');
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Direct login error:', error);
      
      let userMessage = error.message;
      if (error.message === 'Invalid login credentials') {
        userMessage = 'Invalid email or password';
      }
      
      toast({
        title: 'Login failed',
        description: userMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-br, brand.50, blue.50)" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      py={8}
      px={4}
    >
      <Container maxW="md">
        {/* Logo/Header Section */}
        <Box textAlign="center" mb={8}>
          <Flex justify="center" mb={4}>
            <Image
              src="https://qzcyjycqckchhjkfntqb.supabase.co/storage/v1/object/public/navo-media/logo.png"
              alt="NAVO Logo"
              maxH="240px"
              objectFit="contain"
            />
          </Flex>
          <Heading 
            size="xl" 
            color="gray.800" 
            mb={2}
            bgGradient="linear(to-r, brand.500, brand.600)"
            bgClip="text"
          >
            NAVO Admin
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Navo Ride Platform
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Secure Admin Dashboard
          </Text>
        </Box>

        {/* Login Card */}
        <Card 
          borderRadius="2xl" 
          boxShadow="xl" 
          borderWidth="1px"
          borderColor="gray.200"
          overflow="hidden"
        >
          <CardHeader 
            bg="white" 
            borderBottomWidth="1px" 
            borderBottomColor="gray.200"
            py={6}
          >
            <Heading size="md" color="gray.800" textAlign="center">
              Admin Sign In
            </Heading>
            <Text fontSize="sm" color="gray.600" textAlign="center" mt={2}>
              Enter your credentials to access the dashboard
            </Text>
          </CardHeader>
          
          <CardBody p={8}>
            <form onSubmit={handleLogin}> {/* Use handleDirectLogin if needed */}
              <VStack spacing={6}>
                {/* Email Field */}
                <FormControl isRequired>
                  <FormLabel 
                    fontSize="sm" 
                    fontWeight="medium" 
                    color="gray.700"
                    mb={2}
                  >
                    Email Address
                  </FormLabel>
                  <InputGroup>
                    <Box position="relative" width="100%">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@navo.com"
                        size="lg"
                        borderRadius="lg"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 1px brand.500',
                        }}
                        _hover={{
                          borderColor: 'gray.400',
                        }}
                        pl={12}
                      />
                      <Box
                        position="absolute"
                        left="4"
                        top="50%"
                        transform="translateY(-50%)"
                      >
                        <Icon as={FaEnvelope} color="gray.400" boxSize={5} />
                      </Box>
                    </Box>
                  </InputGroup>
                </FormControl>

                {/* Password Field */}
                <FormControl isRequired>
                  <FormLabel 
                    fontSize="sm" 
                    fontWeight="medium" 
                    color="gray.700"
                    mb={2}
                  >
                    Password
                  </FormLabel>
                  <InputGroup>
                    <Box position="relative" width="100%">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        size="lg"
                        borderRadius="lg"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 1px brand.500',
                        }}
                        _hover={{
                          borderColor: 'gray.400',
                        }}
                        pl={12}
                        pr="4.5rem"
                      />
                      <Box
                        position="absolute"
                        left="4"
                        top="50%"
                        transform="translateY(-50%)"
                      >
                        <Icon as={FaLock} color="gray.400" boxSize={5} />
                      </Box>
                      <Box
                        position="absolute"
                        right="0"
                        top="50%"
                        transform="translateY(-50%)"
                        pr={3}
                      >
                        <Button
                          h="1.75rem"
                          size="sm"
                          onClick={togglePasswordVisibility}
                          variant="ghost"
                          color="gray.500"
                          _hover={{ color: 'brand.500' }}
                        >
                          {showPassword ? (
                            <Icon as={FaEyeSlash} boxSize={4} />
                          ) : (
                            <Icon as={FaEye} boxSize={4} />
                          )}
                        </Button>
                      </Box>
                    </Box>
                  </InputGroup>
                </FormControl>

                {/* Login Button */}
                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  size="lg"
                  isLoading={loading}
                  loadingText="Signing in..."
                  borderRadius="lg"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                  mt={4}
                >
                  Sign In
                </Button>

                {/* Forgot Password */}
                <Box textAlign="center" mt={2} width="full">
                  <Link
                    as={RouterLink}
                    to="/forgot-password"
                    color="brand.500"
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ 
                      textDecoration: 'underline',
                      color: 'brand.600'
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {/* Footer */}
        <Box mt={8} textAlign="center">
          <Text fontSize="sm" color="gray.500">
            © {new Date().getFullYear()} NAVO Ride Platform
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Version 1.0 • Secure access only
          </Text>
        </Box>

        {/* Security Notice */}
        <Box
          mt={6}
          p={4}
          borderRadius="lg"
          bg="blue.50"
          borderWidth="1px"
          borderColor="blue.200"
        >
          <Flex align="center">
            <Icon as={FaShieldAlt} color="blue.500" mr={3} />
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="blue.800">
                Security Notice
              </Text>
              <Text fontSize="xs" color="blue.600">
                This system is for authorized personnel only. Unauthorized access is prohibited.
              </Text>
            </Box>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;