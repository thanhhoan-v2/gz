import type { MenuAction } from './types.js';

export const START_WORK_TITLE = '  Start Work';
export const END_WORK_TITLE = '  End Work';
export const SWITCH_BRANCH_TITLE = '󰖂  Switch Branch';
export const SYNC_REMOTE_BRANCHES_TITLE = '󰭟  Sync Remote Branches';
export const BRING_CHANGES_TITLE = '  Bring Changes to Another Branch';
export const COMMIT_CLAUDE_TITLE = '  Commit w Claude';
export const SYNC_CLAUDE_CONFIG_TITLE = '  Sync Claude config';
export const SYNC_PERSONAL_PROJECTS_TITLE = '󰍳  Sync Personal Projects';

export const MENU_ITEMS: MenuAction[] = [
    { label: START_WORK_TITLE, value: 'start-feature' },
    { label: END_WORK_TITLE, value: 'end-work' },
    { label: SWITCH_BRANCH_TITLE, value: 'switch-branch' },
    { label: SYNC_REMOTE_BRANCHES_TITLE, value: 'sync-remote' },
    { label: BRING_CHANGES_TITLE, value: 'bring-changes' },
    { label: COMMIT_CLAUDE_TITLE, value: 'commit-claude' },
    { label: SYNC_CLAUDE_CONFIG_TITLE, value: 'sync-claude-config' },
    { label: SYNC_PERSONAL_PROJECTS_TITLE, value: 'sync-personal-projects' },
];
