import React, { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Heading,
  useToast,
  InputGroup,
  InputRightElement,
  Link,
  Flex,
  Image,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin only.');
      }

      toast({
        title: 'Login successful',
        description: 'Welcome back!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: 'Reset Password',
      description: 'Please contact system administrator',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Flex minH="100vh" bg="gray.50" align="center" justify="center" p={4}>
      <Box
        bg="white"
        p={8}
        borderRadius="xl"
        boxShadow="xl"
        maxW="md"
        w="100%"
      >
        <VStack spacing={6}>
          {/* Logo/Header */}
          <Box textAlign="center">
            <Heading size="lg" color="blue.600" mb={2}>
              NAVO Admin
            </Heading>
            <Text color="gray.600">Tricycle Ride Platform Dashboard</Text>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  size="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="100%"
                isLoading={loading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </VStack>
          </form>

          {/* Forgot Password */}
          <Button
            variant="link"
            colorScheme="blue"
            size="sm"
            onClick={handleForgotPassword}
          >
            Forgot password?
          </Button>

          {/* Footer */}
          <Box textAlign="center" pt={4} borderTop="1px" borderColor="gray.100">
            <Text fontSize="sm" color="gray.600">
              Admin access only. Contact support for assistance.
            </Text>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default Login;