import { AbstractInput } from "./AbstractInput";
import type { ValidationResult } from "./AbstractInput";
import { z } from "zod";

/**
 * ToolInput closely resembles tool from original design doc
 * name is the name of the tool that gets passed to bifbof next
 * input is an arbitary container for tool inputs
 * modifiesRepo allows us to declare whether the tool is expected to commit to repo, if it is expected, we will queue GitWatch task for it
 * simulateShellError simulates failure of bifbof CLI
 * simulateValidationError simulates failure in validation of the tool outputs after commit has been found
 */
export class ToolInput extends AbstractInput {
  readonly type = "tool";

  constructor(
    public name: string,
    public input?: Record<string, any>,
    public modifiesRepo?: boolean,
    public simulateShellError?: boolean,
    public simulateValidationError?: boolean,
  ) {
    super();
  }

  // Zod schema mirroring the ToolInput interface
  private static schema = z.object({
    name: z.string().min(1, "Tool name cannot be empty"),
    input: z.record(z.any()).optional(),
    modifiesRepo: z.boolean().optional(),
    simulateShellError: z.boolean().optional(),
    simulateValidationError: z.boolean().optional(),
  });

  /**
   * Validate this instance against the schema.
   */
  public validate(): ValidationResult {
    const result = ToolInput.schema.safeParse(this);
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map((err) => err.message),
      };
    }
    return { isValid: true };
  }

  /**
   * Static helper to instantiate a ToolInput with validation.
   */
  static create(
    name: string,
    input?: Record<string, any>,
    modifiesRepo?: boolean,
    simulateShellError?: boolean,
    simulateValidationError?: boolean,
  ): ToolInput {
    return new ToolInput(
      name,
      input,
      modifiesRepo,
      simulateShellError,
      simulateValidationError,
    );
  }
}
