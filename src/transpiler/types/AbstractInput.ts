export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export abstract class AbstractInput {
  // Optional schema validation method that can be implemented by subclasses
  public validate?(): ValidationResult;

  // Required properties that all inputs must have
  abstract readonly type: string;
}
