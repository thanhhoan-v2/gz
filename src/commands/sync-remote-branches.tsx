import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {Spinner} from '../components/Spinner.js';
import {StatusMessage} from '../components/StatusMessage.js';
import * as git from '../utils/git.js';
import type {Branch} from '../types.js';

type Step = 'loading' | 'confirm' | 'executing' | 'done' | 'error';

export function SyncRemoteBranches() {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('loading');
  const [goneBranches, setGoneBranches] = useState<Branch[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [error, setError] = useState('');

  // Confirmation input
  useInput((input) => {
    if (step !== 'confirm') return;

    if (input === 'y' || input === 'Y') {
      setStep('executing');
    } else if (input === 'n' || input === 'N') {
      exit();
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
      <Box flexDirection="column">
        <Spinner label="Checking for deleted remote branches..." />
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

  if (step === 'confirm') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">
            🔄 Sync Remote Branches
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text>
            Found <Text color="yellow" bold>{goneBranches.length}</Text> local branches
            that have been deleted on remote:
          </Text>
        </Box>
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
          {goneBranches.map((branch, i) => (
            <Text key={i} color="red">
              • {branch.name}
            </Text>
          ))}
        </Box>
        <Box marginBottom={1}>
          <Text color="red">These branches will be deleted locally.</Text>
        </Box>
        <Box>
          <Text>
            Proceed? <Text color="green">(y/n)</Text>
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'executing') {
    return (
      <Box flexDirection="column">
        <Spinner label="Deleting local branches..." />
        <Box marginTop={1}>
          <Text dimColor>Deleting {goneBranches.length} branches...</Text>
        </Box>
      </Box>
    );
  }

  // step === 'done'
  return (
    <Box flexDirection="column">
      <StatusMessage
        type="success"
        message="Remote branches synced!"
        details={[
          `Deleted ${deletedCount} local branch${deletedCount !== 1 ? 'es' : ''}`,
          'Your local repository is now in sync with remote',
        ]}
      />
    </Box>
  );
}
