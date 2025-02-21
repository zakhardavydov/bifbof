import type { AbstractInput } from "../types/AbstractInput";

export abstract class AbstractWatch<T extends AbstractInput> {
	protected abstract getName(): string;
	protected abstract executeTask(input: T): Promise<void> | void;

	public async watch(input: T): Promise<void> {
		// Validate input if validation method exists
		if (input.validate) {
			const validationResult = input.validate();
			if (!validationResult.isValid) {
				throw new Error(
					`Invalid input: ${validationResult.errors?.join(", ")}`,
				);
			}
		}

		return this.executeWatch(input);
	}

	protected abstract executeWatch(input: T): Promise<void>;

	protected getInitialMessage(input: T): string {
		return `${this.getName()} is processing: "${JSON.stringify(input)}"`;
	}
}
