import { AbstractInput } from "./AbstractInput";
import type { ValidationResult } from "./AbstractInput";
import { z } from "zod";

export class HumanInput extends AbstractInput {
  readonly type = "human";

  constructor(public prompt: string) {
    super();
  }

  private static schema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty"),
  });

  public validate(): ValidationResult {
    const result = HumanInput.schema.safeParse(this);

    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map((err) => err.message),
      };
    }

    return { isValid: true };
  }

  static create(input: string): HumanInput {
    return new HumanInput(input);
  }
}
