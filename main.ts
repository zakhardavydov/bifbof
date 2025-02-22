import { agent, agentWithGit, human, tool, ToolInput, GitWatch, TaskWatch, ShellError, task } from "./src/transpiler";

/**
 * Simple case where we only call the agent
 */
async function simpleTask() {
  await agent("Write code", false);
  await agentWithGit("Write more code", false);
}

/**
 * Common case where we call the agent,
 * call the validator tool which fails and we ask agent to fix it
 */
async function tryTask() {
  await agent("Write code");
  try {
    await tool(
      ToolInput.create("validator", { param: "a" }, true, false, true),
    );
  } catch (error) {
    await agent("Fix the error");
  }
}

/**
 * Common case where we call the agent,
 * call the validator tool and keep calling the agent until the validator passes,
 * or we excceed max retry number
 */
async function forTask() {
  await agent("Write code");
  for (let i = 0; i < 5; i++) {
    try {
      await tool(
        ToolInput.create("validator", { param: "a" }, true, false, true),
      );
      break;
    } catch (error) {
      await agent("Fix the error");
    }
  }
}

/**
 * Case where bifbof failed,
 * So we handle it andtry the same tool again with different param
 */
async function shellErrorTask() {
  await agent("Write code");
  try {
    await tool(
      ToolInput.create("validator", { param: "a" }, true, true, false),
    );
  } catch (error) {
    if (error instanceof ShellError) {
      console.log("bifbof shell command failed")
      await tool(
        ToolInput.create("validator", { param: "b" }, true, false, false),
      );
    }
  }
}

/**
 * Case where we call agent and then call human
 */
async function humanTask() {
  await agent("Write code");
  await human("Please check");
}

/**
 * Nested task
 */
async function nestedTask() {
  await agent("Write a readme with the plan to write code");
  await simpleTask();
}

async function main() {
  try {
    // Initialize the watchers on startup
    await GitWatch.getInstance().init();
    await TaskWatch.getInstance().init();

    await task(nestedTask);
    
    console.log("All tasks done. Exiting...");
  } catch (error) {
    console.error("Error in main:", error);
  } finally {
    process.exit(0);
  }
}

// Run the main workflow
main().catch((err) => {
  console.error("Error in main:", err);
  process.exit(1);
});
