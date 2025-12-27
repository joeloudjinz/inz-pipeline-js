import { IPipe } from './IPipe';
import { IPipelineContext } from './IPipelineContext';

/**
 * Defines the contract for an error recovery strategy that can be applied to a pipe.
 * Recovery strategies determine how to recover from errors that occur during pipe execution.
 */
export interface IErrorRecoveryStrategy<TIn, TOut> {
  /**
   * Executes the pipe with the recovery strategy applied.
   * This method wraps the pipe execution with the appropriate recovery logic.
   */
  execute(pipe: IPipe<TIn, TOut>, context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void>;
}