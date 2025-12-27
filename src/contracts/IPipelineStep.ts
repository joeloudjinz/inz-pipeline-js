import { IPipelineContext } from './IPipelineContext';
import { IPipe } from './IPipe';

/**
 * Defines the contract for a pipeline step. A step represents a single unit of execution
 * in the pipeline, which could be a single pipe, multiple pipes running in parallel,
 * a conditional execution, or a sub-pipeline.
 */
export interface IPipelineStep<TIn, TOut> {
  /**
   * Executes the pipeline step with the provided context.
   */
  execute(context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void>;

  /**
   * Gets the pipes that are part of this step for validation purposes.
   */
  getPipes(): IPipe<TIn, TOut>[];
}