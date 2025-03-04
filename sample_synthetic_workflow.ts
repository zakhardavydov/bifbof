/**
 * syntheticWorkflow.ts
 * Generated with selected features: if, try, for, agent, tool
 */

import { agent, tool, ToolInput, GitWatch, ValidationError, TaskWatch, task } from "./src/transpiler";


async function testTask() {
  await tool(
    ToolInput.create("validator", { param: "d" }, false, false, false),
  );

  await agent("Agent #387");

  try {
    for (let i = 0; i < 2; i++) {
      for (let i = 0; i < 2; i++) {
        await tool(
          ToolInput.create("validator", { param: "d" }, true, false, false),
        );
        try {
          await agent("Agent #42");
          await agent("Agent #306");
        } catch (err) {
          try {
            await tool(
              ToolInput.create("validator", { param: "a" }, true, false, false),
            );
          } catch (err) {}
        }
      }
    }
  } catch (err) {}
  console.log("=== Synthetic workflow complete! ===");
}

await GitWatch.getInstance().init();
await TaskWatch.getInstance().init();

try {
  await task(testTask);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Caught ValidationError, not crucial");
  } else {
    console.log(error);

    process.exit(1);
  }
}
process.exit(0);
