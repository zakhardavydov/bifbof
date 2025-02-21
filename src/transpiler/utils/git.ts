import { readFileSync } from "fs";

/**
 * Gets the hash of the current HEAD commit
 */
export function getHeadCommitHash(): string {
	const currentBranch = readFileSync(".git/HEAD", "utf8").trim();
	if (currentBranch.startsWith("ref: ")) {
		const refPath = currentBranch.slice(5);
		return readFileSync(`.git/${refPath}`, "utf8").trim();
	}
	return currentBranch;
}

/**
 * Gets the path to the current branch reference
 */
export function getCurrentBranchPath(): string | null {
	const head = readFileSync(".git/HEAD", "utf8").trim();
	if (head.startsWith("ref: ")) {
		return head.slice(5);
	}
	return null;
}
