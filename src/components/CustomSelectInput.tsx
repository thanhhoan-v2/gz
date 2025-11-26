import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {MenuAction} from '../types.js';

interface CustomSelectInputProps {
  items: MenuAction[];
  onSelect: (item: MenuAction) => void;
  onBack?: () => void;
}

export function CustomSelectInput({items, onSelect, onBack}: CustomSelectInputProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    // Move down: Arrow down, Ctrl+N, j (vim style)
    if (key.downArrow || (key.ctrl && input === 'n') || input === 'j') {
      setSelectedIndex((prev) => (prev + 1) % items.length);
    }
    // Move up: Arrow up, Ctrl+P, k (vim style)
    else if (key.upArrow || (key.ctrl && input === 'p') || input === 'k') {
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    }
    // Select: Enter or Space
    else if (key.return || input === ' ') {
      onSelect(items[selectedIndex]);
    }
    // Go back: Backspace or Escape
    else if ((key.backspace || key.escape) && onBack) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={item.value}>
          <Text color={index === selectedIndex ? 'red' : undefined}>
            {index === selectedIndex ? '› ' : '  '}
            {item.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
