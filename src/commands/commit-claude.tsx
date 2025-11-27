import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { execa } from 'execa';
import { Spinner } from '../components/spinner.js';
import { StatusMessage } from '../components/status-message.js';
import { CommandLayout } from '../components/command-layout.js';
import { COMMIT_CLAUDE_TITLE } from '../constants.js';

type Step = 'check' | 'options' | 'executing' | 'done' | 'error';

interface CommitOption {
  id: string;
  label: string;
  flag: string;
  description: string;
}

const commitOptions: CommitOption[] = [
  {
    id: 'shall_push',
    label: 'Push after commit',
    flag: 'shall_push',
    description: 'Automatically push changes to remote after committing',
  },
  {
    id: 'bring_changes',
    label: 'Bring changes to separate branch',
    flag: 'bring_changes',
    description: 'Move changes to a new branch before committing',
  },
];

interface CommitClaudeProps {
  onBack?: () => void;
}

export function CommitClaude({ onBack }: CommitClaudeProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('check');
  const [error, setError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [commitOutput, setCommitOutput] = useState<string[]>([]);

  // Check if git repo and has changes
  useEffect(() => {
    async function check() {
      try {
        // Check if in git repo
        await execa('git', ['rev-parse', '--git-dir']);

        // Check if there are changes to commit
        const { stdout: status } = await execa('git', ['status', '--porcelain']);
        if (!status.trim()) {
          setError('No changes to commit. Working tree is clean.');
          setStep('error');
          return;
        }

        setStep('options');
      } catch (err: any) {
        if (err.message.includes('not a git repository')) {
          setError('Not in a git repository');
        } else {
          setError(err.message);
        }
        setStep('error');
      }
    }

    check();
  }, []);

  // Handle keyboard input for option selection
  useInput((input, key) => {
    if (step !== 'options') return;

    // Navigate up/down
    if (key.upArrow || input === 'k') {
      setHighlightIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setHighlightIndex((prev) => Math.min(commitOptions.length, prev + 1));
    }
    // Toggle selection with space
    else if (input === ' ') {
      if (highlightIndex < commitOptions.length) {
        const optionId = commitOptions[highlightIndex].id;
        setSelectedOptions((prev) => {
          const next = new Set(prev);
          if (next.has(optionId)) {
            next.delete(optionId);
          } else {
            next.add(optionId);
          }
          return next;
        });
      }
    }
    // Confirm with Enter
    else if (key.return) {
      if (highlightIndex === commitOptions.length) {
        // "Continue" option selected
        setStep('executing');
      }
    }
    // Go back: Backspace or Escape
    else if ((key.backspace || key.escape) && onBack) {
      onBack();
    }
  });

  // Execute commit
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      try {
        const output: string[] = [];

        // Build command flags
        const flags = Array.from(selectedOptions)
          .map((id) => commitOptions.find((opt) => opt.id === id)?.flag)
          .filter(Boolean)
          .join(' ');

        output.push('Running: c_hoan /commit' + (flags ? ` ${flags}` : ''));

        // Execute c_hoan with /commit command
        // Note: c_hoan is an alias that sets CLAUDE_CONFIG_DIR
        const command = flags ? `/commit ${flags}` : '/commit';

        const { stdout, stderr } = await execa('bash', [
          '-c',
          `CLAUDE_CONFIG_DIR=~/.claude_hoan@team-mint.io claude --dangerously-skip-permissions -c "${command}"`,
        ]);

        if (stdout) output.push(stdout);
        if (stderr) output.push(stderr);

        setCommitOutput(output);
        setStep('done');
        setTimeout(() => exit(), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to execute commit command');
        setStep('error');
      }
    }

    execute();
  }, [step, selectedOptions, exit]);

  if (step === 'check') {
    return <Spinner label="Checking git repository..." />;
  }

  if (step === 'error') {
    return <StatusMessage type="error" message={error} />;
  }

  if (step === 'options') {
    return (
      <CommandLayout title={COMMIT_CLAUDE_TITLE}>
        <Box marginBottom={1}>
          <Text dimColor>Space to select | Enter to continue</Text>
        </Box>

        {/* Options list */}
        <Box flexDirection="column" alignItems='flex-start'>
          {commitOptions.map((option, index) => {
            const isHighlighted = index === highlightIndex;
            const isSelected = selectedOptions.has(option.id);

            return (
              <Box key={option.id} marginLeft={1}>
                <Text color={isHighlighted ? 'cyan' : undefined}>
                  {isHighlighted ? '› ' : '  '}
                  {isSelected ? '[x]' : '[ ]'} {option.label}
                </Text>
              </Box>
            );
          })}
        </Box>

        {/* Show selected options description */}
        {highlightIndex < commitOptions.length && (
          <Box marginTop={1} paddingX={2} flexDirection="column">
            <Text dimColor>{commitOptions[highlightIndex].description}</Text>
          </Box>
        )}
      </CommandLayout>
    );
  }

  if (step === 'executing') {
    return (
      <Box flexDirection="column">
        <Spinner label="Executing Claude commit..." />
        <Box marginTop={1}>
          <Text dimColor>
            Options: {selectedOptions.size > 0 ? Array.from(selectedOptions).join(', ') : 'none'}
          </Text>
        </Box>
      </Box>
    );
  }

  // step === 'done'
  return (
    <Box flexDirection="column">
      <StatusMessage
        type="success"
        message="Commit executed successfully!"
        details={commitOutput}
      />
    </Box>
  );
}
