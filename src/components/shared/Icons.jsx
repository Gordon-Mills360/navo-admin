import React from 'react';
import { 
  ViewIcon, 
  SettingsIcon, 
  ChatIcon, 
  BellIcon,
  ChevronRightIcon,
  SearchIcon,
  ArrowBackIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  DeleteIcon,
  DownloadIcon,
  PlusSquareIcon,
  MinusIcon,
  StarIcon,
  TimeIcon,
  CalendarIcon,
  InfoIcon,
  WarningIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExternalLinkIcon,
  CopyIcon,
  LockIcon,
  UnlockIcon,
  RefreshIcon,
  FilterIcon,
  HamburgerIcon,
  SunIcon,
  MoonIcon,
  EmailIcon,
  PhoneIcon,
  AttachmentIcon,
  AtSignIcon,
  DragHandleIcon,
  RepeatIcon,
  RepeatClockIcon,
  CheckCircleIcon,
  NotAllowedIcon,
  SpinnerIcon,
  UpDownIcon,
  AddIcon,
  MinusSquareIcon,
  QuestionIcon,
  QuestionOutlineIcon,
  InfoOutlineIcon,
  WarningTwoIcon,
  ArrowForwardIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SmallAddIcon,
  SmallCloseIcon,
  TriangleUpIcon,
  TriangleDownIcon
} from '@chakra-ui/icons';

// Custom icon components
export const UsersIcon = ViewIcon;
export const DollarSignIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c0 1.8-1.39 2.83-3.13 3.16z"/>
  </svg>
);

export const ActivityIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zm-2 0c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8 8-3.58 8-8zm-9 5l5-5-5-5v10z"/>
  </svg>
);

export const ShieldIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

export const AlertTriangleIcon = WarningTwoIcon;
export const BarChartIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
  </svg>
);

export const MessageSquareIcon = ChatIcon;
export const EyeIcon = ViewIcon;
export const NavigationIcon = ArrowForwardIcon;
export const ClockIcon = TimeIcon;
export const MapIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
  </svg>
);

export const CreditCardIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

export const BriefcaseIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
  </svg>
);

export const FileTextIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

export const KeyIcon = LockIcon;
export const HomeIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

// Export all icons
export {
  ViewIcon,
  SettingsIcon,
  ChatIcon,
  BellIcon,
  ChevronRightIcon,
  SearchIcon,
  ArrowBackIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  DeleteIcon,
  DownloadIcon,
  PlusSquareIcon,
  MinusIcon,
  StarIcon,
  TimeIcon,
  CalendarIcon,
  InfoIcon,
  WarningIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExternalLinkIcon,
  CopyIcon,
  LockIcon,
  UnlockIcon,
  RefreshIcon,
  FilterIcon,
  HamburgerIcon,
  SunIcon,
  MoonIcon,
  EmailIcon,
  PhoneIcon,
  AttachmentIcon,
  AtSignIcon,
  DragHandleIcon,
  RepeatIcon,
  RepeatClockIcon,
  CheckCircleIcon,
  NotAllowedIcon,
  SpinnerIcon,
  UpDownIcon,
  AddIcon,
  MinusSquareIcon,
  QuestionIcon,
  QuestionOutlineIcon,
  InfoOutlineIcon,
  WarningTwoIcon,
  ArrowForwardIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SmallAddIcon,
  SmallCloseIcon,
  TriangleUpIcon,
  TriangleDownIcon
};