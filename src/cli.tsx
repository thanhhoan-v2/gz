#!/usr/bin/env node
import React, {useState} from 'react';
import {render, Box, Text} from 'ink';
import {Menu} from './components/Menu.js';
import {StartFeature} from './commands/start-feature.js';
import {FinishFeature} from './commands/finish-feature.js';
import {BranchSwitcher} from './commands/branch-switcher.js';
import {SyncRemoteBranches} from './commands/sync-remote-branches.js';
import {BringChanges} from './commands/bring-changes.js';
import type {MenuAction, CommandType} from './types.js';

const menuItems: MenuAction[] = [
  {label: '🚀 Start Feature', value: 'start-feature'},
  {label: '🏁 Finish Feature', value: 'finish-feature'},
  {label: '🌿 Switch Branch', value: 'switch-branch'},
  {label: '🔄 Sync Remote Branches', value: 'sync-remote'},
  {label: '📦 Bring Changes to Another Branch', value: 'bring-changes'},
];

function App() {
  const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null);

  const handleSelect = (item: MenuAction) => {
    setSelectedCommand(item.value as CommandType);
  };

  if (!selectedCommand) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="magenta">
            ⚡ gz - Git Workflow CLI
          </Text>
        </Box>
        <Menu title="Select an action:" items={menuItems} onSelect={handleSelect} />
      </Box>
    );
  }

  switch (selectedCommand) {
    case 'start-feature':
      return <StartFeature />;
    case 'finish-feature':
      return <FinishFeature />;
    case 'switch-branch':
      return <BranchSwitcher />;
    case 'sync-remote':
      return <SyncRemoteBranches />;
    case 'bring-changes':
      return <BringChanges />;
    default:
      return <Text>Unknown command</Text>;
  }
}

render(<App />);
