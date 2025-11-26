import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import * as git from "../utils/git.js";
import { RepositoryInfo as RepositoryInfoComponent } from './RepositoryInfo.js';

export function Header({ title }: { title: string }) {
    const [repoInfo, setRepoInfo] = useState<{ repoName: string; currentBranch: string; uncommittedCount: number } | null>(null);

    // Load repository info on mount
    useEffect(() => {
        async function loadRepoInfo() {
            try {
                const status = await git.getGitStatus();
                if (!status.isRepo) return;

                const [repoName, uncommittedCount] = await Promise.all([
                    git.getRepoName(),
                    git.getUncommittedChangesCount(),
                ]);

                setRepoInfo({
                    repoName,
                    currentBranch: status.currentBranch,
                    uncommittedCount,
                });
            } catch {
                // Silently fail if we can't get repo info
            }
        }

        loadRepoInfo();
    }, []);

    return (
        <Box flexDirection="column" padding={1} alignItems="center">
            <Box marginBottom={1}>
                <Text bold color="magenta">
                    {title}
                </Text>
            </Box>
            {/* {repoInfo && (
                <RepositoryInfoComponent
                    repoName={repoInfo.repoName}
                    currentBranch={repoInfo.currentBranch}
                    uncommittedCount={repoInfo.uncommittedCount}
                />
            )} */}
            <Text>                         </Text>
        </Box>
    );
}