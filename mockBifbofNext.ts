import { execSync } from "child_process";

const taskTitle = process.argv[2] || "mockBifbofNext";
const modifyRepo = process.argv[3] === "true";
const simulateError = process.argv[4] === "true";

const commitMessage = `${taskTitle}: done`;

export function mockBifbofNext(
  task: string,
  message: string,
  modifyRepo: boolean,
  simulateError: boolean,
) {
  console.log(`[mock] Running '${task}'...`);

  if (simulateError) {
    console.error(`[mock] Simulated error for '${task}'. Exiting with code 1.`);
    process.exit(1);
  }

  if (modifyRepo) {
    try {
      execSync(`git commit --allow-empty -m "${message}"`, {
        stdio: "inherit",
      });
    } catch (err) {
      console.error('[mock] Git commit failed.', err);
    }
  } else {
    console.log(`[mock] '${task}' executed.`);
  }

  console.log(`[mock] '${task}' complete.\n`);
}

mockBifbofNext(taskTitle, commitMessage, modifyRepo, simulateError);
