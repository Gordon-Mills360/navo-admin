import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// Import all required contexts
import { AuthProvider } from './contexts/AuthContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { RealTimeProvider } from './contexts/RealTimeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SessionProvider } from './contexts/SessionContext';

// Import theme
import theme from './theme';

// Set up error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    // You can log to error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f7fafc'
        }}>
          <h1 style={{ color: '#e53e3e', marginBottom: '20px', fontSize: '24px' }}>Something went wrong</h1>
          <p style={{ color: '#718096', marginBottom: '30px', maxWidth: '500px' }}>
            The application encountered an error. Please refresh the page or contact support.
          </p>
          {this.state.error && (
            <div style={{
              backgroundColor: '#fed7d7',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px',
              maxWidth: '500px',
              overflow: 'auto',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              <strong>Error details:</strong>
              <div style={{ marginTop: '8px' }}>{this.state.error.toString()}</div>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize Supabase connection check
const initializeApp = async () => {
  try {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables are not configured');
      console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    // Render the app with all providers
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ChakraProvider theme={theme}>
            <BrowserRouter>
              <AuthProvider>
                <SessionProvider>
                  <PermissionProvider>
                    <RealTimeProvider>
                      <NotificationProvider>
                        <App />
                      </NotificationProvider>
                    </RealTimeProvider>
                  </PermissionProvider>
                </SessionProvider>
              </AuthProvider>
            </BrowserRouter>
          </ChakraProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error screen
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f7fafc'
      }}>
        <h1 style={{ color: '#e53e3e', marginBottom: '20px', fontSize: '24px' }}>Initialization Error</h1>
        <p style={{ color: '#718096', marginBottom: '30px', maxWidth: '500px' }}>
          Failed to initialize the application. Please check your configuration.
        </p>
        <div style={{
          backgroundColor: '#fed7d7',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '30px',
          maxWidth: '500px',
          overflow: 'auto'
        }}>
          <strong style={{ color: '#c53030' }}>Error details:</strong>
          <p style={{ 
            color: '#c53030', 
            fontFamily: 'monospace', 
            fontSize: '14px',
            marginTop: '8px',
            wordBreak: 'break-word'
          }}>
            {error.message}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Retry
        </button>
      </div>
    );
  }
};

// Start the application
initializeApp();

// Register service worker for PWA (optional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(error => {
      console.log('ServiceWorker registration failed:', error);
    });
  });
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Don't show error UI for resource loading errors
  if (event.error && !event.error.toString().includes('Loading')) {
    // Could send to error tracking service
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent default browser error handling
  event.preventDefault();
});