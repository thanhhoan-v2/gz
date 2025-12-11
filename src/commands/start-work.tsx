import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { BranchInput } from '../components/branch-input.js';
import { Spinner } from '../components/spinner.js';
import { StatusMessage } from '../components/status-message.js';
import { CommandLayout } from '../components/command-layout.js';
import { detectBaseBranch } from '../utils/branch-detector.js';
import * as git from '../utils/git.js';
import { START_WORK_TITLE } from '../constants.js';

type Step = 'check' | 'branch-input' | 'base-input' | 'executing' | 'done' | 'error';

interface StartWorkProps {
  onBack?: () => void;
}

export function StartWork({ onBack }: StartWorkProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('check');
  const [branchName, setBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [detectedBase, setDetectedBase] = useState('');
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

        if (status.hasUncommittedChanges) {
          setError('You have uncommitted changes. Please commit or stash them first.');
          setStep('error');
          return;
        }

        // Detect base branch
        const detected = detectBaseBranch();
        setDetectedBase(detected);
        setStep('branch-input');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    check();
  }, []);

  // Execute feature branch creation
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      try {
        // Checkout to base branch
        await git.checkoutBranch(baseBranch);

        // Pull latest from origin
        await git.pullOrigin(baseBranch);

        // Create and checkout feature branch
        await git.createBranch(branchName);

        setStep('done');
        setTimeout(() => exit(), 2000);
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    execute();
  }, [step, baseBranch, branchName, exit]);

  if (step === 'check') {
    return (
      <Box flexDirection="column">
        <Spinner label="Checking repository status..." />
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <CommandLayout title={START_WORK_TITLE}>
        <StatusMessage type="error" message={error} />
      </CommandLayout>
    );
  }

  if (step === 'branch-input') {
    return (
      <CommandLayout title={START_WORK_TITLE}>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text color="green">Branch name: </Text>
          <TextInput
            value={branchName}
            onChange={setBranchName}
            onSubmit={(value) => {
              if (value.trim()) {
                setBranchName(value.trim());
                setStep('base-input');
              }
            }}
          />
        </Box>
      </CommandLayout>
    );
  }

  if (step === 'base-input') {
    return (
      <CommandLayout title={START_WORK_TITLE}>
        <BranchInput
          label="Base branch:"
          detectedBranch={detectedBase}
          onSubmit={(branch) => {
            setBaseBranch(branch);
            setStep('executing');
          }}
        />
      </CommandLayout>
    );
  }

  if (step === 'executing') {
    return (
      <CommandLayout title={START_WORK_TITLE}>
        <Spinner label="Creating feature branch..." />
        <Box marginTop={1} alignItems='flex-start'>
          <Text dimColor>Branch: {branchName}</Text>
        </Box>
        <Box alignItems='flex-start'>
          <Text dimColor>Base: {baseBranch}</Text>
        </Box>
      </CommandLayout>
    );
  }

  // step === 'done'
  return (
    <CommandLayout title={START_WORK_TITLE}>
      <StatusMessage
        type="success"
        message="Feature branch created successfully!"
        details={[
          `Branch: ${branchName}`,
          `Base: ${baseBranch}`,
          `Ready to commit: git add . && git commit && git push origin ${branchName}`,
        ]}
      />
    </CommandLayout>
  );
}
