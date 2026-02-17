import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Link as ChakraLink
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowBackIcon, EmailIcon } from '@chakra-ui/icons';
import { supabase } from '../../services/supabase';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: 'Email sent',
        description: 'Check your email for password reset instructions',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={20}>
      <Box
        p={8}
        bg="white"
        borderRadius="xl"
        boxShadow="lg"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2}>
              Forgot Password
            </Heading>
            <Text color="gray.600">
              Enter your email to receive reset instructions
            </Text>
          </Box>

          {sent ? (
            <VStack spacing={4} py={8} textAlign="center">
              <EmailIcon boxSize={12} color="green.500" />
              <Heading as="h2" size="lg">
                Check Your Email
              </Heading>
              <Text color="gray.600">
                We've sent password reset instructions to <strong>{email}</strong>.
                Please check your inbox and follow the link to reset your password.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Didn't receive the email? Check your spam folder or try again.
              </Text>
              <Button
                onClick={() => setSent(false)}
                colorScheme="blue"
                variant="outline"
              >
                Try Another Email
              </Button>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    placeholder="admin@navo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={loading}
                  loadingText="Sending..."
                  leftIcon={<EmailIcon />}
                >
                  Send Reset Instructions
                </Button>
              </VStack>
            </form>
          )}

          <Box pt={4} borderTopWidth="1px" borderTopColor="gray.200">
            <VStack spacing={2}>
              <ChakraLink
                as={RouterLink}
                to="/login"
                color="blue.500"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <ArrowBackIcon />
                Back to Login
              </ChakraLink>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default ForgotPassword;