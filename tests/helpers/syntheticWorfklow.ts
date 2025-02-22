import { randomInt } from "crypto";

interface CodeSnippet {
  code: string;
  length: number;
}

export function generateSyntheticWorkflow(
  features: string[],
  maxLength: number,
): string {
  const totalStatements = randomInt(1, maxLength + 1);
  const statements: CodeSnippet[] = [];

  let currentCount = 0;
  while (currentCount < totalStatements) {
    const snippet = generateRandomStatement(
      currentCount,
      totalStatements,
      features,
    );
    statements.push(snippet);
    currentCount += snippet.length;
  }

  const body = statements.map((s) => s.code).join("\n\n");

  return `/**
 * syntheticWorkflow.ts
 * Generated with selected features: ${features.join(", ")}
 */

import { agent, agentWithGit, human, tool, ToolInput, GitWatch, ValidationError, TaskWatch, ShellError, task } from "./src/transpiler";

async function testTask() {
${body}
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
    process.exit(1);
  }
}
process.exit(0);
`;
}

function generateRandomStatement(
  currentLength: number,
  maxLength: number,
  features: string[],
): CodeSnippet {
  if (currentLength >= maxLength - 1) {
    return randomOperator(features);
  }

  const availableBlocks = [];
  if (features.includes("try")) availableBlocks.push(generateTryCatchBlock);
  if (features.includes("for")) availableBlocks.push(generateForLoop);
  if (features.includes("if")) availableBlocks.push(generateIfElseBlock);

  if (availableBlocks.length > 0 && Math.random() < 0.5) {
    return randomOneOf(availableBlocks)(currentLength, maxLength, features);
  }

  return randomOperator(features);
}

function randomOperator(features: string[]): CodeSnippet {
  const availableOps = [];
  if (features.includes("agent")) availableOps.push(randomAgent);
  if (features.includes("human")) availableOps.push(randomHuman);
  if (features.includes("tool")) availableOps.push(randomTool);

  return randomOneOf(availableOps)();
}

function randomAgent(): CodeSnippet {
  return { code: `  await agent("Agent #${randomInt(1000)}");`, length: 1 };
}

function randomHuman(): CodeSnippet {
  return { code: `  await human("Human #${randomInt(1000)}");`, length: 1 };
}

function randomTool(): CodeSnippet {
  return {
    code: `  await tool(ToolInput.create("validator", { param: "${randomOneOf(["a", "b", "c", "d"])}" }, ${randomBool()}, false, ${randomBool()}));`,
    length: 1,
  };
}

function generateTryCatchBlock(
  currentLength: number,
  maxLength: number,
  features: string[],
): CodeSnippet {
  let tryCode = "";
  let catchCode = "";
  let used = 1;

  for (
    let i = 0;
    i < randomInt(1, 3) && currentLength + used < maxLength;
    i++
  ) {
    const snippet = generateRandomStatement(
      currentLength + used,
      maxLength,
      features,
    );
    tryCode += "\n    " + snippet.code;
    used += snippet.length;
  }

  for (
    let i = 0;
    i < randomInt(1, 3) && currentLength + used < maxLength;
    i++
  ) {
    const snippet = generateRandomStatement(
      currentLength + used,
      maxLength,
      features,
    );
    catchCode += "\n    " + snippet.code;
    used += snippet.length;
  }

  return {
    code: `try {${tryCode}\n  } catch (err) {${catchCode}\n  }`,
    length: used,
  };
}

function generateForLoop(
  currentLength: number,
  maxLength: number,
  features: string[],
): CodeSnippet {
  let loopBody = "";
  let used = 1;

  for (
    let i = 0;
    i < randomInt(1, 4) && currentLength + used < maxLength;
    i++
  ) {
    const snippet = generateRandomStatement(
      currentLength + used,
      maxLength,
      features,
    );
    loopBody += "\n  " + snippet.code;
    used += snippet.length;
  }

  return {
    code: `for (let i = 0; i < ${randomInt(1, 4)}; i++) {${loopBody}\n}`,
    length: used,
  };
}

function generateIfElseBlock(
  currentLength: number,
  maxLength: number,
  features: string[],
): CodeSnippet {
  let ifBody = "";
  let elseBody = "";
  let used = 1;

  for (
    let i = 0;
    i < randomInt(1, 3) && currentLength + used < maxLength;
    i++
  ) {
    const snippet = generateRandomStatement(
      currentLength + used,
      maxLength,
      features,
    );
    ifBody += "\n    " + snippet.code;
    used += snippet.length;
  }

  for (
    let i = 0;
    i < randomInt(1, 3) && currentLength + used < maxLength;
    i++
  ) {
    const snippet = generateRandomStatement(
      currentLength + used,
      maxLength,
      features,
    );
    elseBody += "\n    " + snippet.code;
    used += snippet.length;
  }

  return {
    code: `if (Math.random() < 0.5) {${ifBody}\n} else {${elseBody}\n}`,
    length: used,
  };
}

function randomBool(): boolean {
  return Math.random() < 0.5;
}

function randomOneOf<T>(arr: T[]): T {
  return arr[randomInt(arr.length)];
}
