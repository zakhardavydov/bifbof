import { describe, it, expect } from "bun:test";
import { join } from "path";
import { writeFileSync } from "fs";
import { spawnSync } from "child_process";
import { useTempGitRepo } from "../helpers/gitRepo";
import { generateSyntheticWorkflow } from "../helpers/syntheticWorfklow";

const MAX_LENGTH = 15;
const WORKFLOWS_PER_TEST = 10;

describe("Run synthetic workflows", () => {
  const repo = useTempGitRepo();

  it(`should run ${WORKFLOWS_PER_TEST} synthetic workflows and report statistics`, () => {
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    for (let i = 0; i < WORKFLOWS_PER_TEST; i++) {
      const syntheticCode = generateSyntheticWorkflow(
        ["if", "try", "for", "agent", "tool"],
        MAX_LENGTH,
      );
      const syntheticFile = join(repo.repoPath, `syntheticWorkflow_${i}.ts`);

      writeFileSync(syntheticFile, syntheticCode, "utf8");

      const result = spawnSync("bun", ["run", syntheticFile], {
        cwd: repo.repoPath,
        stdio: "pipe",
        env: process.env,
      });

      if (result.status === 0) {
        successCount++;
      } else {
        failureCount++;
        failures.push({
          syntheticCode: syntheticCode,
          index: i,
          exitCode: result.status,
          error: result.stderr.toString(),
        });
      }
    }

    console.log(`Total Workflows Run: ${WORKFLOWS_PER_TEST}`);
    console.log(`Successful Runs: ${successCount}`);
    console.log(`Failed Runs: ${failureCount}`);

    if (failures.length > 0) {
      console.log("Failures:", failures);
      console.log(failures[0].syntheticCode);
    }

    expect(failureCount).toBe(0);
  });
});
