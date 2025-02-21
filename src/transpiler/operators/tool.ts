import { spawn } from "child_process";
import { GitWatch } from "../watch/GitWatch";
import type { ToolInput } from "../types/ToolInput";

/**
 * Spawns the "bun" process running "mockBifbofNext.ts" with arguments
 * derived from the given toolInput.
 */
async function spawnBifBof(toolInput: ToolInput): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      "bun",
      [
        "mockBifbofNext.ts",
        toolInput.name,
        toolInput.modifiesRepo ? "true" : "false",
        toolInput.simulateShellError ? "true" : "false",
        ...(toolInput.input ? [JSON.stringify(toolInput.input)] : []),
      ],
      {
        stdio: "inherit",
        env: process.env,
      },
    );

    child.on("exit", (code) => {
      console.log(`[tool] '${toolInput.name}' exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tool ${toolInput.name} failed with code ${code}`));
      }
    });
  });
}

export async function tool(toolInput: ToolInput): Promise<void> {
  const validationResult = toolInput.validate();
  if (!validationResult.isValid) {
    const errors =
      validationResult.errors?.join(", ") ?? "Unknown validation error";
    throw new Error(`Invalid ToolInput: ${errors}`);
  }

  let storedError: unknown = null;

  let watchPromise: Promise<void> = Promise.resolve();
  if (toolInput.modifiesRepo) {
    watchPromise = GitWatch.getInstance()
      .addTask("tool", toolInput.simulateValidationError)
      .catch((err) => {
        storedError = err;
      });
  }

  await new Promise((resolve) => setTimeout(resolve, 50));

  await spawnBifBof(toolInput);

  await watchPromise;

  if (storedError) {
    throw storedError;
  }
  return watchPromise;
}
