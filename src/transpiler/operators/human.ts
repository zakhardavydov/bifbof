import { GitWatch } from "../watch/GitWatch";
import { HumanInput } from "../types/HumanInput";

export async function human(prompt: string): Promise<void> {
	const humanInput = HumanInput.create(prompt);
	const watcher = GitWatch.getInstance();

	console.log(`Waiting for human to: "${humanInput.prompt}"`);

	return watcher.addTask("human", false);
}