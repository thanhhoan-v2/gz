import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';

interface BranchInputProps {
  label: string;
  detectedBranch?: string;
  onSubmit: (branch: string) => void;
}

export function BranchInput({label, detectedBranch, onSubmit}: BranchInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const finalBranch = value.trim() || detectedBranch || '';
    if (finalBranch) {
      onSubmit(finalBranch);
    }
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold>{label}</Text>
      </Box>
      {detectedBranch && (
        <Box marginBottom={1}>
          <Text dimColor>
            Detected: <Text color="cyan">{detectedBranch}</Text> (press Enter to use)
          </Text>
        </Box>
      )}
      <Box>
        <Text color="green">❯ </Text>
        <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
