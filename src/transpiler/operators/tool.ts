import { spawn } from "child_process";
import { GitWatch } from "../watch/GitWatch";
import type { ToolInput } from "../types/ToolInput";
import { ShellError } from "../utils/errors";

/**
 * Spawns the bun process running "mockBifbofNext.ts" with arguments
 * derived from the given toolInput.
 * In reality, this will get replaced by the call to real implementation to bifbof
 * Including adding the tool to the queue instead of parsing it as args
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
        reject(new ShellError(`Tool ${toolInput.name} failed with code ${code}`));
      }
    });
  });
}

/**
 * tool is an operator that handles the call to bifbof and watches for the new commit
 * We first setup a listner for changes
 * If listener catches the error, we store it, so we don't lose it in the future
 * If the bifbof commain returns non 0 code, we raise ShellError immediately
 * We then await new commit (probably some timeout is needed)
 * When the new commit arrives and the promise is awaited,
 * we check whether we caught an exception, if we did, we throw it
 * If we did not, just pass the control back to outside code.
 * 
 * TODO: Naturally if bifbof just starts with a commit, the listner,
 * would need to skip that utility commit,
 * suggesting more complex commit naming/parsing logic is required
 */
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
