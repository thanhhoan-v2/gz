import React from 'react';
import { Box, Text } from 'ink';

export function Header({ title }: { title: string }) {
  return (
    <Box flexDirection="column" padding={1} alignItems="center">
      <Box marginBottom={1}>
        <Text bold color="magenta">
          {title}
        </Text>
      </Box>
      <Text>                       </Text>
    </Box>
  );
}
