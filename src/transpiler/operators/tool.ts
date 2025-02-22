import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { TaskWatch } from "../watch/TaskWatch";
import type { ToolInput } from "../types/ToolInput";
import { ShellError } from "../utils/errors";
import { getStateTaskId } from "../utils/taskContext";

/**
 * Spawns the bun process running "mockBifbofNext.ts" with arguments
 * derived from the given toolInput and additional parameters:
 *
 *  - stateTaskId: a unique id shared by all tool calls in this context
 *  - toolId: a unique id for this particular tool invocation
 *  - toolName: taken from toolInput.name
 *  - modifyRepo: whether the repo is modified
 *  - simulateError: whether to simulate a shell error
 *  - simulateValidationError: whether to simulate a validation error (added to YAML)
 *  - toolInput: a JSON string representing the tool input
 */
async function spawnBifBof(
  toolInput: ToolInput,
  stateTaskId: string,
  toolId: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const args = [
      "mockBifbofNext.ts",
      stateTaskId, // state task id from context
      toolId,      // unique tool id
      toolInput.name,
      toolInput.modifiesRepo ? "true" : "false",
      toolInput.simulateShellError ? "true" : "false",
      toolInput.simulateValidationError ? "true" : "false",
      toolInput.input ? JSON.stringify(toolInput.input) : "{}",
    ];
    const child = spawn("bun", args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      console.log(`[tool] '${toolInput.name}' exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new ShellError(`Tool ${toolInput.name} failed with code ${code}`));
      }
    });
  });
}

/**
 * tool is an operator that calls bifbof and watches for the new commit.
 * It uses the new TaskWatch to wait for a tool invocation with the unique tool id.
 *
 * The current stateTaskId is automatically provided by the surrounding context (set by task()).
 */
export async function tool(toolInput: ToolInput): Promise<void> {
  // Validate tool input.
  const validationResult = toolInput.validate();
  if (!validationResult.isValid) {
    const errors = validationResult.errors?.join(", ") ?? "Unknown validation error";
    throw new Error(`Invalid ToolInput: ${errors}`);
  }

  // Retrieve the state task id from the context.
  const stateTaskId = getStateTaskId();
  if (!stateTaskId) {
    throw new Error("No stateTaskId found in context");
  }

  // Generate a unique tool id for this call.
  const uniqueToolId = randomUUID();

  let storedError: unknown = null;
  let watchPromise: Promise<void> = Promise.resolve();

  if (toolInput.modifiesRepo) {
    // Use the new TaskWatch to monitor the state file. It will resolve when
    // an invocation with our unique tool id appears (or reject if an error is present).
    watchPromise = TaskWatch.getInstance()
      .addTask(stateTaskId, uniqueToolId, toolInput.simulateValidationError)
      .catch((err) => {
        storedError = err;
      });
  }

  // A small delay to ensure the watcher is in place.
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Spawn the mock bifbof process with the correct arguments.
  await spawnBifBof(toolInput, stateTaskId, uniqueToolId);

  // Wait for the state watch to resolve.
  await watchPromise;

  if (storedError) {
    throw storedError;
  }
  return watchPromise;
}
