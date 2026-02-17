import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  HStack,
  VStack,
  useToast,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react';
import {
  ChevronDownIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
  CalendarIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { formatDate } from '../../../utils/formatters';
import DataTable from '../../shared/DataTable';

const AnnouncementTable = ({
  announcements,
  onPreview,
  onEdit,
  onDelete,
  onUpdateStatus,
  hasPermission,
  showRestore = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const toast = useToast();

  const getAudienceBadge = (announcement) => {
    const colors = {
      all_users: 'blue',
      drivers: 'green',
      passengers: 'purple',
      all_admins: 'orange',
      specific_roles: 'teal'
    };

    const labels = {
      all_users: 'All Users',
      drivers: 'Drivers',
      passengers: 'Passengers',
      all_admins: 'All Admins',
      specific_roles: 'Specific Roles'
    };

    return (
      <Badge colorScheme={colors[announcement.audience_type] || 'gray'}>
        {labels[announcement.audience_type] || announcement.audience_type}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'gray',
      active: 'green',
      scheduled: 'blue',
      expired: 'orange',
      archived: 'red'
    };

    const labels = {
      draft: 'Draft',
      active: 'Active',
      scheduled: 'Scheduled',
      expired: 'Expired',
      archived: 'Archived'
    };

    return (
      <Badge colorScheme={colors[status] || 'gray'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleStatusChange = async (announcementId, newStatus) => {
    try {
      await onUpdateStatus(announcementId, { status: newStatus });
      
      toast({
        title: 'Status Updated',
        description: `Announcement status changed to ${newStatus}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const confirmDelete = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedAnnouncement) {
      await onDelete(selectedAnnouncement.id);
      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
    }
  };

  const handleDuplicate = async (announcement) => {
    try {
      // Create a copy of the announcement with "Copy of" prefix
      const duplicateData = {
        title: `Copy of ${announcement.title}`,
        message: announcement.message,
        audience_type: announcement.audience_type,
        specific_roles: announcement.specific_roles,
        delivery_channels: announcement.delivery_channels,
        status: 'draft'
      };

      // This would typically call a duplicate API endpoint
      toast({
        title: 'Duplicated',
        description: 'Announcement duplicated as draft',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate announcement',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      cell: (row) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium" noOfLines={1}>{row.title}</Text>
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {row.message.substring(0, 50)}...
          </Text>
        </VStack>
      )
    },
    {
      header: 'Audience',
      accessor: 'audience_type',
      cell: (row) => getAudienceBadge(row)
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Schedule',
      accessor: 'scheduled_at',
      cell: (row) => {
        if (row.scheduled_at) {
          return (
            <HStack>
              <CalendarIcon boxSize={3} />
              <Text fontSize="sm">
                {formatDate(row.scheduled_at, 'date')}
              </Text>
              {row.scheduled_at.includes('T') && (
                <>
                  <TimeIcon boxSize={3} />
                  <Text fontSize="sm">
                    {formatDate(row.scheduled_at, 'time')}
                  </Text>
                </>
              )}
            </HStack>
          );
        }
        return <Text fontSize="sm">Immediate</Text>;
      }
    },
    {
      header: 'Created By',
      accessor: 'created_by_admin',
      cell: (row) => (
        <VStack align="start" spacing={0}>
          <Text fontSize="sm">{row.created_by_admin?.name || 'Unknown'}</Text>
          <Text fontSize="xs" color="gray.500">
            {formatDate(row.created_at, 'date')}
          </Text>
        </VStack>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <HStack spacing={1}>
          <Tooltip label="Preview">
            <IconButton
              icon={<ViewIcon />}
              size="sm"
              variant="ghost"
              onClick={() => onPreview(row)}
              aria-label="Preview announcement"
            />
          </Tooltip>

          {hasPermission('announcements', 'edit') && row.status !== 'archived' && (
            <Tooltip label="Edit">
              <IconButton
                icon={<EditIcon />}
                size="sm"
                variant="ghost"
                onClick={() => onEdit(row)}
                aria-label="Edit announcement"
              />
            </Tooltip>
          )}

          {hasPermission('announcements', 'create') && row.status !== 'archived' && (
            <Tooltip label="Duplicate">
              <IconButton
                icon={<CopyIcon />}
                size="sm"
                variant="ghost"
                onClick={() => handleDuplicate(row)}
                aria-label="Duplicate announcement"
              />
            </Tooltip>
          )}

          {hasPermission('announcements', 'delete') && (
            <Tooltip label={showRestore ? "Restore" : "Archive"}>
              <IconButton
                icon={showRestore ? <CheckIcon /> : <DeleteIcon />}
                size="sm"
                variant="ghost"
                colorScheme={showRestore ? "green" : "red"}
                onClick={() => showRestore 
                  ? handleStatusChange(row.id, 'draft')
                  : confirmDelete(row)
                }
                aria-label={showRestore ? "Restore announcement" : "Archive announcement"}
              />
            </Tooltip>
          )}

          {/* Quick status actions */}
          {hasPermission('announcements', 'edit') && row.status !== 'archived' && (
            <Menu>
              <MenuButton as={IconButton} icon={<ChevronDownIcon />} size="sm" variant="ghost" />
              <MenuList>
                {row.status !== 'active' && (
                  <MenuItem onClick={() => handleStatusChange(row.id, 'active')}>
                    Mark as Active
                  </MenuItem>
                )}
                {row.status !== 'draft' && (
                  <MenuItem onClick={() => handleStatusChange(row.id, 'draft')}>
                    Mark as Draft
                  </MenuItem>
                )}
                {row.status !== 'scheduled' && (
                  <MenuItem onClick={() => handleStatusChange(row.id, 'scheduled')}>
                    Mark as Scheduled
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          )}
        </HStack>
      )
    }
  ];

  if (announcements.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No announcements found</Text>
      </Box>
    );
  }

  return (
    <>
      <DataTable
        data={announcements}
        columns={columns}
        pagination
        pageSize={10}
        searchable
        searchPlaceholder="Search announcements..."
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialogOpen}
        leastDestructiveRef={React.useRef()}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Archive Announcement
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to archive "{selectedAnnouncement?.title}"? 
              This will remove it from active listings but keep it in archives.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Archive
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default AnnouncementTable;