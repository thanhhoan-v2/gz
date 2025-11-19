import React, {useState, useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import fuzzy from 'fuzzy';
import {Spinner} from '../components/Spinner.js';
import {StatusMessage} from '../components/StatusMessage.js';
import {getRecentBranches, addRecentBranch} from '../utils/recent-branches.js';
import * as git from '../utils/git.js';
import type {Branch, MenuAction} from '../types.js';

type Step = 'loading' | 'search' | 'executing' | 'done' | 'error';

export function BranchSwitcher() {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('loading');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [recentBranches, setRecentBranches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<MenuAction[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [error, setError] = useState('');
  const [currentBranch, setCurrentBranch] = useState('');

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
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">
            🌿 Switch Branch
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text dimColor>
            Current: <Text color="yellow">{currentBranch}</Text>
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Search: </Text>
          <TextInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Type to filter..."
          />
        </Box>
        {filteredBranches.length > 0 ? (
          <>
            <SelectInput
              items={filteredBranches}
              onSelect={(item) => {
                setSelectedBranch(item.value);
                setStep('executing');
              }}
            />
            <Box marginTop={1}>
              <Text dimColor>
                ★ = Recent | ↑↓ to navigate | Enter to select | Ctrl+C to cancel
              </Text>
            </Box>
          </>
        ) : (
          <Box marginTop={1}>
            <Text color="yellow">No branches match your search</Text>
          </Box>
        )}
      </Box>
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
