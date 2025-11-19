import React, {useState, useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import TextInput from 'ink-text-input';
import {BranchInput} from '../components/BranchInput.js';
import {Spinner} from '../components/Spinner.js';
import {StatusMessage} from '../components/StatusMessage.js';
import {detectBaseBranch} from '../utils/branch-detector.js';
import * as git from '../utils/git.js';

type Step = 'check' | 'branch-input' | 'base-input' | 'executing' | 'done' | 'error';

export function StartFeature() {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('check');
  const [branchName, setBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [detectedBase, setDetectedBase] = useState('');
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

        // Fetch and reset to ensure clean sync
        await git.fetchOrigin();
        await git.resetToOrigin(baseBranch);

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
      <Box flexDirection="column">
        <StatusMessage type="error" message={error} />
      </Box>
    );
  }

  if (step === 'branch-input') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">
            🚀 Start Feature Branch
          </Text>
        </Box>
        <Box>
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
      </Box>
    );
  }

  if (step === 'base-input') {
    return (
      <Box flexDirection="column">
        <BranchInput
          label="Base branch:"
          detectedBranch={detectedBase}
          onSubmit={(branch) => {
            setBaseBranch(branch);
            setStep('executing');
          }}
        />
      </Box>
    );
  }

  if (step === 'executing') {
    return (
      <Box flexDirection="column">
        <Spinner label="Creating feature branch..." />
        <Box marginTop={1}>
          <Text dimColor>Branch: {branchName}</Text>
        </Box>
        <Box>
          <Text dimColor>Base: {baseBranch}</Text>
        </Box>
      </Box>
    );
  }

  // step === 'done'
  return (
    <Box flexDirection="column">
      <StatusMessage
        type="success"
        message="Feature branch created successfully!"
        details={[
          `Branch: ${branchName}`,
          `Base: ${baseBranch}`,
          `Ready to commit: git add . && git commit && git push origin ${branchName}`,
        ]}
      />
    </Box>
  );
}
