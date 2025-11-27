import React from 'react';
import {Box, Text} from 'ink';

interface StatusMessageProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  details?: string[];
}

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️ ',
  warning: '⚠️ ',
};

const colors = {
  success: 'green',
  error: 'red',
  info: 'cyan',
  warning: 'yellow',
} as const;

export function StatusMessage({type, message, details}: StatusMessageProps) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Box>
        <Text color={colors[type]} bold>
          {icons[type]} {message}
        </Text>
      </Box>
      {details && details.length > 0 && (
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          {details.map((detail, i) => (
            <Text key={i} dimColor>
              • {detail}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
