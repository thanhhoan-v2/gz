#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { Menu } from './components/menu.js';
import { StartWork } from './commands/start-work.js';
import { EndWork } from './commands/end-work.js';
import { BranchSwitcher } from './commands/branch-switcher.js';
import { SyncRemoteBranches } from './commands/sync-remote-branches.js';
import { BringChanges } from './commands/bring-changes.js';
import { SyncClaudeConfig } from './commands/sync-claude-config.js';
import { SyncPersonalProjects } from './commands/sync-personal-projects.js';
import { CommitClaude } from './commands/commit-claude.js';
import { ExportClaudeMem } from './commands/export-claude-mem.js';
import * as git from './utils/git.js';
import type { MenuAction, CommandType } from './types.js';
import { MENU_ITEMS } from './constants.js';
import { Header } from './components/header.js';

// Parse command line arguments
const args = process.argv.slice(2);
const directCommand = args[0];
const hasPushedFlag = args.includes('--has-pushed') || args.includes('--has_pushed');

function App() {
  const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(directCommand as CommandType || null);
  const [repoInfo, setRepoInfo] = useState<{ repoName: string; currentBranch: string; uncommittedCount: number } | null>(null);

  // Load repository info on mount and when returning to menu
  useEffect(() => {
    async function loadRepoInfo() {
      try {
        const status = await git.getGitStatus();
        if (!status.isRepo) return;

        const [repoName, uncommittedCount] = await Promise.all([
          git.getRepoName(),
          git.getUncommittedChangesCount(),
        ]);

        setRepoInfo({
          repoName,
          currentBranch: status.currentBranch,
          uncommittedCount,
        });
      } catch {
        // Silently fail if we can't get repo info
      }
    }

    if (!selectedCommand) {
      loadRepoInfo();
    }
  }, [selectedCommand]);

  const handleSelect = (item: MenuAction) => {
    setSelectedCommand(item.value as CommandType);
  };

  const handleBack = () => {
    setSelectedCommand(null);
  };

  // Add indicator to start-work and end-work if there are unstaged changes
  const menuItemsWithIndicator = MENU_ITEMS.map((item) => {
    if (
      (item.value === 'start-feature' || item.value === 'end-work') &&
      repoInfo &&
      repoInfo.uncommittedCount > 0
    ) {
      return {
        ...item,
        label: `${item.label} `,
      };
    }
    return item;
  });

  if (!selectedCommand) {
    return (
      <>
        <Header title="gz" />
        <Menu items={menuItemsWithIndicator} onSelect={handleSelect} />
      </>
    );
  }

  switch (selectedCommand) {
    case 'start-feature':
      return <StartWork onBack={handleBack} />;
    case 'end-work':
      return <EndWork onBack={handleBack} has_pushed={hasPushedFlag} />;
    case 'switch-branch':
      return <BranchSwitcher onBack={handleBack} />;
    case 'sync-remote':
      return <SyncRemoteBranches onBack={handleBack} />;
    case 'bring-changes':
      return <BringChanges onBack={handleBack} />;
    case 'commit-claude':
      return <CommitClaude onBack={handleBack} />;
    case 'sync-claude-config':
      return <SyncClaudeConfig onBack={handleBack} />;
    case 'sync-personal-projects':
      return <SyncPersonalProjects onBack={handleBack} />;
    case 'export-claude-mem':
      return <ExportClaudeMem onBack={handleBack} />;
    default:
      return <Text>Unknown command</Text>;
  }
}

render(<App />);
