import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { Download, Filter, BarChart3, PieChart, Map, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('7d');
  const [selectedCity, setSelectedCity] = useState('all');

  // Mock data - replace with API calls
  const coreMetrics = [
    { title: 'Total Rides', value: '12,847', change: '+12%', icon: <TrendingUp /> },
    { title: 'Completed Rides', value: '10,234', change: '+8%', icon: <BarChart3 /> },
    { title: 'Cancelled Rides', value: '1,234', change: '-3%', icon: <PieChart /> },
    { title: 'Active Drivers', value: '2,847', change: '+5%', icon: <Map /> },
    { title: 'Active Passengers', value: '15,234', change: '+15%', icon: <TrendingUp /> },
    { title: 'Total Revenue', value: '$245,231', change: '+18%', icon: <BarChart3 /> },
    { title: 'Cash Rides', value: '$45,231', change: '-2%', icon: <PieChart /> },
    { title: 'Commission', value: '$36,784', change: '+22%', icon: <TrendingUp /> },
    { title: 'Driver Earnings', value: '$163,216', change: '+16%', icon: <BarChart3 /> },
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'custom', label: 'Custom range' },
  ];

  const cities = [
    { value: 'all', label: 'All Cities' },
    { value: 'city1', label: 'City 1' },
    { value: 'city2', label: 'City 2' },
    { value: 'city3', label: 'City 3' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Deep analysis workspace for {user?.name || 'Admin'}. Role: {user?.role || 'Unknown'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Button */}
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>

          {/* Export Button */}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Core Metrics</TabsTrigger>
          <TabsTrigger value="time">Time Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="finance">Payment & Finance</TabsTrigger>
          <TabsTrigger value="geo">Geo Analytics</TabsTrigger>
        </TabsList>

        {/* SECTION A: Core Metrics */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coreMetrics.map((metric, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <div className="text-muted-foreground">{metric.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className={metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      {metric.change}
                    </span>{' '}
                    from previous period
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SECTION B: Time-based Analytics */}
        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rides Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Rides over time chart</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Revenue over time chart</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SECTION C: Operational Analytics */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                    <div>
                      <p className="font-medium">Driver {i}</p>
                      <p className="text-sm text-muted-foreground">ID: DRV-00{i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{500 - i * 50} rides</p>
                      <p className="text-sm text-muted-foreground">${(5000 - i * 500).toLocaleString()} earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION D: Payment & Finance Analytics */}
        <TabsContent value="finance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Finance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Wallet Flows</h3>
                  <p className="text-sm text-muted-foreground">Inflows: $234,567</p>
                  <p className="text-sm text-muted-foreground">Outflows: $198,432</p>
                  <p className="text-sm text-muted-foreground">Net: +$36,135</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Withdrawals</h3>
                  <p className="text-sm text-muted-foreground">Pending: $12,345</p>
                  <p className="text-sm text-muted-foreground">Approved: $89,012</p>
                  <p className="text-sm text-muted-foreground">Rejected: $1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION E: Geo Analytics */}
        <TabsContent value="geo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ride Density Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Geographical heatmap visualization</p>
                <p className="text-sm">Integration with mapping library needed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;