/**
 * This is an error that we would throw if the bifbof validation tool finds a real problem
 * We need this so we can handle declare mitigation scenario in high-level code
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * This is an error that encapuslates bifbof failure
 */
export class ShellError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShellError";
  }
}
