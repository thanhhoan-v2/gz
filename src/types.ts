export interface GitStatus {
  isRepo: boolean;
  hasUncommittedChanges: boolean;
  currentBranch: string;
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
  | 'finish-feature'
  | 'switch-branch'
  | 'sync-remote'
  | 'bring-changes';
