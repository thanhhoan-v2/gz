import {execa} from 'execa';
import type {GitStatus, Branch} from '../types.js';

/**
 * Execute a git command safely
 */
async function execGit(args: string[], options?: {cwd?: string}): Promise<string> {
  try {
    const {stdout} = await execa('git', args, {
      cwd: options?.cwd || process.cwd(),
    });
    return stdout.trim();
  } catch (error: any) {
    throw new Error(error.stderr || error.message);
  }
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    await execGit(['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current git status
 */
export async function getGitStatus(): Promise<GitStatus> {
  const isRepo = await isGitRepo();

  if (!isRepo) {
    return {
      isRepo: false,
      hasUncommittedChanges: false,
      currentBranch: '',
    };
  }

  const currentBranch = await execGit(['branch', '--show-current']);

  // Check for uncommitted changes (staged + unstaged)
  const diffIndex = await execGit(['diff-index', '--quiet', 'HEAD', '--'])
    .then(() => false)
    .catch(() => true);

  return {
    isRepo: true,
    hasUncommittedChanges: diffIndex,
    currentBranch,
  };
}

/**
 * Get all local branches sorted by commit date
 */
export async function getLocalBranches(): Promise<Branch[]> {
  const output = await execGit([
    'for-each-ref',
    '--format=%(refname:short)|%(committerdate:iso)|%(upstream:track)',
    '--sort=-committerdate',
    'refs/heads/',
  ]);

  if (!output) return [];

  return output.split('\n').map((line) => {
    const [name, dateStr, tracking] = line.split('|');
    return {
      name,
      isRemote: false,
      lastCommitDate: new Date(dateStr),
      isGone: tracking === '[gone]',
    };
  });
}

/**
 * Get branches that are marked as [gone] (deleted on remote)
 */
export async function getGoneBranches(): Promise<Branch[]> {
  const branches = await getLocalBranches();
  return branches.filter((b) => b.isGone);
}

/**
 * Checkout to a branch
 */
export async function checkoutBranch(branchName: string): Promise<void> {
  await execGit(['checkout', branchName]);
}

/**
 * Create and checkout a new branch
 */
export async function createBranch(branchName: string): Promise<void> {
  await execGit(['checkout', '-b', branchName]);
}

/**
 * Delete a local branch
 */
export async function deleteBranch(branchName: string, force = true): Promise<void> {
  await execGit(['branch', force ? '-D' : '-d', branchName]);
}

/**
 * Delete a remote branch
 */
export async function deleteRemoteBranch(branchName: string): Promise<boolean> {
  try {
    await execGit(['push', 'origin', '--delete', branchName]);
    return true;
  } catch {
    return false; // Branch might not exist on remote
  }
}

/**
 * Fetch from origin
 */
export async function fetchOrigin(): Promise<void> {
  await execGit(['fetch', 'origin']);
}

/**
 * Fetch with prune to update remote tracking branches
 */
export async function fetchPrune(): Promise<void> {
  await execGit(['fetch', '--prune']);
}

/**
 * Reset to origin branch (hard reset)
 */
export async function resetToOrigin(branchName: string): Promise<void> {
  await execGit(['reset', '--hard', `origin/${branchName}`]);
}

/**
 * Stash current changes with a message
 */
export async function stashChanges(message: string): Promise<void> {
  await execGit(['stash', 'push', '-m', message]);
}

/**
 * Pop the latest stash
 */
export async function stashPop(): Promise<void> {
  await execGit(['stash', 'pop']);
}

/**
 * Check if a branch is protected (main, master, develop)
 */
export function isProtectedBranch(branchName: string): boolean {
  const protected_ = ['main', 'master', 'develop'];
  return protected_.includes(branchName.toLowerCase());
}

/**
 * Get remote URL
 */
export async function getRemoteUrl(): Promise<string> {
  try {
    return await execGit(['remote', 'get-url', 'origin']);
  } catch {
    return '';
  }
}

/**
 * Get repository name from remote URL
 */
export async function getRepoName(): Promise<string> {
  const url = await getRemoteUrl();
  if (!url) return '';

  const match = url.match(/[:/]([^/]+?)(?:\.git)?$/);
  return match ? match[1] : '';
}
