import { AgentInput } from "../types/AgentInput";
import { tool } from "./tool";
import { ToolInput } from "../types/ToolInput";

export async function agent(
	input: string | Partial<AgentInput>,
): Promise<void> {
	const agentInput = AgentInput.create(input);

	const toolInput = ToolInput.create(
		"next",
		{
			prompt: agentInput.prompt,
			file: agentInput.file,
			errors: agentInput.errors,
		},
		true,
		false,
		false,
	);

	return tool(toolInput);
}
