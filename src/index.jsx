import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme'; // ← Import our custom theme
import './index.css';
import App from './App.jsx';
import { SessionProvider } from "./contexts/SessionContext.js";

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Create root and render
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <SessionProvider>
      <ChakraProvider theme={theme}> {/* ← Add theme prop here */}
        <App />
      </ChakraProvider>
    </SessionProvider>
  </React.StrictMode>
);