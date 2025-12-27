import { IPipelineStep } from '../contracts/IPipelineStep';
import { IPipelineContext } from '../contracts/IPipelineContext';
import { IPipe } from '../contracts/IPipe';
import { PipeConfiguration } from '../configuration/PipeConfiguration';

/**
 * Represents a conditional step in the pipeline that executes a pipe only if a condition is met.
 */
export class ConditionalStep<TIn, TOut> implements IPipelineStep<TIn, TOut> {
  constructor(
    public readonly pipe: IPipe<TIn, TOut>,
    public readonly condition: (context: IPipelineContext<TIn, TOut>) => boolean,
    public readonly configuration: PipeConfiguration<TIn, TOut> = new PipeConfiguration<TIn, TOut>()
  ) {}

  /**
   * Executes the conditional step with the provided context.
   * The pipe will only be executed if the condition evaluates to true.
   */
  public async execute(context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void> {
    // Check for cancellation before evaluating the condition
    if (cancellationToken?.aborted) {
      throw new Error('Pipeline execution was cancelled');
    }

    // Check if the condition is met
    if (this.condition(context)) {
      try {
        // If there's an error handling policy, use it to execute the pipe
        if (this.configuration.errorHandlingPolicy) {
          await this.configuration.errorHandlingPolicy.execute(this.pipe, context, cancellationToken);
        } 
        // If there's a recovery strategy, use it to execute the pipe
        else if (this.configuration.recoveryStrategy) {
          await this.configuration.recoveryStrategy.execute(this.pipe, context, cancellationToken);
        } 
        // Otherwise, execute the pipe directly
        else {
          await this.pipe.handle(context, cancellationToken);
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
            pipeName: this.pipe.constructor.name
          });
        } else {
          // Otherwise, re-throw the error
          throw error;
        }
      }
    }
  }

  /**
   * Gets the pipes that are part of this step for validation purposes.
   */
  public getPipes(): IPipe<TIn, TOut>[] {
    return [this.pipe];
  }
}