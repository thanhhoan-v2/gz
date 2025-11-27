import React from 'react';
import {Box} from 'ink';
import {Header} from './header.js';

interface CommandLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function CommandLayout({title, children}: CommandLayoutProps) {
  return (
    <Box flexDirection="column" alignItems="center">
      <Header title={title} />
      {children}
    </Box>
  );
}
