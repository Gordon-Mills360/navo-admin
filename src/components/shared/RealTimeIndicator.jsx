import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
  Spinner,
  VStack,
  Progress,
  Alert,
  AlertIcon,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Portal
} from '@chakra-ui/react';
import {
  RepeatIcon,
  CheckIcon,
  CloseIcon,
  WarningIcon,
  TimeIcon,
  SettingsIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DownloadIcon,
  UploadIcon
} from '@chakra-ui/icons';
import {
  FaWifi,
  FaSignal,
  FaRegCircle,
  FaCircle,
  FaSync,
  FaSyncAlt,
  FaRedo,
  FaCloud,
  FaServer,
  FaDatabase,
  FaNetworkWired,
  FaMicrochip,
  FaMemory,
  FaHdd,
  FaDesktop,
  FaLaptop,
  FaMobileAlt,
  FaTabletAlt,
  FaGlobe,
  FaGlobeAmericas,
  FaSatellite,
  FaSatelliteDish,
  FaBroadcastTower,
  FaTowerCell,
  FaSignalPerfect,
  FaSignalAlt,
  FaSignalAltSlash,
  FaWifiStrong,
  FaWifiWeak,
  FaPlug,
  FaBolt,
  FaBatteryFull,
  FaBatteryHalf,
  FaBatteryEmpty,
  FaBatteryQuarter,
  FaBatteryThreeQuarters,
  FaThermometerHalf,
  FaThermometerFull,
  FaThermometerEmpty,
  FaThermometerQuarter,
  FaThermometerThreeQuarters,
  FaTachometerAlt,
  FaTachometerAltFast,
  FaTachometerAltAverage,
  FaTachometerAltSlow,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaChartArea,
  FaCogs,
  FaCog,
  FaUserCog,
  FaUsersCog,
  FaRobot,
  FaMagic,
  FaKeyboard,
  FaMousePointer,
  FaHandPointer,
  FaMouse,
  FaKeyboard as FaKeyboardIcon,
  FaHeadset,
  FaPhone,
  FaPhoneAlt,
  FaVoicemail,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeOff,
  FaBell,
  FaBellSlash,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfoCircle,
  FaQuestionCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaLock,
  FaUnlock,
  FaShieldAlt,
  FaUserShield,
  FaUserLock,
  FaUserSecret,
  FaUserNinja,
  FaUserAstronaut,
  FaUserAstronaut as FaUserAstronautIcon,
  FaUserMd,
  FaUserInjured,
  FaUserGraduate,
  FaUserTie,
  FaUserEdit,
  FaUserPlus,
  FaUserMinus,
  FaUserTag,
  FaUserFriends,
  FaUserCircle,
  FaUserAlt,
  FaIdCard,
  FaIdCardAlt,
  FaAddressCard,
  FaAddressBook,
  FaEnvelope,
  FaEnvelopeOpen,
  FaPaperPlane,
  FaInbox,
  FaArchive,
  FaTrashAlt,
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaFileAlt,
  FaFileArchive,
  FaFileCode,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileWord,
  FaFilePowerpoint,
  FaFileExcel,
  FaFilePdf,
  FaFileSignature,
  FaFileContract,
  FaFileMedical,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaFileUpload,
  FaFileDownload,
  FaFileImport,
  FaFileExport,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaSync as FaSyncIcon,
  FaSyncAlt as FaSyncAltIcon,
  FaRedoAlt,
  FaUndoAlt,
  FaRandom,
  FaRetweet,
  FaExchangeAlt,
  FaShuffle,
  FaRandom as FaRandomIcon,
  FaNetworkWired as FaNetworkWiredIcon,
  FaServer as FaServerIcon,
  FaDatabase as FaDatabaseIcon,
  FaHdd as FaHddIcon,
  FaMemory as FaMemoryIcon,
  FaMicrochip as FaMicrochipIcon,
  FaMicroprocessor as FaMicroprocessorIcon,
  FaDesktop as FaDesktopIcon,
  FaLaptop as FaLaptopIcon,
  FaTabletAlt as FaTabletAltIcon,
  FaMobileAlt as FaMobileAltIcon,
  FaMobile as FaMobileIcon,
  FaPhoneSquare,
  FaPhoneSquareAlt,
  FaChartBar as FaChartBarIcon,
  FaChartPie as FaChartPieIcon,
  FaChartArea as FaChartAreaIcon,
  FaLineChart as FaLineChartIcon,
  FaBarChart as FaBarChartIcon,
  FaPieChart as FaPieChartIcon,
  FaAreaChart as FaAreaChartIcon,
  FaChartBar as FaChartBarIcon2
} from 'react-icons/fa';

// Services
import { supabase } from '../../services/supabase';
import { useRealTime } from '../../contexts/RealTimeContext';

const RealTimeIndicator = ({
  isLive = true,
  lastUpdated,
  refreshFunction,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showDetails = false,
  compact = false,
  ...props
}) => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastRefresh, setLastRefresh] = useState(lastUpdated || new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [connectionStats, setConnectionStats] = useState({
    latency: 0,
    uptime: 100,
    subscriptions: 0,
    errors: 0
  });

  const { connectionState, subscriptions, reconnect } = useRealTime();
  
  // Color values
  const onlineColor = useColorModeValue('green.500', 'green.300');
  const offlineColor = useColorModeValue('red.500', 'red.300');
  const connectingColor = useColorModeValue('yellow.500', 'yellow.300');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Get connection status from context
  useEffect(() => {
    setConnectionStatus(connectionState);
  }, [connectionState]);

  // Auto refresh timer
  useEffect(() => {
    let interval;
    
    if (autoRefreshEnabled && refreshFunction && connectionStatus === 'connected') {
      interval = setInterval(() => {
        handleManualRefresh();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefreshEnabled, refreshFunction, refreshInterval, connectionStatus]);

  // Simulate connection stats (in production, these would come from WebSocket/Ping)
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStats(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 100) + 20, // 20-120ms
        subscriptions: subscriptions.length,
        uptime: 99.9 + Math.random() * 0.1 // 99.9-100%
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [subscriptions]);

  const handleManualRefresh = useCallback(async () => {
    if (!refreshFunction || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshFunction();
      setLastRefresh(new Date());
      setRefreshCount(prev => prev + 1);
      
      // Log refresh
      await supabase.from('system_logs').insert({
        type: 'refresh',
        message: 'Manual data refresh',
        metadata: {
          component: 'RealTimeIndicator',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      setConnectionStats(prev => ({ ...prev, errors: prev.errors + 1 }));
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFunction, isRefreshing]);

  const handleReconnect = useCallback(async () => {
    if (reconnect) {
      await reconnect();
    }
  }, [reconnect]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  // Format time difference
  const formatTimeDiff = (date) => {
    if (!date) return 'Never';
    
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Get status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return onlineColor;
      case 'disconnected': return offlineColor;
      case 'connecting': return connectingColor;
      default: return 'gray.500';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <FaCircle color={onlineColor} />;
      case 'disconnected': return <FaRegCircle color={offlineColor} />;
      case 'connecting': return <Spinner size="sm" color={connectingColor} />;
      default: return <FaRegCircle color="gray.500" />;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'disconnected': return 'Offline';
      case 'connecting': return 'Connecting';
      default: return 'Unknown';
    }
  };

  // Get latency color
  const getLatencyColor = (latency) => {
    if (latency < 50) return 'green.500';
    if (latency < 100) return 'yellow.500';
    if (latency < 200) return 'orange.500';
    return 'red.500';
  };

  // Get uptime color
  const getUptimeColor = (uptime) => {
    if (uptime >= 99.9) return 'green.500';
    if (uptime >= 99) return 'yellow.500';
    if (uptime >= 95) return 'orange.500';
    return 'red.500';
  };

  if (compact) {
    return (
      <Tooltip label={`${getStatusText()} • Last updated: ${formatTimeDiff(lastRefresh)}`}>
        <HStack spacing={2} {...props}>
          <Box>{getStatusIcon()}</Box>
          <Text fontSize="sm" color="gray.500">
            {getStatusText()}
          </Text>
          {isRefreshing && <Spinner size="xs" />}
        </HStack>
      </Tooltip>
    );
  }

  return (
    <Box {...props}>
      <HStack spacing={4} p={3} bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md">
        {/* Status Indicator */}
        <HStack spacing={2}>
          <Box>{getStatusIcon()}</Box>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" fontSize="sm">
              {getStatusText()}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {formatTimeDiff(lastRefresh)}
            </Text>
          </VStack>
        </HStack>

        {/* Refresh Controls */}
        <HStack spacing={2}>
          <Tooltip label={isRefreshing ? "Refreshing..." : "Refresh now"}>
            <IconButton
              size="sm"
              icon={<RepeatIcon />}
              aria-label="Refresh"
              onClick={handleManualRefresh}
              isLoading={isRefreshing}
              isDisabled={!refreshFunction || connectionStatus !== 'connected'}
              variant="ghost"
            />
          </Tooltip>

          <Tooltip label={autoRefreshEnabled ? "Auto-refresh enabled" : "Auto-refresh disabled"}>
            <IconButton
              size="sm"
              icon={<FaSyncAlt />}
              aria-label="Toggle auto-refresh"
              onClick={toggleAutoRefresh}
              colorScheme={autoRefreshEnabled ? 'green' : 'gray'}
              variant={autoRefreshEnabled ? 'solid' : 'ghost'}
              isDisabled={!refreshFunction || connectionStatus !== 'connected'}
            />
          </Tooltip>
        </HStack>

        {/* Connection Stats */}
        {showDetails && (
          <HStack spacing={4}>
            <Tooltip label="Network latency">
              <HStack spacing={1}>
                <FaSignal color={getLatencyColor(connectionStats.latency)} />
                <Text fontSize="xs">{connectionStats.latency}ms</Text>
              </HStack>
            </Tooltip>

            <Tooltip label="System uptime">
              <HStack spacing={1}>
                <FaServer color={getUptimeColor(connectionStats.uptime)} />
                <Text fontSize="xs">{connectionStats.uptime.toFixed(1)}%</Text>
              </HStack>
            </Tooltip>

            <Tooltip label="Active subscriptions">
              <HStack spacing={1}>
                <FaDatabase color="blue.500" />
                <Text fontSize="xs">{connectionStats.subscriptions}</Text>
              </HStack>
            </Tooltip>
          </HStack>
        )}

        {/* Reconnect Button for disconnected state */}
        {connectionStatus === 'disconnected' && (
          <Button
            size="sm"
            leftIcon={<FaRedo />}
            colorScheme="red"
            variant="solid"
            onClick={handleReconnect}
          >
            Reconnect
          </Button>
        )}

        {/* Settings Menu */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<SettingsIcon />} variant="ghost" />
          <Portal>
            <MenuList>
              <MenuItem icon={<RepeatIcon />} onClick={handleManualRefresh} isDisabled={!refreshFunction}>
                Refresh Now
              </MenuItem>
              <MenuItem
                icon={<FaSyncAlt />}
                onClick={toggleAutoRefresh}
                closeOnSelect={false}
              >
                {autoRefreshEnabled ? 'Disable' : 'Enable'} Auto-Refresh
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FaRedo />} onClick={handleReconnect} isDisabled={connectionStatus === 'connected'}>
                Reconnect
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FaChartLine />} onClick={() => {/* Open connection stats */}}>
                View Connection Stats
              </MenuItem>
              <MenuItem icon={<FaCog />} onClick={() => {/* Open settings */}}>
                Connection Settings
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </HStack>

      {/* Connection Status Details */}
      {connectionStatus === 'disconnected' && (
        <Alert status="error" mt={2} borderRadius="md" size="sm">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">Connection Lost</Text>
            <Text fontSize="sm">Attempting to reconnect...</Text>
          </Box>
          <Button size="sm" colorScheme="red" variant="solid" onClick={handleReconnect}>
            Reconnect Now
          </Button>
        </Alert>
      )}

      {connectionStatus === 'connecting' && (
        <Alert status="warning" mt={2} borderRadius="md" size="sm">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">Connecting...</Text>
            <Text fontSize="sm">Establishing real-time connection</Text>
          </Box>
          <Progress size="xs" isIndeterminate flex="1" maxW="200px" />
        </Alert>
      )}

      {/* Auto-refresh status */}
      {autoRefreshEnabled && refreshFunction && (
        <Box mt={2}>
          <Progress
            value={0}
            size="xs"
            isIndeterminate
            colorScheme="green"
            borderRadius="full"
          />
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
            Auto-refresh enabled ({refreshInterval / 1000}s interval)
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default RealTimeIndicator;