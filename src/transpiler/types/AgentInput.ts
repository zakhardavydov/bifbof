import { AbstractInput } from "./AbstractInput";
import type { ValidationResult } from "./AbstractInput";
import { z } from "zod";

/**
 * AgentInput has prompt, optional file to operate on, additional options and errors we would like agent to fic
 */
export class AgentInput extends AbstractInput {
  readonly type = "agent";

  constructor(
    public prompt: string,
    public file?: string,
    public options?: Record<string, any>,
    public errors?: string[],
  ) {
    super();
  }

  // Optional schema validation
  private static schema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty"),
    file: z.string().optional(),
    options: z.record(z.any()).optional(),
    errors: z.array(z.string()).optional(),
  });

  public validate(): ValidationResult {
    const result = AgentInput.schema.safeParse(this);

    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map((err) => err.message),
      };
    }

    return { isValid: true };
  }

  // Factory method for creating from plain object or string
  static create(input: string | Partial<AgentInput>): AgentInput {
    if (typeof input === "string") {
      return new AgentInput(input);
    }

    return new AgentInput(
      input.prompt!,
      input.file,
      input.options,
      input.errors,
    );
  }
}
