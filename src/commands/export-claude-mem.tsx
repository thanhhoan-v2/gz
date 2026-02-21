import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { execa } from "execa";
import { CommandLayout } from "../components/command-layout.js";
import { Spinner } from "../components/spinner.js";
import { StatusMessage } from "../components/status-message.js";
import os from "os";
import path from "path";
import * as fs from "fs/promises";

type Step = "confirm" | "executing" | "done" | "error";

export const EXPORT_CLAUDE_MEM_TITLE = "󰄛  Export claude-mem";

const HOME = os.homedir();
const SCRIPT_PATH = path.join(
  HOME,
  ".claude_hoan@team-mint.io",
  "skills",
  "utils-claude_mem",
  "lib",
  "export-to-markdown.js",
);
const OUTPUT_DIR = path.join(HOME, ".claude-mem", "markdown-export");

interface ExportClaudeMemProps {
  onBack?: () => void;
}

export function ExportClaudeMem({ onBack }: ExportClaudeMemProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>("confirm");
  const [error, setError] = useState("");
  const [exportResults, setExportResults] = useState<string[]>([]);

  // Handle keyboard input
  useInput((input, key) => {
    if (step !== "confirm") return;

    // Export with Enter
    if (key.return) {
      setStep("executing");
    }

    // Cancel with Escape or Backspace
    if (key.escape || key.backspace) {
      if (onBack) {
        onBack();
      } else {
        exit();
      }
    }
  });

  useEffect(() => {
    if (step !== "executing") return;

    async function executeExport() {
      try {
        const { stdout } = await execa("node", [SCRIPT_PATH], {
          cwd: path.dirname(SCRIPT_PATH),
        });

        const lines = stdout.split("\n").filter((line) => line.trim() !== "");
        setExportResults(lines);
        setStep("done");
        setTimeout(() => exit(), 3000);
      } catch (err: any) {
        setError(err.message || "Export failed");
        setStep("error");
      }
    }

    executeExport();
  }, [step, exit]);

  if (step === "confirm") {
    return (
      <CommandLayout title={EXPORT_CLAUDE_MEM_TITLE}>
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>
            This will export all memories from claude-mem database to markdown
            files.
          </Text>
          <Box marginTop={1}>
            <Text dimColor>
              Output directory: <Text color="cyan">{OUTPUT_DIR}</Text>
            </Text>
          </Box>
        </Box>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text dimColor>
              <Text color="yellow">[Enter]</Text> Export{" "}
              <Text color="dimColor">|</Text> <Text color="yellow">[Esc]</Text>{" "}
              Cancel
            </Text>
          </Box>
        </Box>
      </CommandLayout>
    );
  }

  if (step === "executing") {
    return (
      <Box flexDirection="column">
        <Spinner label="Exporting claude-mem to markdown..." />
        <Box marginTop={1}>
          <Text dimColor>Running: node {SCRIPT_PATH}</Text>
        </Box>
      </Box>
    );
  }

  if (step === "error") {
    return (
      <Box flexDirection="column">
        <StatusMessage type="error" message={error} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <StatusMessage
        type="success"
        message="Claude-mem exported successfully!"
        details={exportResults}
      />
    </Box>
  );
}

export default ExportClaudeMem;
