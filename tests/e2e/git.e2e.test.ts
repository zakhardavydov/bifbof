import { describe, it, expect } from "bun:test";
import { execSync } from "child_process";
import { useTempGitRepo } from "../helpers/gitRepo";

describe("Git E2E tests", () => {
	const repo = useTempGitRepo();

	it("should have a valid Git repo in the temp folder", () => {
		execSync("git status", { cwd: repo.repoPath });
		expect(true).toBe(true);
	});

	it("should allow creating a new commit", () => {
		execSync('echo "Hello" > test.txt', {
			cwd: repo.repoPath,
			shell: "/bin/bash",
		});
		execSync("git add .", { cwd: repo.repoPath });
		execSync('git commit -m "Test commit"', { cwd: repo.repoPath });

		const headCommit = execSync("git rev-parse HEAD", { cwd: repo.repoPath })
			.toString()
			.trim();

		expect(headCommit).not.toBe("");
	});
});
