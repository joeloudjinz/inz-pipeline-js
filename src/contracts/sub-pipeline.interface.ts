import {IPipelineContext} from './pipeline-context.interface';
import {IPipe} from './pipe.interface';

/**
 * Defines the contract for a sub-pipeline that can be executed as part of a parent pipeline.
 * Sub-pipelines allow for pipeline composition and reusability by encapsulating
 * a set of operations that can be reused across different pipelines.
 */
export interface ISubPipeline<TIn, TOut> {
    /**
     * Executes the sub-pipeline asynchronously with the provided context.
     * The sub-pipeline uses the same context as the parent pipeline, allowing
     * data to be shared between the parent and sub-pipeline operations.
     */
    execute(context: IPipelineContext<TIn, TOut>): Promise<void>;

    /**
     * Gets the pipes that are part of this sub-pipeline for validation purposes.
     */
    getPipes(): IPipe<TIn, TOut>[];
}