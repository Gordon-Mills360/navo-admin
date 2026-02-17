import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase'; // Adjust import based on your setup
import {
  Box,
  Spinner,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button
} from '@chakra-ui/react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const redirectToRoleDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Check if user is authenticated
        if (!user) {
          navigate('/login');
          return;
        }

        // 2. Fetch admin profile from database
        const { data: adminProfile, error: profileError } = await supabase
          .from('admins')
          .select('role, status')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching admin profile:', profileError);
          // Sign out on error for security
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }

        // 3. Check if admin is active
        if (adminProfile.status !== 'active') {
          // Sign out suspended users
          await supabase.auth.signOut();
          setError('Account is suspended. Please contact system administrator.');
          return;
        }

        // 4. Redirect based on role (STRICT MATCHING)
        const role = adminProfile.role.trim().toLowerCase();
        
        // Define route mapping - MUST match your router config
        const roleRoutes = {
          'super_admin': '/dashboard/super-admin',
          'finance_admin': '/dashboard/finance',
          'operations_admin': '/dashboard/operations',
          'support_admin': '/dashboard/support',
          'analytics_admin': '/dashboard/analytics',
          'compliance_admin': '/dashboard/compliance'
        };

        const targetRoute = roleRoutes[role];
        
        if (targetRoute) {
          navigate(targetRoute);
        } else {
          // Invalid role - sign out for security
          console.error('Invalid role detected:', role);
          await supabase.auth.signOut();
          setError(`Invalid role configuration. Please contact system administrator.`);
        }
      } catch (err) {
        console.error('Redirect error:', err);
        // Sign out on any unexpected error
        await supabase.auth.signOut();
        setError('An unexpected error occurred. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    redirectToRoleDashboard();
  }, [user, navigate]);

  // Show loading state
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
        bg="gray.50"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.600">Verifying permissions and redirecting...</Text>
        </VStack>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
        bg="gray.50"
        p={4}
      >
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          maxWidth="400px"
          borderRadius="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Access Denied
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
          <Button
            mt={4}
            colorScheme="blue"
            onClick={() => navigate('/login')}
          >
            Return to Login
          </Button>
        </Alert>
      </Box>
    );
  }

  // This should never be reached if redirects work properly
  return null;
};

export default Dashboard;