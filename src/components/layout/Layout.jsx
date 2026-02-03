import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
      />
      <Header 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />
      <Box
        as="main"
        ml={sidebarCollapsed ? '70px' : '280px'}
        transition="margin-left 0.3s ease"
        minH="calc(100vh - 60px)"
        p={6}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;