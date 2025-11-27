import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { execa } from 'execa';
import { Spinner } from '../components/Spinner.js';
import { StatusMessage } from '../components/StatusMessage.js';
import { SYNC_PERSONAL_PROJECTS_TITLE } from '../constants.js';
import { Header } from '../components/Header.js';
type Step = 'check-auth' | 'switch-user' | 'confirm' | 'executing' | 'done' | 'error';

interface SyncPersonalProjectsProps {
  onBack?: () => void;
}

export function SyncPersonalProjects({ onBack }: SyncPersonalProjectsProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('check-auth');
  const [error, setError] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');

  // Check GitHub auth status on mount
  useEffect(() => {
    if (step !== 'check-auth') return;

    async function checkAuth() {
      try {
        const { stdout } = await execa('gh', ['auth', 'status']);

        // Parse multiple accounts and find the active one
        const lines = stdout.split('\n');
        let activeAccount = '';
        let currentAccount = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Match "Logged in to github.com account <account-name>"
          const accountMatch = line.match(/Logged in to .* account ([^\s(]+)/);
          if (accountMatch) {
            currentAccount = accountMatch[1];
          }

          // Check if this account is active
          if (line.includes('Active account: true')) {
            activeAccount = currentAccount;
            break;
          }
        }

        if (activeAccount) {
          setCurrentUser(activeAccount);
          // Check if it's a work account (adrian-teammint-io or hoan@team-mint.io)
          if (activeAccount === 'adrian-teammint-io' || activeAccount === 'hoan@team-mint.io') {
            setStep('switch-user');
          } else {
            setStep('confirm');
          }
        } else {
          // Fallback: try to find any account
          const fallbackMatch = stdout.match(/Logged in to .* account ([^\s(]+)/);
          if (fallbackMatch) {
            setCurrentUser(fallbackMatch[1]);
          }
          setStep('confirm');
        }
      } catch (err: any) {
        // If gh auth status fails, proceed anyway
        setStep('confirm');
      }
    }

    checkAuth();
  }, [step]);

  // Handle keyboard input
  useInput((input, key) => {
    if (step === 'switch-user') {
      if (input === 'y' || input === 'Y') {
        // Switch to personal account
        setStep('executing');
        // The switch will happen in the execute function
      } else if (input === 'n' || input === 'N' || key.escape) {
        if (onBack) {
          onBack();
        } else {
          exit();
        }
      }
    } else if (step === 'confirm') {
      if (input === 'y' || input === 'Y') {
        setStep('executing');
      } else if (input === 'n' || input === 'N' || key.escape) {
        if (onBack) {
          onBack();
        } else {
          exit();
        }
      }
    }
  });

  // Execute sync
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      const logs: string[] = [];
      const failedRepos: string[] = [];

      try {
        // Switch to personal account if needed
        if (currentUser === 'adrian-teammint-io' || currentUser === 'hoan@team-mint.io') {
          try {
            await execa('gh', ['auth', 'switch', '--user', 'thanhhoan-v2']);
            logs.push('Switched to personal account');
            setOutput([...logs]);
          } catch (switchErr: any) {
            logs.push(`Failed to switch account: ${switchErr.message || 'Unknown error'}`);
            logs.push('Continuing with current account...');
            setOutput([...logs]);
          }
        }
        // Generate commit message with date
        const commitDate = new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const commitMsg = `chore(ℑ): bulk update - ${commitDate}`;

        // Define repositories to sync
        const repos = [
          {
            name: 'Obsidian Notes',
            path: '/Users/adrian-phan.team-mint.io/personal-projects/obsidian_notes',
          },
          {
            name: 'Dotfiles',
            path: '/Users/adrian-phan.team-mint.io/.config',
          },
          {
            name: 'Claude Config',
            path: '/Users/adrian-phan.team-mint.io/.claude',
          },
          {
            name: 'gz',
            path: '/Users/adrian-phan.team-mint.io/personal-projects/gz',
          },
        ];

        // Process each repository
        for (const repo of repos) {
          try {
            // git add .
            await execa('git', ['add', '.'], {
              cwd: repo.path,
            });

            // git commit (allow failure if no changes)
            try {
              await execa('git', ['commit', '-m', commitMsg], {
                cwd: repo.path,
              });
            } catch (commitErr: any) {
              // Ignore commit errors (no changes to commit)
              // This is expected behavior from the fish function
            }

            // git push origin main
            try {
              await execa('git', ['push', 'origin', 'main'], {
                cwd: repo.path,
              });
              logs.push(`${repo.name} synced`);
            } catch (pushErr: any) {
              logs.push(`Failed to push ${repo.name}`);
              failedRepos.push(repo.name);
            }
          } catch (err: any) {
            logs.push(`Failed to process ${repo.name}`);
            failedRepos.push(repo.name);
          }

          setOutput([...logs]);
        }

        // Summary
        if (failedRepos.length > 0) {
          logs.push(`Sync completed with errors: ${failedRepos.join(', ')}`);
        }

        setOutput(logs);
        setStep('done');
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            exit();
          }
        }, 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to sync personal projects');
        if (err.stdout) {
          logs.push(err.stdout);
        }
        if (err.stderr) {
          logs.push(err.stderr);
        }
        setOutput(logs);
        setStep('error');
      }
    }

    execute();
  }, [step, exit, onBack, currentUser]);

  if (step === 'check-auth') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={SYNC_PERSONAL_PROJECTS_TITLE} />
        <Spinner label="Checking GitHub authentication..." />
      </Box>
    );
  }

  if (step === 'switch-user') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={SYNC_PERSONAL_PROJECTS_TITLE} />
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>Current GitHub user: {currentUser}</Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>You need to switch to your personal account to sync personal repositories.</Text>
        </Box>
        <Box marginTop={1} alignItems='flex-start'>
          <Text>Switch to personal account? (y/n)</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={SYNC_PERSONAL_PROJECTS_TITLE} />
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>This will sync all your personal repositories:</Text>
        </Box>
        <Box flexDirection="column" marginLeft={2} marginBottom={1} alignItems='flex-start'>
          <Text dimColor>• Obsidian Notes</Text>
          <Text dimColor>• Dotfiles (.config)</Text>
          <Text dimColor>• Claude Config (.claude)</Text>
          <Text dimColor>• gz</Text>
        </Box>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text>Each repo will be:</Text>
        </Box>
        <Box flexDirection="column" marginLeft={2} marginBottom={1} alignItems='flex-start'>
          <Text dimColor>1. Staged (git add .)</Text>
          <Text dimColor>2. Committed (chore(ℑ): bulk update - [date])</Text>
          <Text dimColor>3. Pushed to origin main</Text>
        </Box>
        <Box marginTop={1} alignItems='flex-start'>
          <Text>Continue? (y/n)</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={SYNC_PERSONAL_PROJECTS_TITLE} />
        <StatusMessage type="error" message={error} />
        {output.length > 0 && (
          <Box flexDirection="column" marginTop={1} alignItems='flex-start'>
            <Text bold>Output:</Text>
            {output.map((line, i) => (
              <Text key={i} dimColor>
                {line}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  if (step === 'executing') {
    return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={SYNC_PERSONAL_PROJECTS_TITLE} />
        <Spinner label="Syncing personal projects..." />
        {output.length > 0 && (
          <Box flexDirection="column" marginTop={1} alignItems='flex-start'>
            {output.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // step === 'done'
  return (
      <Box flexDirection="column" alignItems='center'>
        <Header title={SYNC_PERSONAL_PROJECTS_TITLE} />
        <StatusMessage type="success" message="All personal projects synced!" />
      {output.length > 0 && (
        <Box flexDirection="column" marginTop={1} borderStyle="round" padding={1} alignItems='flex-start'>
          {output.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
