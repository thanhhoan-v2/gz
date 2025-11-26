import React from 'react';
import {Box, Text} from 'ink';

interface RepositoryInfoProps {
  repoName: string;
  currentBranch: string;
  uncommittedCount: number;
}

export function RepositoryInfo({repoName, currentBranch, uncommittedCount}: RepositoryInfoProps) {
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color="gray">Repository:</Text>
        <Text color="cyan" bold>{repoName || 'Unknown'}</Text>
        <Text color="gray">│</Text>
        <Text color="gray">Branch:</Text>
        <Text color="green">{currentBranch || 'N/A'}</Text>
        <Text color="gray">│</Text>
        <Text color="gray">Changes:</Text>
        <Text color={uncommittedCount > 0 ? 'yellow' : 'green'}>
          {uncommittedCount}
        </Text>
      </Box>
    </Box>
  );
}
