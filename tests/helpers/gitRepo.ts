import { mkdtempSync, rmSync, cpSync } from "fs";
import { beforeAll, afterAll } from "bun:test";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";

/**
 * Creates a temporary directory with a new Git repo initialized,
 * and copies the contents of the current working directory into it.
 * @returns The path to the temporary Git repo.
 */
export function createTempGitRepo(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "test-repo-"));

  const currentDir = process.cwd();

  cpSync(currentDir, tempDir, { recursive: true, force: true });

  // Initialize an empty Git repository
  execSync("git init", { cwd: tempDir });

  return tempDir;
}

/**
 * Removes the specified directory recursively. Useful for cleaning up after tests.
 */
export function removeTempGitRepo(dirPath: string): void {
  rmSync(dirPath, { recursive: true, force: true });
}

/**
 * A convenience function that handles:
 * - creating a temp Git repo before all tests in a `describe` block
 * - copying the current directory contents to it
 * - cleaning up afterward
 * - `chdir` into it so your tests run in that directory
 *
 * Usage:
 *   const { repoPath } = useTempGitRepo();
 */
export function useTempGitRepo() {
  let repoPath: string;

  beforeAll(() => {
    repoPath = createTempGitRepo();
    process.chdir(repoPath);
  });

  return {
    get repoPath() {
      return repoPath;
    },
  };
}
