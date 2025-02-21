import { AbstractInput } from "./AbstractInput";
import type { ValidationResult } from "./AbstractInput";
import { z } from "zod";

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
