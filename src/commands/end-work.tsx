import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {BranchInput} from '../components/branch-input.js';
import {Spinner} from '../components/spinner.js';
import {StatusMessage} from '../components/status-message.js';
import {CommandLayout} from '../components/command-layout.js';
import {detectBaseBranch} from '../utils/branch-detector.js';
import * as git from '../utils/git.js';
import { END_WORK_TITLE } from '../constants.js';

type Step = 'check' | 'pushing' | 'wait-pr' | 'base-input' | 'executing' | 'done' | 'error';

interface EndWorkProps {
  onBack?: () => void;
  has_pushed?: boolean;
}

export function EndWork({onBack, has_pushed = false}: EndWorkProps) {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('check');
  const [currentBranch, setCurrentBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [detectedBase, setDetectedBase] = useState('');
  const [error, setError] = useState('');
  const [remoteDeleted, setRemoteDeleted] = useState(false);
  const [prUrl, setPrUrl] = useState('');

  // Handle input and Esc/Backspace
  useInput((input, key) => {
    // Don't handle during loading/executing/done states
    if (step === 'check' || step === 'pushing' || step === 'executing' || step === 'done') return;

    // PR confirmation input
    if (step === 'wait-pr') {
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


        if (status.hasUncommittedChanges) {
          setError('You have uncommitted changes. Please commit or stash them first.');
          setStep('error');
          return;
        }

        setCurrentBranch(status.currentBranch);
        // If current branch is protected, use it as the base branch
        // Otherwise, detect the appropriate base branch
        const detected = git.isProtectedBranch(status.currentBranch)
          ? status.currentBranch
          : detectBaseBranch();
        setDetectedBase(detected);

        if (has_pushed) {
          // Skip pushing, generate PR URL directly
          const url = await git.getGitHubPRUrl(detected, status.currentBranch);
          setPrUrl(url);
          setStep('wait-pr');
        } else {
          setStep('pushing');
        }
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    check();
  }, []);

  // Push feature branch to remote
  useEffect(() => {
    if (step !== 'pushing') return;

    async function push() {
      try {
        await git.pushBranch(currentBranch);

        // Generate PR URL
        const url = await git.getGitHubPRUrl(detectedBase, currentBranch);
        setPrUrl(url);

        setStep('wait-pr');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    push();
  }, [step, currentBranch, detectedBase]);

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

        // Only delete branch if it's not protected
        if (!git.isProtectedBranch(currentBranch)) {
          // Delete local branch
          await git.deleteBranch(currentBranch, true);

          // Delete remote branch
          const deleted = await git.deleteRemoteBranch(currentBranch);
          setRemoteDeleted(deleted);
        } else {
          // Don't delete protected branches
          setRemoteDeleted(false);
        }

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
      <CommandLayout title={END_WORK_TITLE}>
        <Spinner label="Checking feature branch status..." />
      </CommandLayout>
    );
  }

  if (step === 'error') {
    return (
      <CommandLayout title={END_WORK_TITLE}>
        <StatusMessage type="error" message={error} />
      </CommandLayout>
    );
  }

  if (step === 'pushing') {
    return (
      <CommandLayout title={END_WORK_TITLE}>
        <Spinner label="Pushing feature branch to remote..." />
        <Box marginTop={1} alignItems='flex-start'>
          <Text dimColor>Branch: {currentBranch}</Text>
        </Box>
      </CommandLayout>
    );
  }

  if (step === 'wait-pr') {
    return (
      <CommandLayout title={END_WORK_TITLE}>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>
            Branch pushed: <Text color="yellow" bold>{currentBranch}</Text>
          </Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text color="cyan">
            Waiting for PR creation and merge...
          </Text>
        </Box>
        {prUrl && (
          <Box marginBottom={1} alignItems='flex-start'>
            <Text>
              Create PR: <Text color="blue" underline>{prUrl}</Text>
            </Text>
          </Box>
        )}
        <Box marginBottom={1} alignItems='flex-start'>
          <Text dimColor>
            1. Create a Pull Request for this branch
          </Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text dimColor>
            2. Get it reviewed and merged
          </Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>
            Ready to continue? <Text color="green">(y/n)</Text>
          </Text>
        </Box>
      </CommandLayout>
    );
  }

  if (step === 'base-input') {
    return (
      <CommandLayout title={END_WORK_TITLE}>
        <BranchInput
          label="Base branch to return to:"
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
    const isProtected = git.isProtectedBranch(currentBranch);
    return (
      <CommandLayout title={END_WORK_TITLE}>
        <Spinner label={isProtected ? "Finishing workflow..." : "Finishing feature branch..."} />
        <Box marginTop={1} alignItems='flex-start'>
          <Text dimColor>
            {isProtected ? `Keeping branch: ${currentBranch}` : `Deleting: ${currentBranch}`}
          </Text>
        </Box>
        <Box alignItems='flex-start'>
          <Text dimColor>Returning to: {baseBranch}</Text>
        </Box>
      </CommandLayout>
    );
  }

  // step === 'done'
  const isProtected = git.isProtectedBranch(currentBranch);
  return (
    <CommandLayout title={END_WORK_TITLE}>
      <StatusMessage
        type="success"
        message={isProtected ? "Workflow complete!" : "Feature branch workflow complete!"}
        details={[
          isProtected
            ? `Kept protected branch: ${currentBranch}`
            : `Deleted local branch: ${currentBranch}`,
          isProtected
            ? 'Protected branch preserved'
            : remoteDeleted
              ? `Deleted remote branch: origin/${currentBranch}`
              : 'Remote branch not found or already deleted',
          `Now on ${baseBranch} with latest changes`,
        ]}
      />
    </CommandLayout>
  );
}
