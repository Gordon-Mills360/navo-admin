import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  VStack,
  Container,
  useColorModeValue,
  Code 
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { LockIcon } from '@chakra-ui/icons';

const Unauthorized = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const attemptedRoute = location.state?.from || location.pathname;

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} textAlign="center">
        <Box
          p={8}
          bg={bgColor}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="lg"
        >
          <LockIcon boxSize={20} color="orange.500" mb={6} />
          
          <Heading as="h1" size="2xl" mb={4}>
            403
          </Heading>
          
          <Heading as="h2" size="lg" mb={4}>
            Access Denied
          </Heading>
          
          <Text fontSize="lg" color="gray.600" mb={4}>
            You don't have permission to access this page.
          </Text>
          
          {attemptedRoute && (
            <Box 
              bg="gray.50" 
              p={4} 
              borderRadius="md" 
              mb={6}
              textAlign="left"
            >
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Attempted to access:
              </Text>
              <Code p={2} borderRadius="md" fontSize="sm">
                {attemptedRoute}
              </Code>
            </Box>
          )}
          
          <Text fontSize="md" color="gray.500" mb={8}>
            Please contact your administrator if you believe you should have access to this resource.
          </Text>
          
          <VStack spacing={4}>
            <Button
              as={RouterLink}
              to="/dashboard"
              colorScheme="blue"
              size="lg"
              width="full"
            >
              Go to Dashboard
            </Button>
            
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
              width="full"
            >
              Go Back
            </Button>
          </VStack>
        </Box>
        
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500">
            Your user role may not have the required permissions for this page.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default Unauthorized;