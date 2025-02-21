import { agent, human, tool, ToolInput } from "./src/transpiler";
import { GitWatch } from "./src/transpiler/watch/GitWatch";

async function runTask() {
	await agent("Write code");
}

async function runTryTask() {
	await agent("Write code");
	try {
		await tool(
			ToolInput.create("validator", { param: "a" }, true, false, true),
		);
	} catch (error) {
		await agent("Fix the error");
	}
}

async function runForTask() {
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

async function main() {
	try {
		// Initialize the watcher on startup
		await GitWatch.getInstance().init();

		console.log("Starting main workflow...");
		await runTask();
		await runTryTask();
		await runForTask();
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
