import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Textarea,
  Button,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useToast,
  Spinner,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, InfoIcon, RepeatIcon, SaveIcon } from '@chakra-ui/icons';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { validateEmail, validatePhone, validateURL, validateRequired } from '../../utils/validators';

const SettingsForm = ({ 
  settings = [], 
  categories = [], 
  onSave, 
  onCancel, 
  loading = false,
  defaultValues = {}
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const toast = useToast();

  // Initialize form data
  useEffect(() => {
    const initialData = {};
    settings.forEach(setting => {
      initialData[setting.id] = setting.value || '';
    });
    setFormData(initialData);
  }, [settings]);

  // Check if form is dirty
  useEffect(() => {
    const dirty = Object.keys(formData).some(key => {
      const setting = settings.find(s => s.id === key);
      if (!setting) return false;
      return formData[key] !== setting.value;
    });
    setIsDirty(dirty);
  }, [formData, settings]);

  const handleInputChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    setTouched(prev => ({ ...prev, [id]: true }));
    
    // Validate on change
    validateField(id, value);
  };

  const validateField = (id, value) => {
    const setting = settings.find(s => s.id === id);
    if (!setting?.validation) return;

    const validation = setting.validation;
    let error = '';

    if (validation.required && !value) {
      error = 'This field is required';
    } else if (validation.type === 'email' && !validateEmail(value)) {
      error = 'Please enter a valid email address';
    } else if (validation.type === 'phone' && !validatePhone(value)) {
      error = 'Please enter a valid phone number';
    } else if (validation.type === 'url' && !validateURL(value)) {
      error = 'Please enter a valid URL';
    } else if (validation.min && Number(value) < validation.min) {
      error = `Minimum value is ${validation.min}`;
    } else if (validation.max && Number(value) > validation.max) {
      error = `Maximum value is ${validation.max}`;
    } else if (validation.minLength && value.length < validation.minLength) {
      error = `Minimum ${validation.minLength} characters required`;
    } else if (validation.maxLength && value.length > validation.maxLength) {
      error = `Maximum ${validation.maxLength} characters allowed`;
    } else if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      error = validation.patternMessage || 'Invalid format';
    }

    setErrors(prev => ({
      ...prev,
      [id]: error
    }));
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    settings.forEach(setting => {
      const value = formData[setting.id];
      validateField(setting.id, value);
      
      if (errors[setting.id]) {
        newErrors[setting.id] = errors[setting.id];
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateAll()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all errors before saving',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const updates = settings
        .filter(setting => formData[setting.id] !== setting.value)
        .map(setting => ({
          id: setting.id,
          value: formData[setting.id],
          previous_value: setting.value
        }));

      if (onSave) {
        await onSave(updates);
      }

      toast({
        title: 'Settings saved',
        description: 'Your changes have been saved successfully',
        status: 'success',
        duration: 3000,
      });

      setIsDirty(false);
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save settings',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleReset = () => {
    const resetData = {};
    settings.forEach(setting => {
      resetData[setting.id] = setting.value || '';
    });
    setFormData(resetData);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  };

  const handleResetToDefaults = () => {
    const resetData = {};
    settings.forEach(setting => {
      resetData[setting.id] = defaultValues[setting.id] || setting.defaultValue || '';
    });
    setFormData(resetData);
    setErrors({});
    setTouched({});
    setIsDirty(true);
  };

  const renderInput = (setting) => {
    const { id, label, type, options = [], description, placeholder } = setting;
    const value = formData[id] || '';
    const error = errors[id];
    const isTouched = touched[id];

    const commonProps = {
      id,
      value,
      onChange: (e) => handleInputChange(id, e.target.value),
      onBlur: () => validateField(id, value),
      placeholder: placeholder || `Enter ${label.toLowerCase()}`,
      isInvalid: isTouched && !!error,
      disabled: loading,
    };

    switch (type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return (
          <Input
            {...commonProps}
            type={type}
          />
        );

      case 'number':
        return (
          <NumberInput value={value} min={setting.validation?.min} max={setting.validation?.max}>
            <NumberInputField
              {...commonProps}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        );

      case 'select':
        return (
          <Select {...commonProps}>
            <option value="">Select {label}</option>
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );

      case 'checkbox':
        return (
          <Switch
            id={id}
            isChecked={Boolean(value)}
            onChange={(e) => handleInputChange(id, e.target.checked)}
            isDisabled={loading}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={setting.rows || 3}
          />
        );

      case 'color':
        return (
          <HStack>
            <Input
              {...commonProps}
              type="color"
              width="60px"
              height="40px"
              padding="2px"
            />
            <Input
              {...commonProps}
              type="text"
              width="120px"
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          </HStack>
        );

      default:
        return <Input {...commonProps} />;
    }
  };

  const renderSetting = (setting) => {
    const { id, label, description, required } = setting;
    const error = errors[id];
    const isTouched = touched[id];

    return (
      <FormControl
        key={id}
        isInvalid={isTouched && !!error}
        isRequired={required}
        mb={4}
      >
        <FormLabel htmlFor={id} fontSize="sm" fontWeight="medium">
          {label}
        </FormLabel>
        {renderInput(setting)}
        {description && !error && (
          <FormHelperText fontSize="xs" color="gray.500">
            {description}
          </FormHelperText>
        )}
        {error && (
          <FormErrorMessage fontSize="xs">
            {error}
          </FormErrorMessage>
        )}
      </FormControl>
    );
  };

  if (!settings.length) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No settings available</Text>
      </Box>
    );
  }

  // Group settings by category
  const settingsByCategory = {};
  categories.forEach(category => {
    settingsByCategory[category] = settings.filter(s => s.category === category);
  });

  return (
    <Card variant="outline" width="100%">
      <CardHeader pb={2}>
        <Heading size="md">System Settings</Heading>
        <Text fontSize="sm" color="gray.500">
          Configure system parameters and business rules
        </Text>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {categories.length > 1 ? (
            <>
              <Tabs 
                variant="enclosed" 
                colorScheme="blue"
                index={activeTab}
                onChange={setActiveTab}
              >
                <TabList overflowX="auto" overflowY="hidden">
                  {categories.map((category, index) => {
                    const categorySettings = settingsByCategory[category] || [];
                    const hasError = categorySettings.some(s => errors[s.id]);
                    return (
                      <Tab key={index} py={3}>
                        <HStack spacing={2}>
                          <Text>{category}</Text>
                          {hasError && (
                            <Icon as={WarningIcon} color="red.500" boxSize={3} />
                          )}
                          <Badge variant="subtle" colorScheme="gray" fontSize="xs">
                            {categorySettings.length}
                          </Badge>
                        </HStack>
                      </Tab>
                    );
                  })}
                </TabList>

                <TabPanels mt={4}>
                  {categories.map((category, index) => (
                    <TabPanel key={index} p={0}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        {settingsByCategory[category]?.map(setting => renderSetting(setting))}
                      </SimpleGrid>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {settings.map(setting => renderSetting(setting))}
            </SimpleGrid>
          )}

          {isDirty && (
            <Alert status="info" variant="subtle" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                You have unsaved changes. Don't forget to save your changes.
              </AlertDescription>
            </Alert>
          )}

          <HStack justify="space-between" pt={4} borderTopWidth="1px" borderTopColor="gray.100">
            <HStack spacing={3}>
              <Button
                leftIcon={<SaveIcon />}
                colorScheme="blue"
                onClick={handleSave}
                isLoading={loading}
                loadingText="Saving"
                isDisabled={!isDirty || loading}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={onCancel || handleReset}
                isDisabled={loading}
              >
                {onCancel ? 'Cancel' : 'Reset'}
              </Button>
            </HStack>

            <Tooltip label="Reset all settings to default values">
              <Button
                leftIcon={<RepeatIcon />}
                variant="ghost"
                size="sm"
                onClick={handleResetToDefaults}
                isDisabled={loading}
              >
                Reset to Defaults
              </Button>
            </Tooltip>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default SettingsForm;