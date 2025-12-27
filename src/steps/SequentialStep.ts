import { IPipelineStep } from '../contracts/IPipelineStep';
import { IPipelineContext } from '../contracts/IPipelineContext';
import { IPipe } from '../contracts/IPipe';
import { PipeConfiguration } from '../configuration/PipeConfiguration';
import { ErrorHandlingUtils } from '../error-handling/ErrorHandlingUtils';

/**
 * Represents a sequential step in the pipeline that executes a single pipe.
 */
export class SequentialStep<TIn, TOut> implements IPipelineStep<TIn, TOut> {
  constructor(
    public readonly pipe: IPipe<TIn, TOut>,
    public readonly configuration: PipeConfiguration<TIn, TOut> = new PipeConfiguration<TIn, TOut>()
  ) {}

  /**
   * Executes the sequential step with the provided context.
   */
  public async execute(context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void> {
    // Check for cancellation before executing the pipe
    ErrorHandlingUtils.checkAndHandleCancellation(cancellationToken, context, this.pipe);

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
        ErrorHandlingUtils.handleContinueOnFailure(context, error as Error, this.pipe);
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
    return [this.pipe];
  }
}