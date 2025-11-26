# gz ⚡

> An interactive Git workflow CLI for streamlined feature development

## Installation

Clone the repository and install locally:

```bash
# Clone the repository
git clone <repo-url>
cd gz

# Install dependencies
npm install

# Install globally from local directory
npm install -g .
```

**Verification:**
```bash
gz --version  # Should show the installed version
```

## Usage

Simply run `gz` in any git repository:

```bash
gz
```

You'll see an interactive menu with the following options:

### 🚀 Start Work

Create a new feature branch from a base branch (develop/main/master).

- Automatically detects the base branch
- Fetches latest changes from remote
- Creates and switches to your new feature branch

### 🏁 End Work

Clean up after merging your feature branch.

- Deletes local feature branch
- Deletes remote feature branch (if exists)
- Returns to base branch with latest changes

### 🌿 Switch Branch

Quick branch switching with fuzzy search.

- Shows recent branches first (marked with ★)
- Type to filter branches
- Tracks your 10 most recently used branches

### 🔄 Sync Remote Branches

Clean up local branches that have been deleted on remote.

- Fetches with prune to update tracking
- Shows all [gone] branches
- Deletes them all at once

### 📦 Bring Changes to Another Branch

Move uncommitted changes to a different branch.

- Stashes your current changes
- Switches to target branch
- Applies the stashed changes

## Features

- ✨ **Interactive menus** - No need to remember commands
- 🔍 **Fuzzy search** - Quickly find branches by typing
- 📝 **Smart detection** - Automatically detects base branches
- 🔐 **Safety checks** - Prevents dangerous operations
- ⚡ **Fast** - Optimized git operations
- 🎨 **Beautiful UI** - Clean terminal interface
- ⌨️ **Multiple navigation styles** - Arrow keys, Ctrl+P/N, or vim (j/k)

### Keyboard Shortcuts

Navigate through menus using any of these:

- **Arrow keys**: `↑` / `↓` - Traditional navigation
- **Ctrl shortcuts**: `Ctrl+P` (previous) / `Ctrl+N` (next) - Terminal standard
- **Vim style**: `j` (down) / `k` (up) - For vim enthusiasts
- **Select**: `Enter` or `Space`
- **Exit**: `Ctrl+C`

## Requirements

- Node.js >= 18
- Git installed and configured

## Development

After installation, use these commands for development:

```bash
# Build the project
npm run build

# Test locally without installing globally
npm start
```

### Updating Global Installation

After making changes, update your global installation:

```bash
# If you get EEXIST errors, remove the old symlink first
rm /opt/homebrew/bin/gz  # or wherever your global npm bin is located

# Then install the updated version
npm install -g .
```

**Quick update command:**
```bash
rm $(which gz) 2>/dev/null; npm install -g .
```

## Examples

### Creating a Feature Branch

```bash
gz
# Select "🚀 Start Work"
# Enter branch name: "feature/user-auth"
# Press Enter to use detected base (develop)
# Done! ✅
```

### Cleaning Up After Merge

```bash
gz
# Select "🏁 End Work"
# Confirm deletion (y/n): y
# Press Enter to use detected base (develop)
# Done! Branch deleted locally and remotely ✅
```

### Quick Branch Switch

```bash
gz
# Select "🌿 Switch Branch"
# Type to filter: "feat"
# Select from filtered results
# Done! ✅
```

## License

MIT

## Contributing

Contributions welcome! See [CLAUDE.md](./CLAUDE.md) for development guidelines and how to add new commands.
