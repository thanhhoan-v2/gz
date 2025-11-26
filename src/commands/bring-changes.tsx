import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {CustomSelectInput} from '../components/CustomSelectInput.js';
import fuzzy from 'fuzzy';
import {Spinner} from '../components/Spinner.js';
import {StatusMessage} from '../components/StatusMessage.js';
import {Footer} from '../components/Footer.js';
import * as git from '../utils/git.js';
import type {Branch, MenuAction} from '../types.js';
import { BRING_CHANGES_TITLE } from '../constants.js';
import { Header } from '../components/Header.js';

type Step =
  | 'check'
  | 'search'
  | 'confirm-create'
  | 'executing'
  | 'done'
  | 'error';

interface BringChangesProps {
  onBack?: () => void;
}

export function BringChanges({onBack}: BringChangesProps) {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('check');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<MenuAction[]>([]);
  const [targetBranch, setTargetBranch] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [needsCreation, setNeedsCreation] = useState(false);
  const [error, setError] = useState('');

  // Handle Esc/Backspace to go back
  useInput((input, key) => {
    // Don't handle during loading/executing/done states
    if (step === 'check' || step === 'executing' || step === 'done') return;

    // Go back: Backspace or Escape
    if ((key.backspace || key.escape) && onBack) {
      onBack();
    }
  });

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
      <Box flexDirection="column" alignItems='center'>
        <Header title={BRING_CHANGES_TITLE} />
        <Box marginBottom={1} alignItems='flex-start'>
          <Text dimColor>
            Source: <Text color="yellow">{sourceBranch}</Text>
          </Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>Search target branch: </Text>
          <TextInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Type to filter or create new..."
            onSubmit={(value) => {
              if (value.trim()) {
                setTargetBranch(value.trim());
                const branchExists = branches.some((b) => b.name === value.trim());
                if (branchExists) {
                  setNeedsCreation(false);
                  setStep('executing');
                } else {
                  setNeedsCreation(true);
                  setStep('confirm-create');
                }
              }
            }}
          />
        </Box>
        {filteredBranches.length > 0 ? (
          <Box flexDirection="column" alignItems='flex-start'>
            <CustomSelectInput
              items={filteredBranches}
              onSelect={(item) => {
                setTargetBranch(item.value);
                const branchExists = branches.some((b) => b.name === item.value);
                if (branchExists) {
                  setNeedsCreation(false);
                  setStep('executing');
                } else {
                  setNeedsCreation(true);
                  setStep('confirm-create');
                }
              }}
              onBack={onBack}
            />
            {/* <Footer navigation="↑↓/Ctrl+P/N/j/k to navigate | Enter to select/create" showBack={!!onBack} /> */}
          </Box>
        ) : (
          <Box marginTop={1} flexDirection="column" alignItems='flex-start'>
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
