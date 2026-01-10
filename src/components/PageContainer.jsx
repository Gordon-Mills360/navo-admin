import React from 'react';
import { Box, VStack } from '@chakra-ui/react';

const PageContainer = ({ title, subtitle, children }) => {
  return (
    <VStack spacing={6} align="stretch">
      {(title || subtitle) && (
        <Box>
          {title && (
            <Box
              as="h1"
              fontSize="2xl"
              fontWeight="bold"
              color="gray.800"
              mb={2}
            >
              {title}
            </Box>
          )}
          {subtitle && (
            <Box
              as="p"
              fontSize="md"
              color="gray.600"
            >
              {subtitle}
            </Box>
          )}
        </Box>
      )}
      <Box>
        {children}
      </Box>
    </VStack>
  );
};

export default PageContainer;