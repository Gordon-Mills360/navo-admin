import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const Layout = ({ children }) => {
  return (
    <Flex minH="100vh" bg="gray.50">
      <Sidebar />
      <Box flex="1" ml={{ base: 0, md: '250px' }} transition="margin 0.3s">
        <TopNav />
        <Box as="main" p={{ base: 4, md: 6 }}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;