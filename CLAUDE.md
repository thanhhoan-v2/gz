# gz - Git Workflow CLI

An interactive terminal application for streamlined Git workflows, built with React Ink and TypeScript.

## Overview

gz provides an intuitive, menu-driven interface for common Git operations:

- **Start Work**: Create feature branches from a base branch with automatic sync
- **End Work**: Clean up feature branches (local + remote) after merging
- **Switch Branch**: Quick branch switching with fuzzy search and recent history
- **Sync Remote Branches**: Prune local branches deleted on remote ([gone])
- **Bring Changes**: Move uncommitted changes between branches via stash
- **Commit with Claude**: Interactive commit using Claude Code with customizable options (push after commit, bring changes to separate branch)

## Architecture

### Technology Stack

- **React Ink**: Terminal UI framework using React components
- **TypeScript**: Full type safety across the codebase
- **execa**: Safe git command execution
- **fuzzy**: Fuzzy search for branch filtering
- **conf**: Persistent storage for recent branches
- **ink-select-input**: Interactive menu selection
- **ink-text-input**: User text input handling

### Project Structure

```
gz/
├── src/
│   ├── cli.tsx                    # Main entry point & menu router
│   ├── commands/                  # Command implementations
│   │   ├── start-feature.tsx      # Start Work workflow
│   │   ├── end-work.tsx     # End Work workflow
│   │   ├── branch-switcher.tsx    # Branch switching with fuzzy search
│   │   ├── sync-remote-branches.tsx
│   │   ├── bring-changes.tsx
│   │   └── commit-claude.tsx      # Claude Code commit integration
│   ├── components/                # Reusable UI components
│   │   ├── Menu.tsx               # Main menu component
│   │   ├── BranchInput.tsx        # Smart branch input
│   │   ├── Spinner.tsx            # Loading indicator
│   │   └── StatusMessage.tsx      # Success/error messages
│   ├── utils/                     # Utility functions
│   │   ├── git.ts                 # Git operation wrappers
│   │   ├── branch-detector.ts     # Smart base branch detection
│   │   └── recent-branches.ts     # Recent branch tracking
│   └── types.ts                   # TypeScript type definitions
├── dist/                          # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── CLAUDE.md                      # This file

```

### Design Principles

1. **Step-based workflows**: Each command follows a clear step progression (check → input → execute → done)
2. **Error handling**: All git operations wrapped with try-catch and user-friendly error messages
3. **Safety first**: Checks for uncommitted changes, protected branches, git repo existence
4. **Smart defaults**: Auto-detect base branches, show recent branches first
5. **Confirmation for destructive actions**: Ask before deleting branches or making irreversible changes

### Naming Conventions

**File Naming**: All files must use kebab-case (lowercase with hyphens) format:
- ✓ Correct: `my-command.tsx`, `branch-detector.ts`, `status-message.tsx`
- ✗ Wrong: `MyCommand.tsx`, `branchDetector.ts`, `StatusMessage.tsx`

This convention applies to all new files created in the codebase, including commands, components, utilities, and types.

## Adding New Commands

### Step 1: Create Command Component

Create a new file in `src/commands/`:

```tsx
// src/commands/my-command.tsx
import React, {useState, useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import {Spinner} from '../components/Spinner.js';
import {StatusMessage} from '../components/StatusMessage.js';
import * as git from '../utils/git.js';

type Step = 'check' | 'input' | 'executing' | 'done' | 'error';

export function MyCommand() {
  const {exit} = useApp();
  const [step, setStep] = useState<Step>('check');
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
        setStep('input');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }
    check();
  }, []);

  // Execute command
  useEffect(() => {
    if (step !== 'executing') return;

    async function execute() {
      try {
        // Your git operations here
        setStep('done');
        setTimeout(() => exit(), 2000);
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    }

    execute();
  }, [step, exit]);

  if (step === 'check') {
    return <Spinner label="Checking..." />;
  }

  if (step === 'error') {
    return <StatusMessage type="error" message={error} />;
  }

  if (step === 'input') {
    // Your input UI here
    return <Text>Input UI</Text>;
  }

  if (step === 'executing') {
    return <Spinner label="Executing..." />;
  }

  // step === 'done'
  return <StatusMessage type="success" message="Done!" />;
}
```

### Step 2: Add to Types

Update `src/types.ts`:

```typescript
export type CommandType =
  | 'start-feature'
  | 'end-work'
  | 'switch-branch'
  | 'sync-remote'
  | 'bring-changes'
  | 'my-command';  // Add your command
```

### Step 3: Register in Main Menu

Update `src/cli.tsx`:

```tsx
import {MyCommand} from './commands/my-command.js';

const menuItems: MenuAction[] = [
  // ... existing items
  {label: '✨ My Command', value: 'my-command'},
];

function App() {
  // ... existing code

  switch (selectedCommand) {
    // ... existing cases
    case 'my-command':
      return <MyCommand />;
  }
}
```

### Step 4: Add Git Operations (if needed)

If your command needs new git operations, add them to `src/utils/git.ts`:

```typescript
/**
 * Your git operation description
 */
export async function myGitOperation(): Promise<void> {
  await execGit(['your', 'git', 'command']);
}
```

## Common Patterns

### Confirmation Dialog

```tsx
const {exit} = useApp();

useInput((input) => {
  if (step !== 'confirm') return;

  if (input === 'y' || input === 'Y') {
    setStep('executing');
  } else if (input === 'n' || input === 'N') {
    exit();
  }
});

// In render:
if (step === 'confirm') {
  return (
    <Box flexDirection="column">
      <Text>Are you sure? <Text color="green">(y/n)</Text></Text>
    </Box>
  );
}
```

### Text Input

```tsx
import TextInput from 'ink-text-input';

const [value, setValue] = useState('');

<TextInput
  value={value}
  onChange={setValue}
  onSubmit={(val) => {
    // Handle submission
  }}
/>
```

### Menu Selection

```tsx
import SelectInput from 'ink-select-input';

const items = [
  {label: 'Option 1', value: 'opt1'},
  {label: 'Option 2', value: 'opt2'},
];

<SelectInput
  items={items}
  onSelect={(item) => {
    console.log(item.value);
  }}
/>
```

### Fuzzy Search

```tsx
import fuzzy from 'fuzzy';

const results = fuzzy.filter(searchQuery, items);
const filtered = results.map(r => r.string);
```

## Development Workflow

### Install Dependencies

```bash
cd ~/personal-projects/gz
pnpm install
```

### Build

```bash
pnpm run build
```

### Test Locally

```bash
pnpm start
```

### Build and Install Globally

**Important**: After modifying any commands, you must rebuild and reinstall globally to test changes:

```bash
pnpm run install-global
```

This command will:
1. Compile TypeScript to JavaScript (`pnpm run build`)
2. Install the CLI globally (`npm install -g .`)

Note: We use `npm` for global installation (not pnpm) to avoid pnpm global bin directory setup issues. Only if the build succeeds will the global installation proceed.

### Publish to npm

```bash
pnpm login
pnpm publish
```

## Best Practices

### Safety Checks

Always check before executing:

```typescript
// Check if in git repo
const status = await git.getGitStatus();
if (!status.isRepo) {
  setError('Not in a git repository');
  return;
}

// Check for uncommitted changes
if (status.hasUncommittedChanges) {
  setError('You have uncommitted changes');
  return;
}

// Check for protected branches
if (git.isProtectedBranch(branchName)) {
  setError('Cannot operate on protected branch');
  return;
}
```

### Error Handling

```typescript
try {
  await git.someOperation();
} catch (err: any) {
  setError(err.message || 'Unknown error occurred');
  setStep('error');
}
```

### Exit Timing

```typescript
setStep('done');
setTimeout(() => exit(), 2000); // Give user time to read success message
```

### Loading States

Always show loading indicators:

```tsx
if (step === 'executing') {
  return <Spinner label="Descriptive message..." />;
}
```

## Extending Git Utilities

Add new git operations to `src/utils/git.ts`:

```typescript
/**
 * Clear description of what this does
 */
export async function yourGitOperation(param: string): Promise<ReturnType> {
  const result = await execGit(['command', 'args', param]);
  return result;
}
```

## Future Command Ideas

- **Create PR**: Open GitHub PR using gh CLI
- **Rebase Current**: Interactive rebase from base branch
- **Cherry Pick**: Interactive cherry-pick from branch history
- **Tag Release**: Create and push semantic version tags
- **Clone Branch**: Copy branch to new name
- **Merge Branch**: Merge selected branch into current
- **View Diff**: Show diff between branches
- **Commit History**: Interactive commit browser

## Troubleshooting

### Build Errors

```bash
# Clean build
rm -rf dist/
npm run build
```

### Type Errors

Ensure all imports use `.js` extensions:

```typescript
import {Component} from './component.js';  // ✓ Correct
import {Component} from './component';     // ✗ Wrong
```

### Module Not Found

Check `package.json` has `"type": "module"` and `tsconfig.json` has `"module": "ES2022"`.

## License

MIT - Feel free to extend and customize!
