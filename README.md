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

### 🚀 Start Feature

Create a new feature branch from a base branch (develop/main/master).

- Automatically detects the base branch
- Fetches latest changes from remote
- Creates and switches to your new feature branch

### 🏁 Finish Feature

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

# Reinstall globally after making changes
npm install -g .
```

## Examples

### Creating a Feature Branch

```bash
gz
# Select "🚀 Start Feature"
# Enter branch name: "feature/user-auth"
# Press Enter to use detected base (develop)
# Done! ✅
```

### Cleaning Up After Merge

```bash
gz
# Select "🏁 Finish Feature"
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
