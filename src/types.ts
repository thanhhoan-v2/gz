export interface GitStatus {
  isRepo: boolean;
  hasUncommittedChanges: boolean;
  currentBranch: string;
  uncommittedCount?: number;
}

export interface RepositoryInfo {
  repoName: string;
  currentBranch: string;
  uncommittedCount: number;
}

export interface Branch {
  name: string;
  isRemote: boolean;
  lastCommitDate: Date;
  isGone: boolean;
}

export interface MenuAction {
  label: string;
  value: string;
}

export interface RecentBranchStore {
  branches: string[];
  maxRecent: number;
}

export type CommandType =
  | 'start-feature'
  | 'end-work'
  | 'switch-branch'
  | 'sync-remote'
  | 'bring-changes'
  | 'sync-claude-config'
  | 'sync-personal-projects'
  | 'commit-claude';
