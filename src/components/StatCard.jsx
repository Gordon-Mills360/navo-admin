import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
} from '@chakra-ui/react';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'brand', 
  trend = null,
  change = null,
  subtitle = null
}) => {
  
  // Color mapping for different stat types
  const colorConfig = {
    brand: {
      bg: 'brand.50',
      color: 'brand.500',
      border: 'brand.100',
    },
    green: {
      bg: 'green.50',
      color: 'green.500',
      border: 'green.100',
    },
    blue: {
      bg: 'blue.50',
      color: 'blue.500',
      border: 'blue.100',
    },
    purple: {
      bg: 'purple.50',
      color: 'purple.500',
      border: 'purple.100',
    },
    orange: {
      bg: 'orange.50',
      color: 'orange.500',
      border: 'orange.100',
    },
  };

  const config = colorConfig[color] || colorConfig.brand;

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={config.border}
      _hover={{ 
        boxShadow: 'lg', 
        transform: 'translateY(-4px)',
        borderColor: config.color,
      }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      position="relative"
      overflow="hidden"
    >
      {/* Decorative corner */}
      <Box
        position="absolute"
        top={0}
        right={0}
        w="80px"
        h="80px"
        bg={config.bg}
        borderBottomLeftRadius="full"
        opacity={0.3}
      />
      
      <HStack justify="space-between" align="start" spacing={4}>
        <VStack align="start" spacing={3} flex={1}>
          <Text 
            fontSize="sm" 
            color="gray.600" 
            fontWeight="medium"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            {title}
          </Text>
          
          <Text 
            fontSize="3xl" 
            fontWeight="bold" 
            color="gray.800"
            lineHeight="1.2"
          >
            {value}
          </Text>
          
          {(trend || change) && (
            <HStack spacing={2}>
              {trend && (
                <Badge
                  colorScheme={trend.startsWith('+') ? 'green' : 'red'}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  {trend} from last month
                </Badge>
              )}
              
              {change && (
                <Text
                  fontSize="xs"
                  color={change.includes('+') ? 'green.500' : 
                         change.includes('-') ? 'red.500' : 'gray.500'}
                  fontWeight="medium"
                >
                  {change}
                </Text>
              )}
            </HStack>
          )}
          
          {subtitle && (
            <Text
              fontSize="xs"
              color="gray.500"
              mt={1}
            >
              {subtitle}
            </Text>
          )}
        </VStack>
        
        <Box
          p={3}
          borderRadius="xl"
          bg={config.bg}
          color={config.color}
          border="1px"
          borderColor={config.border}
          boxShadow="sm"
          position="relative"
          zIndex={1}
          _hover={{
            transform: 'scale(1.05)',
            boxShadow: 'md',
          }}
          transition="all 0.2s"
        >
          <Icon as={icon} boxSize={6} />
        </Box>
      </HStack>
      
      {/* Progress indicator (optional) */}
      {trend && (
        <Box
          mt={4}
          h="4px"
          bg="gray.100"
          borderRadius="full"
          overflow="hidden"
        >
          <Box
            h="100%"
            bg={trend.startsWith('+') ? 'green.400' : 'red.400'}
            w={trend.startsWith('+') ? '75%' : '40%'}
            borderRadius="full"
            transition="width 0.5s ease-in-out"
          />
        </Box>
      )}
    </Box>
  );
};

export default StatCard;