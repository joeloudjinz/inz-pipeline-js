import { IPipelineStep } from '../contracts/IPipelineStep';
import { IPipelineContext } from '../contracts/IPipelineContext';
import { IPipe } from '../contracts/IPipe';
import { PipeConfiguration } from '../configuration/PipeConfiguration';

/**
 * Represents a parallel step in the pipeline that executes multiple pipes concurrently.
 */
export class ParallelStep<TIn, TOut> implements IPipelineStep<TIn, TOut> {
  private readonly configurations: PipeConfiguration<TIn, TOut>[];

  constructor(
    public readonly pipes: IPipe<TIn, TOut>[],
    configurations?: PipeConfiguration<TIn, TOut>[]
  ) {
    this.configurations = configurations || pipes.map(() => new PipeConfiguration<TIn, TOut>());
    
    // Ensure we have the same number of configurations as pipes
    if (this.configurations.length !== this.pipes.length) {
      throw new Error('Number of configurations must match number of pipes');
    }
  }

  /**
   * Executes the parallel step with the provided context.
   * All pipes in the step will be executed concurrently.
   */
  public async execute(context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void> {
    // Check for cancellation before starting parallel execution
    if (cancellationToken?.aborted) {
      throw new Error('Pipeline execution was cancelled');
    }

    // Create an array of promises for each pipe execution
    const promises = this.pipes.map((pipe, index) => {
      return this.executePipe(pipe, this.configurations[index], context, cancellationToken);
    });

    // Execute all pipes in parallel
    await Promise.all(promises);
  }

  /**
   * Helper method to execute a single pipe with its configuration
   */
  private async executePipe(
    pipe: IPipe<TIn, TOut>,
    config: PipeConfiguration<TIn, TOut>,
    context: IPipelineContext<TIn, TOut>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation before executing the pipe
    if (cancellationToken?.aborted) {
      throw new Error('Pipeline execution was cancelled');
    }

    try {
      // If there's an error handling policy, use it to execute the pipe
      if (config.errorHandlingPolicy) {
        await config.errorHandlingPolicy.execute(pipe, context, cancellationToken);
      } 
      // If there's a recovery strategy, use it to execute the pipe
      else if (config.recoveryStrategy) {
        await config.recoveryStrategy.execute(pipe, context, cancellationToken);
      } 
      // Otherwise, execute the pipe directly
      else {
        await pipe.handle(context, cancellationToken);
      }
    } catch (error) {
      // If continueOnFailure is enabled, log the error but don't throw
      if (context.continueOnFailure) {
        context.hasPipeFailure = true;
        context.errors.push((error as Error).message);
        context.pipelineErrors.push({
          message: (error as Error).message,
          exception: error as Error,
          timestamp: Date.now(),
          pipeName: pipe.constructor.name
        });
      } else {
        // Otherwise, re-throw the error
        throw error;
      }
    }
  }

  /**
   * Gets the pipes that are part of this step for validation purposes.
   */
  public getPipes(): IPipe<TIn, TOut>[] {
    return [...this.pipes]; // Return a copy to prevent external modification
  }
}