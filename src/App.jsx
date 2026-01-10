import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { supabase } from './services/supabase.js';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Drivers from './pages/Drivers.jsx';
import Rides from './pages/Rides.jsx';
import Payments from './pages/Payments.jsx';
import Login from './pages/Login.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

// Import Settings Pages
import PlatformSettings from './pages/Settings/PlatformSettings.jsx';
import RolesPermissions from './pages/Settings/RolesPermissions.jsx';
import DriverRules from './pages/Settings/DriverRules.jsx';
import PaymentSettings from './pages/Settings/PaymentSettings.jsx';
import SecuritySettings from './pages/Settings/SecuritySettings.jsx';
import Notifications from './pages/Settings/Notifications.jsx';
import AuditLogs from './pages/Settings/AuditLogs.jsx';

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdminStatus(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        checkAdminStatus(session);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          navigate('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (session) => {
    if (!session) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      // Define all admin roles that should have dashboard access
      const adminRoles = ['admin', 'super_admin', 'support', 'finance', 'viewer'];
      
      if (data && adminRoles.includes(data.role)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <LoadingSpinner />
      </Box>
    );
  }

  if (!session || !isAdmin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/payments" element={<Payments />} />
        
        {/* Settings Routes */}
        <Route path="/admin/settings/platform" element={<PlatformSettings />} />
        <Route path="/admin/settings/roles" element={<RolesPermissions />} />
        <Route path="/admin/settings/drivers" element={<DriverRules />} />
        <Route path="/admin/settings/payments" element={<PaymentSettings />} />
        <Route path="/admin/settings/security" element={<SecuritySettings />} />
        <Route path="/admin/settings/notifications" element={<Notifications />} />
        <Route path="/admin/settings/audit" element={<AuditLogs />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;