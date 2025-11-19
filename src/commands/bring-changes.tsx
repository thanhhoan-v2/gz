import React, {useState, useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import fuzzy from 'fuzzy';
import {Spinner} from '../components/Spinner.js';
import {StatusMessage} from '../components/StatusMessage.js';
import * as git from '../utils/git.js';
import type {Branch, MenuAction} from '../types.js';

type Step =
  | 'check'
  | 'search'
  | 'executing'
  | 'done'
  | 'error';

export function BringChanges() {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('check');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<MenuAction[]>([]);
  const [targetBranch, setTargetBranch] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [error, setError] = useState('');

  // Initial checks
  useEffect(() => {
    async function check() {
      try {
        const status = await git.getGitStatus();

        if (!status.isRepo) {
          setError('Not in a git repository');
          setStep('error');
          return;
        }

        if (!status.hasUncommittedChanges) {
          setError('No uncommitted changes to move');
          setStep('error');
          return;
        }

        setSourceBranch(status.currentBranch);

        // Load branches for selection
        const allBranches = await git.getLocalBranches();
        setBranches(allBranches);
        setStep('search');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    check();
  }, []);

  // Filter branches based on search query
  useEffect(() => {
    if (step !== 'search') return;

    const branchNames = branches.map((b) => b.name);

    if (!searchQuery) {
      const items = branches
        .filter((b) => b.name !== sourceBranch)
        .map((b) => ({
          label: b.name,
          value: b.name,
        }));

      setFilteredBranches(items);
    } else {
      // Fuzzy search
      const results = fuzzy.filter(searchQuery, branchNames);
      const filtered = results
        .map((result) => ({
          label: result.string,
          value: result.string,
        }))
        .filter((item) => item.value !== sourceBranch);

      setFilteredBranches(filtered);
    }
  }, [searchQuery, branches, sourceBranch, step]);

  // Execute stash and switch
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const stashMessage = `gz-transfer-${timestamp}`;

        // Stash changes
        await git.stashChanges(stashMessage);

        // Switch to target branch
        await git.checkoutBranch(targetBranch);

        // Apply stashed changes
        await git.stashPop();

        setStep('done');
        setTimeout(() => exit(), 2000);
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    execute();
  }, [step, targetBranch, exit]);

  if (step === 'check') {
    return (
      <Box flexDirection="column">
        <Spinner label="Checking for uncommitted changes..." />
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
            📦 Bring Changes to Another Branch
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text dimColor>
            Source: <Text color="yellow">{sourceBranch}</Text>
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Search target branch: </Text>
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
                setTargetBranch(item.value);
                setStep('executing');
              }}
            />
            <Box marginTop={1}>
              <Text dimColor>
                ↑↓ to navigate | Enter to select | Ctrl+C to cancel
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
        <Spinner label="Moving changes..." />
        <Box marginTop={1}>
          <Text dimColor>From: {sourceBranch}</Text>
        </Box>
        <Box>
          <Text dimColor>To: {targetBranch}</Text>
        </Box>
      </Box>
    );
  }

  // step === 'done'
  return (
    <Box flexDirection="column">
      <StatusMessage
        type="success"
        message="Changes moved successfully!"
        details={[
          `From: ${sourceBranch}`,
          `To: ${targetBranch}`,
          'Your uncommitted changes are now on the target branch',
        ]}
      />
    </Box>
  );
}
