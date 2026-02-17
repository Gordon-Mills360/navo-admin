import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { RealTimeProvider } from './contexts/RealTimeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import theme from './theme';
import AppRoutes from './routes/AppRoutes';
import './styles/global.css';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <SessionProvider>
            <PermissionProvider>
              <RealTimeProvider>
                <NotificationProvider>
                  <AppRoutes />
                </NotificationProvider>
              </RealTimeProvider>
            </PermissionProvider>
          </SessionProvider>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;