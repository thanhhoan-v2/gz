import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Spinner } from '../components/spinner.js';
import { StatusMessage } from '../components/status-message.js';
import { CommandLayout } from '../components/command-layout.js';
import * as git from '../utils/git.js';
import type { Branch } from '../types.js';
import { SYNC_REMOTE_BRANCHES_TITLE } from '../constants.js';

type Step = 'loading' | 'confirm' | 'executing' | 'done' | 'error';

interface SyncRemoteBranchesProps {
  onBack?: () => void;
}

export function SyncRemoteBranches({ onBack }: SyncRemoteBranchesProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('loading');
  const [goneBranches, setGoneBranches] = useState<Branch[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [error, setError] = useState('');

  // Handle input and Esc/Backspace
  useInput((input, key) => {
    // Don't handle during loading/executing/done states
    if (step === 'loading' || step === 'executing' || step === 'done') return;

    // Confirmation input
    if (step === 'confirm') {
      if (input === 'y' || input === 'Y') {
        setStep('executing');
      } else if (input === 'n' || input === 'N') {
        exit();
      }
    }

    // Go back: Backspace or Escape
    if ((key.backspace || key.escape) && onBack) {
      onBack();
    }
  });

  // Load gone branches
  useEffect(() => {
    async function load() {
      try {
        const status = await git.getGitStatus();

        if (!status.isRepo) {
          setError('Not in a git repository');
          setStep('error');
          return;
        }

        // Fetch with prune to update remote tracking
        await git.fetchPrune();

        // Get branches marked as [gone]
        const gone = await git.getGoneBranches();

        if (gone.length === 0) {
          setError('No branches to clean up');
          setStep('error');
          return;
        }

        setGoneBranches(gone);
        setStep('confirm');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    load();
  }, []);

  // Execute deletion
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      try {
        let deleted = 0;

        for (const branch of goneBranches) {
          try {
            await git.deleteBranch(branch.name, true);
            deleted++;
          } catch {
            // Continue even if one fails
          }
        }

        setDeletedCount(deleted);
        setStep('done');
        setTimeout(() => exit(), 2500);
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    execute();
  }, [step, goneBranches, exit]);

  if (step === 'loading') {
    return (
      <CommandLayout title={SYNC_REMOTE_BRANCHES_TITLE}>
        <Spinner label="Checking for deleted remote branches..." />
      </CommandLayout>
    );
  }

  if (step === 'error') {
    return (
      <CommandLayout title={SYNC_REMOTE_BRANCHES_TITLE}>
        <StatusMessage type="error" message={error} />
      </CommandLayout>
    );
  }

  if (step === 'confirm') {
    return (
      <CommandLayout title={SYNC_REMOTE_BRANCHES_TITLE}>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>
            Found <Text color="yellow" bold>{goneBranches.length}</Text> local branches
            that have been deleted on remote:
          </Text>
        </Box>
        <Box flexDirection="column" marginBottom={1} paddingLeft={2} alignItems='flex-start'>
          {goneBranches.map((branch, i) => (
            <Text key={i} color="red">
              • {branch.name}
            </Text>
          ))}
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text color="red">These branches will be deleted locally.</Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>
            Proceed? <Text color="green">(y/n)</Text>
          </Text>
        </Box>
      </CommandLayout>
    );
  }

  if (step === 'executing') {
    return (
      <CommandLayout title={SYNC_REMOTE_BRANCHES_TITLE}>
        <Spinner label="Deleting local branches..." />
        <Box marginTop={1} alignItems='flex-start'>
          <Text dimColor>Deleting {goneBranches.length} branches...</Text>
        </Box>
      </CommandLayout>
    );
  }

  // step === 'done'
  return (
    <CommandLayout title={SYNC_REMOTE_BRANCHES_TITLE}>
      <StatusMessage
        type="success"
        message="Remote branches synced!"
        details={[
          `Deleted ${deletedCount} local branch${deletedCount !== 1 ? 'es' : ''}`,
          'Your local repository is now in sync with remote',
        ]}
      />
    </CommandLayout>
  );
}
