import React from 'react';
import { Box, Text } from 'ink';
import { CustomSelectInput } from './CustomSelectInput.js';
import type { MenuAction } from '../types.js';

interface MenuProps {
  items: MenuAction[];
  onSelect: (item: MenuAction) => void;
  onBack?: () => void;
}

export function Menu({ items, onSelect, onBack }: MenuProps) {
  return (
    <Box flexDirection="column" alignItems='center'>
      <CustomSelectInput items={items} onSelect={onSelect} onBack={onBack} />
      <Box marginTop={1}>
        <Text dimColor>
          {onBack ? '↑↓/Ctrl+P/N/j/k to navigate | Enter to select | Backspace/Esc to go back | Ctrl+C to exit' : 'Use ↑↓ arrows to navigate, Enter to select, Ctrl+C to exit'}
        </Text>
      </Box>
    </Box>
  );
}
