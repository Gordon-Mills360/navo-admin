import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  VStack,
  Container,
  useColorModeValue 
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { WarningIcon } from '@chakra-ui/icons';

const NotFound = () => {
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
          <WarningIcon boxSize={20} color="red.500" mb={6} />
          
          <Heading as="h1" size="2xl" mb={4}>
            404
          </Heading>
          
          <Heading as="h2" size="lg" mb={4}>
            Page Not Found
          </Heading>
          
          <Text fontSize="lg" color="gray.600" mb={8}>
            The page you're looking for doesn't exist or has been moved.
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
              as={RouterLink}
              to="/"
              variant="outline"
              size="lg"
              width="full"
            >
              Back to Home
            </Button>
          </VStack>
        </Box>
        
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500">
            If you believe this is an error, please contact your system administrator.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default NotFound;