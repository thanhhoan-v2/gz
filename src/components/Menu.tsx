import React from 'react';
import {Box, Text} from 'ink';
import SelectInput from 'ink-select-input';
import type {MenuAction} from '../types.js';

interface MenuProps {
  title: string;
  items: MenuAction[];
  onSelect: (item: MenuAction) => void;
}

export function Menu({title, items, onSelect}: MenuProps) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>
      <SelectInput items={items} onSelect={onSelect} />
      <Box marginTop={1}>
        <Text dimColor>Use ↑↓ arrows to navigate, Enter to select, Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
}
