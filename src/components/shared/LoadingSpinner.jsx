import React from 'react';
import {
  Box,
  Flex,
  Spinner,
  Text,
  VStack,
  HStack,
  keyframes,
  useColorModeValue
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const progress = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

const LoadingSpinner = ({
  size = 'md',
  color = 'blue.500',
  text = '',
  fullPage = false,
  variant = 'spinner',
  showIcon = true,
  isCentered = true,
  backgroundColor,
  backdropBlur = 'sm'
}) => {
  const sizes = {
    xs: { spinner: '16px', text: 'xs' },
    sm: { spinner: '20px', text: 'sm' },
    md: { spinner: '24px', text: 'md' },
    lg: { spinner: '32px', text: 'lg' },
    xl: { spinner: '48px', text: 'xl' }
  };

  const currentSize = sizes[size] || sizes.md;
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  const finalBackgroundColor = backgroundColor || bgColor;

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <HStack spacing={1}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                width="8px"
                height="8px"
                borderRadius="full"
                bg={color}
                animation={`${pulse} 1.4s ease-in-out ${i * 0.16}s infinite`}
              />
            ))}
          </HStack>
        );

      case 'progress':
        return (
          <Box width="100%" maxW="200px">
            <Box
              width="100%"
              height="4px"
              bg="gray.200"
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                width="100%"
                height="100%"
                bg={color}
                borderRadius="full"
                animation={`${progress} 2s ease-in-out infinite`}
              />
            </Box>
          </Box>
        );

      case 'success':
        return (
          <CheckCircleIcon
            boxSize={currentSize.spinner}
            color="green.500"
          />
        );

      case 'spinner':
      default:
        return (
          <Spinner
            size={size}
            color={color}
            thickness="3px"
            speed="0.65s"
            emptyColor="gray.200"
          />
        );
    }
  };

  const content = (
    <VStack spacing={3}>
      {showIcon && renderSpinner()}
      {text && (
        <Text
          fontSize={currentSize.text}
          color="gray.600"
          fontWeight="medium"
          textAlign="center"
        >
          {text}
        </Text>
      )}
    </VStack>
  );

  if (fullPage) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        bg={finalBackgroundColor}
        backdropFilter={`blur(${backdropBlur})`}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {content}
      </Box>
    );
  }

  if (isCentered) {
    return (
      <Flex
        width="100%"
        height="100%"
        minHeight="100px"
        alignItems="center"
        justifyContent="center"
      >
        {content}
      </Flex>
    );
  }

  return content;
};

// Button Loading Spinner Variant
export const ButtonSpinner = ({ size = 'sm', color = 'currentColor' }) => (
  <Spinner
    size={size}
    color={color}
    thickness="2px"
    speed="0.65s"
    emptyColor="transparent"
  />
);

// Inline Loading Variant
export const InlineSpinner = ({ size = 'sm', color = 'blue.500', text = '' }) => (
  <HStack spacing={2} display="inline-flex">
    <Spinner
      size={size}
      color={color}
      thickness="2px"
      speed="0.65s"
      emptyColor="gray.200"
    />
    {text && <Text fontSize="sm" color="gray.600">{text}</Text>}
  </HStack>
);

// Skeleton Loading Variant
export const SkeletonLoader = ({ lines = 3, spacing = 2 }) => (
  <VStack spacing={spacing} align="stretch" width="100%">
    {Array.from({ length: lines }).map((_, i) => (
      <Box
        key={i}
        height="20px"
        bg="gray.100"
        borderRadius="md"
        animation={`${pulse} 1.5s ease-in-out infinite`}
        opacity={0.8 - (i * 0.1)}
      />
    ))}
  </VStack>
);

export default LoadingSpinner;
export { ButtonSpinner, InlineSpinner, SkeletonLoader };