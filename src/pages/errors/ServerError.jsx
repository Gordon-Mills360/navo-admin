import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  VStack,
  Container,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { WarningTwoIcon } from '@chakra-ui/icons';

const ServerError = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
          <WarningTwoIcon boxSize={20} color="red.500" mb={6} />
          
          <Heading as="h1" size="2xl" mb={4}>
            500
          </Heading>
          
          <Heading as="h2" size="lg" mb={4}>
            Internal Server Error
          </Heading>
          
          <Alert status="error" variant="subtle" borderRadius="md" mb={6}>
            <AlertIcon />
            <AlertDescription>
              Something went wrong on our server. Please try again later.
            </AlertDescription>
          </Alert>
          
          <Text fontSize="lg" color="gray.600" mb={8}>
            Our technical team has been notified and is working to fix the issue.
          </Text>
          
          <VStack spacing={4}>
            <Button
              onClick={() => window.location.reload()}
              colorScheme="blue"
              size="lg"
              width="full"
            >
              Refresh Page
            </Button>
            
            <Button
              as={RouterLink}
              to="/dashboard"
              variant="outline"
              size="lg"
              width="full"
            >
              Go to Dashboard
            </Button>
            
            <Button
              as={RouterLink}
              to="/"
              variant="ghost"
              size="lg"
              width="full"
            >
              Back to Home
            </Button>
          </VStack>
        </Box>
        
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500">
            If the problem persists, please contact support with details of what you were doing.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default ServerError;