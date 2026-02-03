import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Checkbox,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

const DataTable = ({
  columns,
  data,
  isLoading = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  actions = true,
  selectable = false,
  searchable = true,
  pagination = true,
  pageSize = 10,
  onSearch,
  onSort,
  onFilter,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState({});

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Filter data
  const filteredData = useMemo(() => {
    let result = data || [];
    
    // Apply search
    if (searchTerm && onSearch) {
      result = onSearch(result, searchTerm);
    } else if (searchTerm) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply filters
    if (onFilter) {
      result = onFilter(result, filters);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [data, searchTerm, sortConfig, filters, onSearch, onFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (onSort) onSort(key, direction);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedData.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort color="gray.400" />;
    return sortConfig.direction === 'asc' ? 
      <FaSortUp color="brand.500" /> : 
      <FaSortDown color="brand.500" />;
  };

  const renderCell = (row, column) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (column.type === 'badge') {
      return (
        <Badge
          colorScheme={column.badgeColor || 'gray'}
          variant="subtle"
          fontSize="xs"
          borderRadius="full"
          px={3}
          py={1}
        >
          {value}
        </Badge>
      );
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    
    return (
      <Text fontSize="sm" noOfLines={1}>
        {value || '-'}
      </Text>
    );
  };

  if (isLoading) {
    return (
      <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden" {...props}>
        <Box p={4}>
          <Skeleton height="40px" mb={4} />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height="50px" mb={2} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden" {...props}>
      {/* Toolbar */}
      {(searchable || selectable) && (
        <Flex p={4} borderBottomWidth="1px" borderBottomColor={borderColor} gap={4}>
          {searchable && (
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                borderRadius="lg"
              />
            </InputGroup>
          )}
          
          {selectable && selectedRows.length > 0 && (
            <Text fontSize="sm" color="gray.600">
              {selectedRows.length} selected
            </Text>
          )}
        </Flex>
      )}

      {/* Table */}
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              {selectable && (
                <Th width="50px">
                  <Checkbox
                    isChecked={selectedRows.length === paginatedData.length}
                    onChange={handleSelectAll}
                  />
                </Th>
              )}
              
              {columns.map((column) => (
                <Th
                  key={column.key}
                  cursor={column.sortable ? 'pointer' : 'default'}
                  onClick={() => column.sortable && handleSort(column.key)}
                  _hover={column.sortable ? { bg: 'gray.50' } : {}}
                >
                  <Flex align="center" gap={2}>
                    {column.header}
                    {column.sortable && getSortIcon(column.key)}
                  </Flex>
                </Th>
              ))}
              
              {actions && <Th width="100px">Actions</Th>}
            </Tr>
          </Thead>
          
          <Tbody>
            {paginatedData.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} textAlign="center" py={10}>
                  <Text color="gray.500">No data found</Text>
                </Td>
              </Tr>
            ) : (
              paginatedData.map((row) => (
                <Tr
                  key={row.id}
                  _hover={{ bg: 'gray.50' }}
                  cursor={onRowClick ? 'pointer' : 'default'}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <Td>
                      <Checkbox
                        isChecked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Td>
                  )}
                  
                  {columns.map((column) => (
                    <Td key={column.key}>
                      {renderCell(row, column)}
                    </Td>
                  ))}
                  
                  {actions && (
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FaEllipsisV />}
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <MenuList minW="150px">
                          {onView && (
                            <MenuItem icon={<FaEye />} onClick={() => onView(row)}>
                              View
                            </MenuItem>
                          )}
                          {onEdit && (
                            <MenuItem icon={<FaEdit />} onClick={() => onEdit(row)}>
                              Edit
                            </MenuItem>
                          )}
                          {onDelete && (
                            <MenuItem
                              icon={<FaTrash />}
                              color="red.500"
                              onClick={() => onDelete(row)}
                            >
                              Delete
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  )}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <Flex
          p={4}
          borderTopWidth="1px"
          borderTopColor={borderColor}
          justify="space-between"
          align="center"
        >
          <Text fontSize="sm" color="gray.600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </Text>
          
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FaChevronLeft />}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <HStack spacing={1}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? 'solid' : 'outline'}
                    colorScheme={currentPage === pageNum ? 'brand' : 'gray'}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <Text>...</Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </HStack>
            
            <Button
              size="sm"
              variant="outline"
              rightIcon={<FaChevronRight />}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
};

export default DataTable;