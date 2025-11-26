import React from 'react';
import {Box, Text} from 'ink';

interface FooterProps {
  /**
   * Navigation instructions to display
   * Default: "↑↓/Ctrl+P/N/j/k to navigate | Enter to select"
   */
  navigation?: string;
  /**
   * Whether to show back option
   */
  showBack?: boolean;
  /**
   * Additional instructions to append
   */
  additional?: string;
}

export function Footer({
  navigation = '↑↓/Ctrl+P/N/j/k to navigate | Enter to select',
  showBack = false,
  additional,
}: FooterProps) {
  const parts: string[] = [];

  if (navigation) {
    parts.push(navigation);
  }

  if (showBack) {
    parts.push('Backspace/Esc to go back');
  }

  parts.push('Ctrl+C to cancel');

  if (additional) {
    parts.push(additional);
  }

  return (
    <Box marginTop={1}>
      <Text dimColor>{parts.join(' | ')}</Text>
    </Box>
  );
}
