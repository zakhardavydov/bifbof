import { AgentInput } from "../types/AgentInput";
import { tool } from "./tool";
import { ToolInput } from "../types/ToolInput";

/**
 * agent is an operator to apply an agent on the repo
 * It is specific case of generic tool operator
 */
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
    true, // Modifes the repo
    false,  // We don't introduce shell errors
    false, // Or validation errors because in this programming model we prefer validation to be run separately from agent
  );

  return tool(toolInput);
}
