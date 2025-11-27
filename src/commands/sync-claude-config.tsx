import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { execa } from 'execa';
import { CustomSelectInput } from '../components/custom-select-input.js';
import { Spinner } from '../components/spinner.js';
import { StatusMessage } from '../components/status-message.js';
import { CommandLayout } from '../components/command-layout.js';
import type { MenuAction } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';
import { SYNC_CLAUDE_CONFIG_TITLE } from '../constants.js';

type Step = 'select' | 'confirm' | 'executing' | 'done' | 'error';

interface SyncOption {
  label: string;
  value: string;
  source: string;
  targets: string[];
  description: string;
}

const HOME = os.homedir();

const syncOptions: SyncOption[] = [
  {
    label: 'HOAN → GLOBAL & ~/.claude',
    value: 'hoan-to-global-claude',
    source: path.join(HOME, '.claude_hoan@team-mint.io'),
    targets: [path.join(HOME, '.claude_global@team-mint.io'), path.join(HOME, '.claude')],
    description: 'Sync personal config to global and home claude directories',
  },
  {
    label: 'GLOBAL →  HOAN & ~/.claude',
    value: 'global-to-hoan-claude',
    source: path.join(HOME, '.claude_global@team-mint.io'),
    targets: [path.join(HOME, '.claude_hoan@team-mint.io'), path.join(HOME, '.claude')],
    description: 'Sync global config to personal and home claude directories',
  },
  {
    label: 'HOAN → Current Dir',
    value: 'hoan-to-current',
    source: path.join(HOME, '.claude_hoan@team-mint.io'),
    targets: ['CURRENT_DIR'], // Special marker for current directory
    description: 'Sync personal config to current project directory',
  },
];

interface SyncClaudeConfigProps {
  onBack?: () => void;
}

export function SyncClaudeConfig({ onBack }: SyncClaudeConfigProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('select');
  const [selectedOption, setSelectedOption] = useState<SyncOption | null>(null);
  const [error, setError] = useState('');
  const [syncResults, setSyncResults] = useState<string[]>([]);

  const menuItems: MenuAction[] = syncOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  // Execute sync
  useEffect(() => {
    if (step !== 'executing' || !selectedOption) return;

    async function execute() {
      try {
        const results: string[] = [];
        const source = selectedOption!.source;

        // Check if source exists
        try {
          await fs.access(source);
        } catch {
          throw new Error(`Source directory not found: ${source}`);
        }

        for (const target of selectedOption!.targets) {
          const actualTarget =
            target === 'CURRENT_DIR'
              ? path.join(process.cwd(), '.claude')
              : target;

          // Create target directory if it doesn't exist
          await fs.mkdir(actualTarget, { recursive: true });

          // Use rsync for reliable sync (excludes .git and node_modules)
          await execa('rsync', [
            '-av',
            '--delete',
            '--exclude',
            '.git',
            '--exclude',
            'node_modules',
            `${source}/`,
            `${actualTarget}/`,
          ]);

          results.push(`✓ ${source} → ${actualTarget}`);
        }

        setSyncResults(results);
        setStep('done');
        setTimeout(() => exit(), 3000);
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    execute();
  }, [step, selectedOption, exit]);

  if (step === 'select') {
    return (
      <CommandLayout title={SYNC_CLAUDE_CONFIG_TITLE}>
        <Box marginBottom={1} alignItems='flex-start'>
          <Text dimColor>Select sync direction:</Text>
        </Box>
        <CustomSelectInput
          items={menuItems}
          onSelect={(item) => {
            const option = syncOptions.find((o) => o.value === item.value);
            if (option) {
              setSelectedOption(option);
              setStep('executing');
            }
          }}
          onBack={onBack}
        />
      </CommandLayout>
    );
  }

  if (step === 'executing') {
    return (
      <Box flexDirection="column">
        <Spinner label="Syncing Claude configuration..." />
        {selectedOption && (
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>From: {selectedOption.source}</Text>
            {selectedOption.targets.map((target, i) => (
              <Text key={i} dimColor>
                To:{' '}
                {target === 'CURRENT_DIR'
                  ? path.join(process.cwd(), '.claude')
                  : target}
              </Text>
            ))}
          </Box>
        )}
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

  // step === 'done'
  return (
    <Box flexDirection="column">
      <StatusMessage
        type="success"
        message="Claude configuration synced successfully!"
        details={syncResults}
      />
    </Box>
  );
}
