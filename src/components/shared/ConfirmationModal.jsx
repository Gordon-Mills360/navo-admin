import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import {
  WarningIcon,
  CheckCircleIcon,
  InfoIcon,
  DeleteIcon,
  CloseIcon
} from '@chakra-ui/icons';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  type = 'confirm',
  isLoading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColorScheme = 'blue',
  size = 'md',
  showCloseButton = true,
  children
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'delete':
        return {
          icon: DeleteIcon,
          color: 'red',
          headerColor: 'red.500',
          confirmColorScheme: 'red'
        };
      case 'warning':
        return {
          icon: WarningIcon,
          color: 'orange',
          headerColor: 'orange.500',
          confirmColorScheme: 'orange'
        };
      case 'success':
        return {
          icon: CheckCircleIcon,
          color: 'green',
          headerColor: 'green.500',
          confirmColorScheme: 'green'
        };
      case 'info':
        return {
          icon: InfoIcon,
          color: 'blue',
          headerColor: 'blue.500',
          confirmColorScheme: 'blue'
        };
      default:
        return {
          icon: InfoIcon,
          color: 'blue',
          headerColor: 'blue.500',
          confirmColorScheme: 'blue'
        };
    }
  };

  const { icon: IconComponent, color, headerColor, confirmColorScheme: typeColorScheme } = getTypeConfig();
  const finalConfirmColorScheme = confirmColorScheme || typeColorScheme;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      isCentered
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent bg={bgColor} border="1px" borderColor={borderColor}>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={IconComponent} color={headerColor} boxSize={5} />
            <Text>{title}</Text>
          </HStack>
        </ModalHeader>
        
        {showCloseButton && !isLoading && <ModalCloseButton />}
        
        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            {type === 'warning' || type === 'delete' ? (
              <Alert status={type === 'delete' ? 'error' : 'warning'} variant="subtle" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : (
              <Text color={useColorModeValue('gray.700', 'gray.300')}>
                {message}
              </Text>
            )}
            
            {children && (
              <Alert status="info" variant="subtle" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <AlertDescription>{children}</AlertDescription>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={onClose}
              isDisabled={isLoading}
              leftIcon={<CloseIcon />}
            >
              {cancelText}
            </Button>
            <Button
              colorScheme={finalConfirmColorScheme}
              onClick={onConfirm}
              isLoading={isLoading}
              loadingText={type === 'delete' ? 'Deleting...' : 'Processing...'}
              leftIcon={<IconComponent />}
            >
              {confirmText}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationModal;