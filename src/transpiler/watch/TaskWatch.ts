import chokidar from "chokidar";
import fs from "fs";
import yaml from "js-yaml";
import { ValidationError } from "../utils/errors";

interface TaskWatchTask {
  stateTaskId: string;  // Folder under .bifbof/tasks/
  toolId: string;       // The tool id we are watching inside the YAML file
  resolve: () => void;
  reject: (error: Error) => void;
  oldInvocations: any[]; // Snapshot of the toolInvocations array from the YAML file
  simulateValidationError: boolean;
}

/**
 * TaskWatch monitors the state file (.bifbof/tasks/[stateTaskId]/state.yaml)
 * for updates to its toolInvocations array. When a new invocation with the matching
 * toolId is detected, the task is resolved, unless an error is present in the invocation.
 */
export class TaskWatch {
  private static instance: TaskWatch;
  private watcher: chokidar.FSWatcher | null = null;
  private tasks: TaskWatchTask[] = [];

  private constructor() {}

  static getInstance(): TaskWatch {
    if (!TaskWatch.instance) {
      TaskWatch.instance = new TaskWatch();
    }
    return TaskWatch.instance;
  }

  async init(): Promise<void> {
    if (this.watcher) return;

    // Instead of watching for ".bifbof/tasks/*/state.yaml" directly,

    
    const watchPath = ".bifbof/tasks";
    this.watcher = chokidar.watch(watchPath, {
      ignoreInitial: true,
      depth: 2,
    });

    this.watcher.on("add", async (filePath) => {
      if (!filePath.endsWith("state.yaml")) return;
      const stateTaskId = this.extractStateTaskId(filePath);
      console.log(`[TaskWatch] New state file added: ${filePath}`);
      let fileContent = "";
      try {
        fileContent = fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
      }
      this.processFileUpdate(stateTaskId, fileContent);
    });

    this.watcher.on("change", async (filePath) => {
      if (!filePath.endsWith("state.yaml")) return;
      const stateTaskId = this.extractStateTaskId(filePath);
      console.log(`[TaskWatch] State file changed: ${filePath}`);
      let fileContent = "";
      try {
        fileContent = fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
      }
      this.processFileUpdate(stateTaskId, fileContent);
    });

    this.watcher.on("error", (error) => {
      this.tasks.forEach((task) => task.reject(error));
      this.tasks = [];
    });
  }

  /**
   * Extracts the stateTaskId from the file path.
   * Expected path format: .bifbof/tasks/<stateTaskId>/state.yaml
   */
  private extractStateTaskId(filePath: string): string {
    const parts = filePath.split("/");
    return parts.length >= 3 ? parts[2] : "";
  }

  /**
   * Processes the update of the state file for a given stateTaskId.
   * Parses the YAML, finds all toolInvocations that match the task's toolId,
   * and if a new invocation is detected, resolves the promise or fails validation.
   *
   * @param stateTaskId The folder name from the path.
   * @param fileContent The content of the YAML state file.
   */
  private processFileUpdate(stateTaskId: string, fileContent: string): void {
    let parsed: any;
    try {
      parsed = yaml.load(fileContent);
    } catch (err) {
      console.error(`Error parsing YAML for task ${stateTaskId}:`, err);
      return;
    }

    if (!parsed || !Array.isArray(parsed.toolInvocations)) {
      console.warn(`[Task ${stateTaskId}] No toolInvocations found in state file.`);
      return;
    }

    const newInvocations = parsed.toolInvocations;
    const completedTasks: TaskWatchTask[] = [];

    // Process only tasks watching the current state file.
    for (const task of this.tasks) {
      if (task.stateTaskId === stateTaskId) {
        // Filter to invocations matching the desired toolId.
        const previousInvocations = task.oldInvocations.filter((inv: any) => inv.toolId === task.toolId);
        const currentInvocations = newInvocations.filter((inv: any) => inv.toolId === task.toolId);

        // Check if a new invocation has been added.
        if (currentInvocations.length > previousInvocations.length) {
          task.oldInvocations = newInvocations;
          const latestInvocation = currentInvocations[currentInvocations.length - 1];
          console.log(`[Task ${task.toolId} in ${stateTaskId}] Detected new invocation:`, latestInvocation);

          // If an error exists, fail validation.
          if (latestInvocation.error) {
            try {
              this.failValidation(task.toolId, latestInvocation.error);
            } catch (err) {
              task.reject(err as Error);
              completedTasks.push(task);
              continue;
            }
          }
          task.resolve();
          completedTasks.push(task);
        }
      }
    }

    // Remove completed tasks.
    this.tasks = this.tasks.filter((task) => !completedTasks.includes(task));
  }

  /**
   * Adds a new task to be watched.
   *
   * @param stateTaskId The directory under .bifbof/tasks/ where state.yaml resides.
   * @param toolId The tool id to match inside the state file’s toolInvocations.
   * @param simulateValidationError Optional flag to simulate a validation error.
   */
  addTask(stateTaskId: string, toolId: string, simulateValidationError = false): Promise<void> {
    const filePath = `.bifbof/tasks/${stateTaskId}/state.yaml`;
    let initialInvocations: any[] = [];
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = yaml.load(content);
        if (parsed && Array.isArray(parsed.toolInvocations)) {
          initialInvocations = parsed.toolInvocations;
          console.log(`[Task ${stateTaskId}] Loaded initial state from ${filePath}`);
        } else {
          console.log(`[Task ${stateTaskId}] No toolInvocations found in initial state.`);
        }
      } else {
        console.log(`[Task ${stateTaskId}] No initial state found at ${filePath}`);
      }
    } catch (error) {
      console.error(`Error reading initial state for task ${stateTaskId}:`, error);
    }

    return new Promise<void>((resolve, reject) => {
      this.tasks.push({
        stateTaskId,
        toolId,
        resolve,
        reject,
        oldInvocations: initialInvocations,
        simulateValidationError,
      });
    });
  }

  /**
   * Fails validation for the given tool id by throwing a ValidationError with the error message.
   *
   * @param toolId The tool id for the task.
   * @param errorMessage The error message provided in the invocation.
   */
  private failValidation(toolId: string, errorMessage: string): void {
    console.error(`[Tool ${toolId}] Validation failed with error: ${errorMessage}`);
    throw new ValidationError(errorMessage);
  }
}
