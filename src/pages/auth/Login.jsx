import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Checkbox,
  Link,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  Image,
  HStack,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaShieldAlt } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={bgColor}
      p={4}
      bgImage="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    >
      <Card
        w="100%"
        maxW="480px"
        boxShadow="xl"
        borderRadius="2xl"
        bg={cardBg}
        overflow="hidden"
      >
        <CardBody p={8}>
          <VStack spacing={8} align="stretch">
            {/* Logo & Header */}
            <VStack spacing={4} textAlign="center">
              <HStack spacing={3}>
                <Icon as={FaShieldAlt} boxSize={10} color="brand.500" />
                <Heading size="xl" color="brand.500">
                  NAVO ADMIN
                </Heading>
              </HStack>
              <Text color="gray.600" fontSize="lg">
                Secure Admin Portal
              </Text>
            </VStack>

            {/* Error Alert */}
            {error && (
              <Alert status="error" borderRadius="lg" variant="left-accent">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize="sm">Login Error</AlertTitle>
                  <AlertDescription fontSize="sm">
                    {error}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="gray.700" mb={2}>
                    Email Address
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaEnvelope color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="email"
                      placeholder="admin@navoride.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="lg"
                      borderRadius="lg"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                      }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="gray.700" mb={2}>
                    Password
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaLock color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="lg"
                      borderRadius="lg"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                      }}
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        _hover={{ bg: 'transparent' }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Flex w="100%" justify="space-between" align="center">
                  <Checkbox
                    isChecked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    colorScheme="brand"
                    size="md"
                  >
                    <Text fontSize="sm" color="gray.600">
                      Remember me
                    </Text>
                  </Checkbox>
                  <Link
                    as={RouterLink}
                    to="/forgot-password"
                    color="brand.500"
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    Forgot password?
                  </Link>
                </Flex>

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  w="100%"
                  isLoading={loading}
                  loadingText="Signing in..."
                  fontSize="md"
                  fontWeight="semibold"
                  py={6}
                  borderRadius="lg"
                  boxShadow="md"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            <Divider borderColor="gray.300" />

            {/* Security Notice */}
            <Box
              p={4}
              bg="blue.50"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="blue.200"
            >
              <HStack spacing={3}>
                <Icon as={FaShieldAlt} color="blue.500" />
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={1}>
                    Security Notice
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    This portal is restricted to authorized personnel only.
                    Unauthorized access is prohibited.
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* Footer */}
            <VStack spacing={2} pt={4}>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                © {new Date().getFullYear()} Navo Ride. All rights reserved.
              </Text>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Version 1.0.0 • Last updated today
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default Login;