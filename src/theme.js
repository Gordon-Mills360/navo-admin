import { extendTheme } from '@chakra-ui/react';

// Updated with your original brand colors
const colors = {
  brand: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800', // Primary orange/gold
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  secondary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Green
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  // State colors - updated to match your original theme's aesthetic
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  // Gray scale matches your original
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  }
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: '500',
      borderRadius: 'lg',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : 
            props.colorScheme === 'secondary' ? 'secondary.500' : 
            `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : 
               props.colorScheme === 'secondary' ? 'secondary.600' : 
               `${props.colorScheme}.600`,
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
        _active: {
          bg: props.colorScheme === 'brand' ? 'brand.700' : 
               props.colorScheme === 'secondary' ? 'secondary.700' : 
               `${props.colorScheme}.700`,
          transform: 'translateY(0)',
        },
      }),
      outline: (props) => ({
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : 
                    props.colorScheme === 'secondary' ? 'secondary.500' : 
                    `${props.colorScheme}.500`,
        color: props.colorScheme === 'brand' ? 'brand.500' : 
               props.colorScheme === 'secondary' ? 'secondary.500' : 
               `${props.colorScheme}.500`,
        borderWidth: '1.5px',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.50' : 
               props.colorScheme === 'secondary' ? 'secondary.50' : 
               `${props.colorScheme}.50`,
          transform: 'translateY(-1px)',
          boxShadow: 'sm',
        },
      }),
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        borderWidth: '1px',
        borderColor: 'gray.200',
        boxShadow: 'sm',
        overflow: 'hidden',
        _hover: {
          boxShadow: 'md',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s',
        },
      },
      header: {
        py: 4,
        px: 6,
        borderBottomWidth: '1px',
        borderBottomColor: 'gray.100',
        bg: 'white',
      },
      body: {
        p: 6,
      },
      footer: {
        py: 4,
        px: 6,
        borderTopWidth: '1px',
        borderTopColor: 'gray.100',
        bg: 'gray.50',
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      fontWeight: 'semibold',
      px: 3,
      py: 1,
      textTransform: 'capitalize',
    },
    variants: {
      subtle: {
        borderRadius: 'full',
        px: 3,
        py: 1,
      },
    },
  },
  Table: {
    variants: {
      simple: {
        th: {
          color: 'gray.600',
          fontWeight: '600',
          textTransform: 'uppercase',
          fontSize: 'xs',
          letterSpacing: 'wider',
          borderBottomWidth: '2px',
          borderBottomColor: 'gray.200',
        },
        td: {
          borderBottomWidth: '1px',
          borderBottomColor: 'gray.100',
        },
        tr: {
          _hover: {
            bg: 'gray.50',
          },
        },
      },
    },
  },
};

const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
      fontFeatureSettings: "'ss01', 'ss02', 'cv01', 'cv02'",
      fontVariantNumeric: 'tabular-nums',
    },
    '::-webkit-scrollbar': {
      width: '10px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'gray.100',
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'brand.300',
      borderRadius: 'full',
      _hover: {
        bg: 'brand.400',
      },
    },
  },
};

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
  mono: `'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`,
};

const theme = extendTheme({
  colors,
  components,
  styles,
  config,
  fonts,
});

export default theme;