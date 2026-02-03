import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Skeleton,
} from '@chakra-ui/react';

const StatCard = ({
  title,
  value,
  icon,
  color = 'brand',
  change,
  trend = 'up',
  isLoading = false,
  subtitle,
  ...props
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <StatArrow type='increase' color='green.500' />;
      case 'down':
        return <StatArrow type='decrease' color='red.500' />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Box
        bg="white"
        p={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
        {...props}
      >
        <Skeleton height="24px" width="60%" mb={4} />
        <Skeleton height="36px" width="40%" mb={2} />
        <Skeleton height="16px" width="80%" />
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      position="relative"
      overflow="hidden"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
        borderColor: `${color}.300`,
      }}
      transition="all 0.3s ease"
      {...props}
    >
      {/* Decorative accent */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="4px"
        bgGradient={`linear(to-r, ${color}.400, ${color}.600)`}
      />
      
      <Flex justify="space-between" align="start" mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
            {title}
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="gray.800">
            {value}
          </Text>
        </Box>
        <Box
          w={12}
          h={12}
          borderRadius="lg"
          bg={`${color}.100`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} boxSize={6} color={`${color}.600`} />
        </Box>
      </Flex>
      
      {change && (
        <Flex align="center" justify="space-between">
          <Text fontSize="xs" color="gray.600">
            {change}
          </Text>
          {getTrendIcon()}
        </Flex>
      )}
      
      {subtitle && (
        <Text fontSize="xs" color="gray.500" mt={2}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
};

export default StatCard;