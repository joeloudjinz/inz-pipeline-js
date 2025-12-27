import { IPipelineContext } from './IPipelineContext';

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
}