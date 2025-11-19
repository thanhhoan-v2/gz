import {execaSync} from 'execa';

/**
 * Detect the likely base branch from common patterns
 * Priority: develop > main > master
 */
export function detectBaseBranch(): string {
  try {
    // Get all local branches
    const {stdout} = execaSync('git', ['branch', '--format=%(refname:short)']);
    const branches = stdout.split('\n').filter(Boolean);

    // Check in priority order
    if (branches.includes('develop')) return 'develop';
    if (branches.includes('main')) return 'main';
    if (branches.includes('master')) return 'master';

    // Fallback to first branch if no common base found
    return branches[0] || 'main';
  } catch {
    // Default fallback if git command fails
    return 'develop';
  }
}

/**
 * Get the default branch from remote
 */
export async function getRemoteDefaultBranch(): Promise<string> {
  try {
    const {stdout} = await execaSync('git', [
      'symbolic-ref',
      'refs/remotes/origin/HEAD',
      '--short',
    ]);
    return stdout.replace('origin/', '').trim();
  } catch {
    return detectBaseBranch();
  }
}
