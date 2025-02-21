import chokidar from "chokidar";
import { getCurrentBranchPath, getHeadCommitHash } from "../utils/git";

interface WatchTask {
  name: string;
  resolve: () => void;
  reject: (error: Error) => void;
  oldHead: string;
  simulateValidationError: boolean;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class GitWatch {
  private static instance: GitWatch;
  private watcher: chokidar.FSWatcher | null = null;
  private tasks: WatchTask[] = [];

  private constructor() {}

  static getInstance(): GitWatch {
    if (!GitWatch.instance) {
      GitWatch.instance = new GitWatch();
    }
    return GitWatch.instance;
  }

  async init(): Promise<void> {
    if (this.watcher) return;

    const branchPath = getCurrentBranchPath();
    const watchPath = branchPath ? `.git/${branchPath}` : `.git/HEAD`;

    this.watcher = chokidar.watch(watchPath, { ignoreInitial: true });

    this.watcher.on("change", async () => {
      const newHead = getHeadCommitHash();

      const completedTasks: WatchTask[] = [];

      for (const task of this.tasks) {
        console.log(`[${task.name}] Old HEAD:`, task.oldHead);

        // If we detect a new commit
        if (newHead !== task.oldHead) {
          console.log(`[${task.name}] Detected new commit:`, newHead);

          try {
            // If `validate` is true, perform the random validation
            if (task.simulateValidationError) {
              this.failValidation(task.name);
            }
            // If we reach this point, no error was thrown by validation
            completedTasks.push(task);
            task.resolve();
          } catch (err) {
            task.reject(err as Error);
          }
        }
      }

      // Remove completed or rejected tasks from the queue
      this.tasks = this.tasks.filter((task) => !completedTasks.includes(task));
    });

    this.watcher.on("error", (error) => {
      this.tasks.forEach((task) => task.reject(error));
      this.tasks = [];
    });
  }

  /**
   * Add a new task. If `validate` is not provided, defaults to `true`.
   *
   * @param name A descriptive name for the task
   * @param validate Whether to invoke the random validation check (50% chance of failure)
   */
  addTask(name: string, simulateValidationError = false): Promise<void> {
    const oldHead = getHeadCommitHash();
    console.log(`[${name}] Current HEAD:`, oldHead);

    return new Promise<void>((resolve, reject) => {
      this.tasks.push({
        name,
        resolve,
        reject,
        oldHead,
        simulateValidationError,
      });
    });
  }

  /**
   * Here we would check the bifbof state file and find validation results.
   * Throws an error if validation failed, because we want to give our process control to handle it
   */
  private failValidation(taskName: string): void {
    console.error(`[${taskName}] Validation failed`);
    throw new ValidationError("Simualted validation failed");
  }
}
