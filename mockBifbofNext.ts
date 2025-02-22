/**
 * mockBifbofNext.ts
 * We use it to mock how real bifbof would add the commit and update the state file.
 * This is a mock; a more careful implementation would be needed to handle the task queue.
 */

import { execSync } from "child_process";
import fs from "fs";
import yaml from "js-yaml";

// Command-line parameters:
// process.argv[2]: stateTaskId (the directory under .bifbof/tasks/)
// process.argv[3]: toolId (the tool invocation id to be updated in the YAML file)
// process.argv[4]: toolName (the tool name to be used in the invocation)
// process.argv[5]: modifyRepo flag ("true" to execute a git commit)
// process.argv[6]: simulateError flag ("true" to simulate an error and exit)
// process.argv[7]: simulateValidationError flag ("true" to add error to YAML)
// process.argv[8]: toolInput JSON string (to be parsed and added under toolInput)
const stateTaskId = process.argv[2] || "mockTask";
const toolId = process.argv[3] || "mockTool";
const toolName = process.argv[4] || "defaultToolName";
const modifyRepo = process.argv[5] === "true";
const simulateError = process.argv[6] === "true";
const simulateValidationError = process.argv[7] === "true";
const toolInputJson = process.argv[8] || "{}";

const commitMessage = `${toolName} - ${toolId}: done`;

export function mockBifbofNext(
  stateTaskId: string,
  toolId: string,
  toolName: string,
  message: string,
  modifyRepo: boolean,
  simulateError: boolean,
  simulateValidationError: boolean,
  toolInputJson: string,
) {
  console.log(`[mock] Running task '${stateTaskId}' for tool '${toolName}' (${toolId})...`);

  if (simulateError) {
    console.error(
      `[mock] Simulated error for task '${stateTaskId}' and tool '${toolName}' (${toolId}). Exiting with code 1.`,
    );
    process.exit(1);
  }

  // Parse the tool input JSON string.
  let toolInput: Record<string, any> = {};
  try {
    toolInput = JSON.parse(toolInputJson);
  } catch (err) {
    console.error(`[mock] Failed to parse toolInput JSON: ${err}`);
  }

  // Define the path to the state file
  const stateFilePath = `.bifbof/tasks/${stateTaskId}/state.yaml`;
  const taskDir = `.bifbof/tasks/${stateTaskId}`;

  // Ensure the task directory exists
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
    console.log(`[mock] Created directory: ${taskDir}`);
  }

  // Create a new tool invocation entry.
  const now = new Date().toISOString();
  const newInvocation: any = {
    type: "invocation",
    toolId,         // the provided tool id
    toolName,       // the provided tool name
    toolInput,      // parsed JSON input as a dictionary
    startedAt: now,
    endedAt: now,
    startCommit: undefined,
    endCommit: undefined,
  };

  // If modifyRepo is true, record the start commit, execute git commit, then record the end commit.
  if (modifyRepo) {
    try {
      // Retrieve the commit hash before making a commit.
      const startCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
      newInvocation.startCommit = startCommit;
      console.log(`[mock] Recorded start commit hash: ${startCommit}`);

      // Execute the git commit command.
      execSync(`git commit --allow-empty -m "${message}"`, { stdio: "inherit" });

      // Retrieve the commit hash after commit.
      const endCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
      newInvocation.endCommit = endCommit;
      console.log(`[mock] Recorded end commit hash: ${endCommit}`);
    } catch (err) {
      console.error("[mock] Git commit failed.", err);
    }
  } else {
    console.log(`[mock] Git commit skipped (modifyRepo flag is false).`);
  }

  // If simulateValidationError is true, add an error field to the invocation.
  if (simulateValidationError) {
    newInvocation.error = "Simulated error";
  }

  // Load existing state (or initialize a new one)
  let state: { toolInvocations: any[] } = { toolInvocations: [] };
  if (fs.existsSync(stateFilePath)) {
    try {
      const content = fs.readFileSync(stateFilePath, "utf-8");
      const parsed = yaml.load(content);
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).toolInvocations)) {
        state = parsed as { toolInvocations: any[] };
      }
    } catch (err) {
      console.error(`[mock] Error reading state file: ${err}`);
    }
  } else {
    console.log(`[mock] No existing state file found at ${stateFilePath}. Creating a new one.`);
  }

  // Append the new invocation to the state's toolInvocations array.
  state.toolInvocations.push(newInvocation);

  // Write back the updated state file.
  try {
    const newYaml = yaml.dump(state);
    fs.writeFileSync(stateFilePath, newYaml, "utf-8");
    console.log(`[mock] Updated state file at ${stateFilePath}`);
  } catch (err) {
    console.error(`[mock] Failed to update state file: ${err}`);
  }

  console.log(`[mock] Task '${stateTaskId}' for tool '${toolName}' (${toolId}) complete.\n`);
}

mockBifbofNext(stateTaskId, toolId, toolName, commitMessage, modifyRepo, simulateError, simulateValidationError, toolInputJson);

