import Conf from 'conf';
import type {RecentBranchStore} from '../types.js';

const config = new Conf<RecentBranchStore>({
  projectName: 'gz',
  defaults: {
    branches: [],
    maxRecent: 10,
  },
});

/**
 * Add a branch to recent history
 */
export function addRecentBranch(branchName: string): void {
  const branches = config.get('branches', []);
  const maxRecent = config.get('maxRecent', 10);

  // Remove branch if it already exists
  const filtered = branches.filter((b) => b !== branchName);

  // Add to beginning
  filtered.unshift(branchName);

  // Keep only maxRecent items
  const updated = filtered.slice(0, maxRecent);

  config.set('branches', updated);
}

/**
 * Get recent branches
 */
export function getRecentBranches(): string[] {
  return config.get('branches', []);
}

/**
 * Clear recent branches
 */
export function clearRecentBranches(): void {
  config.set('branches', []);
}
