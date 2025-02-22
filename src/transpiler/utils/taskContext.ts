import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";

const asyncLocalStorage = new AsyncLocalStorage<{ stateTaskId: string }>();

/**
 * task runs a function within a context that assigns a unique stateTaskId.
 * All tool calls within the function (and its subfunctions) will share the same stateTaskId.
 */
export async function task<T>(fn: () => Promise<T>): Promise<T> {
  const stateTaskId = randomUUID();
  return asyncLocalStorage.run({ stateTaskId }, fn);
}

/**
 * getStateTaskId retrieves the current stateTaskId from the async context.
 */
export function getStateTaskId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.stateTaskId;
}
