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
  useToast,
  Icon,
  Flex,
  Card,
  CardBody,
  CardHeader,
  InputGroup,
  InputRightElement,
  Image,
} from '@chakra-ui/react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import {
  FaLock,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
} from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      // 1. Login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      console.log('Login successful for:', data.user.email);

      // 2. Check if user has admin profile (use maybeSingle to avoid 406 errors)
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle(); // Changed from .single() to .maybeSingle()

        if (profileError) {
          console.warn('Profile check warning:', profileError);
          // Still allow login - profile might not exist yet
        } else if (profile && profile.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('Access denied. Admin only.');
        } else if (!profile) {
          console.warn('No profile found for user:', data.user.id);
          // Allow login but user might have limited access
        }
      } catch (profileErr) {
        console.warn('Could not check profile:', profileErr);
        // Continue with login anyway
      }

      // 3. Show success toast
      toast({
        title: 'Login successful',
        description: 'Welcome to NAVO Admin Dashboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

      // 4. Force redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
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
        {/* Logo/Header Section with Supabase Image */}
        <Box textAlign="center" mb={8}>
          <Flex justify="center" mb={4}>
            <Image
              src="https://lwepbrvqvbrbpjylrjsx.supabase.co/storage/v1/object/public/navo-media/logo%20(1).png"
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
            <form onSubmit={handleLogin}>
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
                  <InputGroup size="lg">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
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
                      <Icon as={FaLock} color="gray.400" boxSize={5} />
                    </Box>
                    <InputRightElement width="4.5rem" pr={3}>
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
                    </InputRightElement>
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
                <Box textAlign="center" mt={2}>
                  <Button
                    variant="link"
                    color="brand.600"
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ textDecoration: 'none', color: 'brand.700' }}
                  >
                    Forgot your password?
                  </Button>
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
            Version 2.0 • Secure access only
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