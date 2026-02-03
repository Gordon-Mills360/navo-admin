/**
 * Admin Finance Dashboard
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalanceWallet,
  People,
  AttachMoney,
  PendingActions,
  CreditCard,
} from '@mui/icons-material';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import AdminLayout from '../../../components/layout/AdminLayout';

const DashboardScreen = () => {
  const { admin, api } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/finance/dashboard');
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `GH₵ ${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <AdminLayout title="Finance Dashboard">
        <LinearProgress />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Finance Dashboard">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchDashboardData}>
          Retry
        </Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Finance Dashboard">
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWallet color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Platform Balance</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(dashboardData?.platformBalance?.balance)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available: {formatCurrency(dashboardData?.platformBalance?.available_balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingActions color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Withdrawals</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {dashboardData?.pendingWithdrawals || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requires approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Revenue</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(dashboardData?.todayRevenue || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {formatCurrency(dashboardData?.todayTotal || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Drivers</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {dashboardData?.activeDrivers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Online now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Payment Method Breakdown
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CreditCard color="primary" sx={{ mr: 1 }} />
                <Typography>Online Payments</Typography>
              </Box>
              <Typography variant="h5">
                {formatCurrency(dashboardData?.paymentBreakdown?.online || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardData?.paymentBreakdown?.online > 0
                  ? `${Math.round(
                      (dashboardData.paymentBreakdown.online /
                        (dashboardData.paymentBreakdown.online +
                          dashboardData.paymentBreakdown.cash)) *
                        100
                    )}% of total`
                  : 'No online payments'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography>Cash Payments</Typography>
              </Box>
              <Typography variant="h5">
                {formatCurrency(dashboardData?.paymentBreakdown?.cash || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardData?.paymentBreakdown?.cash > 0
                  ? `${Math.round(
                      (dashboardData.paymentBreakdown.cash /
                        (dashboardData.paymentBreakdown.online +
                          dashboardData.paymentBreakdown.cash)) *
                        100
                    )}% of total`
                  : 'No cash payments'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/admin/finance/withdrawals"
                startIcon={<PendingActions />}
              >
                Manage Withdrawals
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/admin/finance/reports"
                startIcon={<TrendingUp />}
              >
                View Reports
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/admin/finance/commission"
                startIcon={<AttachMoney />}
              >
                Commission Settings
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/admin/finance/ledger"
                startIcon={<AccountBalanceWallet />}
              >
                View Ledger
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default DashboardScreen;