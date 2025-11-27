import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { CustomSelectInput } from '../components/custom-select-input.js';
import fuzzy from 'fuzzy';
import { Spinner } from '../components/spinner.js';
import { StatusMessage } from '../components/status-message.js';
import { CommandLayout } from '../components/command-layout.js';
import { getRecentBranches, addRecentBranch } from '../utils/recent-branches.js';
import * as git from '../utils/git.js';
import type { Branch, MenuAction } from '../types.js';
import { SWITCH_BRANCH_TITLE } from '../constants.js';

type Step = 'loading' | 'search' | 'executing' | 'done' | 'error';

interface BranchSwitcherProps {
  onBack?: () => void;
}

export function BranchSwitcher({ onBack }: BranchSwitcherProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('loading');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [recentBranches, setRecentBranches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<MenuAction[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [error, setError] = useState('');
  const [currentBranch, setCurrentBranch] = useState('');

  // Handle Esc/Backspace during search
  useInput((input, key) => {
    if (step !== 'search') return;

    // Go back: Backspace or Escape
    if ((key.backspace || key.escape) && onBack) {
      onBack();
    }
  });

  // Load branches
  useEffect(() => {
    async function load() {
      try {
        const status = await git.getGitStatus();

        if (!status.isRepo) {
          setError('Not in a git repository');
          setStep('error');
          return;
        }

        setCurrentBranch(status.currentBranch);

        const allBranches = await git.getLocalBranches();
        const recent = getRecentBranches();

        setBranches(allBranches);
        setRecentBranches(recent);
        setStep('search');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    load();
  }, []);

  // Filter branches based on search query
  useEffect(() => {
    if (step !== 'search') return;

    const branchNames = branches.map((b) => b.name);

    if (!searchQuery) {
      // Show recent branches first, then all others
      const recentItems = recentBranches
        .filter((name) => branchNames.includes(name) && name !== currentBranch)
        .map((name) => ({
          label: `★ ${name}`,
          value: name,
        }));

      const otherItems = branches
        .filter(
          (b) => !recentBranches.includes(b.name) && b.name !== currentBranch
        )
        .map((b) => ({
          label: b.name,
          value: b.name,
        }));

      setFilteredBranches([...recentItems, ...otherItems]);
    } else {
      // Fuzzy search
      const results = fuzzy.filter(searchQuery, branchNames);
      const filtered = results
        .map((result) => ({
          label: recentBranches.includes(result.string)
            ? `★ ${result.string}`
            : result.string,
          value: result.string,
        }))
        .filter((item) => item.value !== currentBranch);

      setFilteredBranches(filtered);
    }
  }, [searchQuery, branches, recentBranches, currentBranch, step]);

  // Execute branch switch
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      try {
        await git.checkoutBranch(selectedBranch);
        addRecentBranch(selectedBranch);
        setStep('done');
        setTimeout(() => exit(), 1500);
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    execute();
  }, [step, selectedBranch, exit]);

  if (step === 'loading') {
    return (
      <Box flexDirection="column">
        <Spinner label="Loading branches..." />
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <Box flexDirection="column">
        <StatusMessage type="error" message={error} />
      </Box>
    );
  }

  if (step === 'search') {
    return (
      <CommandLayout title={SWITCH_BRANCH_TITLE}>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text dimColor>
            Current: <Text color="yellow">{currentBranch}</Text>
          </Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <TextInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Type to filter..."
          />
        </Box>
        {filteredBranches.length > 0 ? (
          <Box flexDirection="column" alignItems='flex-start'>
            <CustomSelectInput
              items={filteredBranches}
              onSelect={(item) => {
                setSelectedBranch(item.value);
                setStep('executing');
              }}
              onBack={onBack}
            />
          </Box>
        ) : (
          <Box marginTop={1} flexDirection="column" alignItems='flex-start'>
            <Text color="yellow">No branches match your search</Text>
          </Box>
        )}
      </CommandLayout>
    );
  }

  if (step === 'executing') {
    return (
      <Box flexDirection="column">
        <Spinner label={`Switching to ${selectedBranch}...`} />
      </Box>
    );
  }

  // step === 'done'
  return (
    <Box flexDirection="column">
      <StatusMessage
        type="success"
        message={`Switched to branch: ${selectedBranch}`}
      />
    </Box>
  );
}
