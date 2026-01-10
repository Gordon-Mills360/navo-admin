import React from 'react';
import { Box, useClipboard, IconButton, Tooltip } from '@chakra-ui/react';
import { FaCopy, FaCheck } from 'react-icons/fa';

const Code = ({ children, ...props }) => {
  const { hasCopied, onCopy } = useClipboard(String(children));

  return (
    <Box
      position="relative"
      fontFamily="mono"
      fontSize="sm"
      p={3}
      bg="gray.900"
      color="gray.100"
      borderRadius="md"
      overflowX="auto"
      {...props}
    >
      <Tooltip label={hasCopied ? "Copied!" : "Copy to clipboard"}>
        <IconButton
          position="absolute"
          top={2}
          right={2}
          size="xs"
          icon={hasCopied ? <FaCheck /> : <FaCopy />}
          onClick={onCopy}
          aria-label="Copy code"
          variant="ghost"
          color="gray.300"
          _hover={{ bg: 'gray.700' }}
        />
      </Tooltip>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{children}</pre>
    </Box>
  );
};

export default Code;