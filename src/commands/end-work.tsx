import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {BranchInput} from '../components/BranchInput.js';
import {Spinner} from '../components/Spinner.js';
import {StatusMessage} from '../components/StatusMessage.js';
import {detectBaseBranch} from '../utils/branch-detector.js';
import * as git from '../utils/git.js';
import { END_WORK_TITLE } from '../constants.js';
import { Header } from '../components/Header.js';

type Step = 'check' | 'confirm' | 'base-input' | 'executing' | 'done' | 'error';

interface EndWorkProps {
  onBack?: () => void;
}

export function EndWork({onBack}: EndWorkProps) {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('check');
  const [currentBranch, setCurrentBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [detectedBase, setDetectedBase] = useState('');
  const [error, setError] = useState('');
  const [remoteDeleted, setRemoteDeleted] = useState(false);

  // Handle input and Esc/Backspace
  useInput((input, key) => {
    // Don't handle during loading/executing/done states
    if (step === 'check' || step === 'executing' || step === 'done') return;

    // Confirmation input
    if (step === 'confirm') {
      if (input === 'y' || input === 'Y') {
        setStep('base-input');
      } else if (input === 'n' || input === 'N') {
        exit();
      }
    }

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

        if (!status.currentBranch) {
          setError('Could not determine current branch');
          setStep('error');
          return;
        }

        if (git.isProtectedBranch(status.currentBranch)) {
          setError(`Cannot finish from protected branch: ${status.currentBranch}`);
          setStep('error');
          return;
        }

        if (status.hasUncommittedChanges) {
          setError('You have uncommitted changes. Please commit or stash them first.');
          setStep('error');
          return;
        }

        setCurrentBranch(status.currentBranch);
        const detected = detectBaseBranch();
        setDetectedBase(detected);
        setStep('confirm');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    check();
  }, []);

  // Execute finish workflow
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      try {
        // Checkout to base branch
        await git.checkoutBranch(baseBranch);

        // Fetch and reset to ensure clean sync
        await git.fetchOrigin();
        await git.resetToOrigin(baseBranch);

        // Delete local branch
        await git.deleteBranch(currentBranch, true);

        // Delete remote branch
        const deleted = await git.deleteRemoteBranch(currentBranch);
        setRemoteDeleted(deleted);

        setStep('done');
        setTimeout(() => exit(), 2500);
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    execute();
  }, [step, baseBranch, currentBranch, exit]);

  if (step === 'check') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={END_WORK_TITLE} />
        <Spinner label="Checking feature branch status..." />
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={END_WORK_TITLE} />
        <StatusMessage type="error" message={error} />
      </Box>
    );
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={END_WORK_TITLE} />
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>
            Current branch: <Text color="yellow" bold>{currentBranch}</Text>
          </Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text color="red">
            This will delete the branch locally and remotely (if exists).
          </Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>
            Are you sure? <Text color="green">(y/n)</Text>
          </Text>
        </Box>
        {/* <Footer navigation="" showBack={!!onBack} /> */}
      </Box>
    );
  }

  if (step === 'base-input') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={END_WORK_TITLE} />
        <BranchInput
          label="Base branch to return to:"
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
      <Box flexDirection="column" alignItems='center'>
        <Header title={END_WORK_TITLE} />
        <Spinner label="Finishing feature branch..." />
        <Box marginTop={1} alignItems='flex-start'>
          <Text dimColor>Deleting: {currentBranch}</Text>
        </Box>
        <Box alignItems='flex-start'>
          <Text dimColor>Returning to: {baseBranch}</Text>
        </Box>
      </Box>
    );
  }

  // step === 'done'
  return (
    <Box flexDirection="column" alignItems='center'>
      <Header title={END_WORK_TITLE} />
      <StatusMessage
        type="success"
        message="Feature branch workflow complete!"
        details={[
          `Deleted local branch: ${currentBranch}`,
          remoteDeleted
            ? `Deleted remote branch: origin/${currentBranch}`
            : 'Remote branch not found or already deleted',
          `Now on ${baseBranch} with latest changes`,
        ]}
      />
    </Box>
  );
}
