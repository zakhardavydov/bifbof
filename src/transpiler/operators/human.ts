import { GitWatch } from "../watch/GitWatch";
import { HumanInput } from "../types/HumanInput";

/**
 * human is an operator to wait for human-originated commit
 * Here we don't need to do anything, but to wait for an external commit in current repo
 */
export async function human(prompt: string): Promise<void> {
  const humanInput = HumanInput.create(prompt);
  const watcher = GitWatch.getInstance();

  console.log(`Waiting for human to: "${humanInput.prompt}"`);

  return watcher.addTask("human", false);
}