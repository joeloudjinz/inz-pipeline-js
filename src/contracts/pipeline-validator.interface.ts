import {IPipelineContext} from './pipeline-context.interface';
import {IPipe} from './pipe.interface';

/**
 * Defines the contract for a pipeline validator that can validate the pipeline configuration
 * before execution.
 */
export interface IPipelineValidator<TIn, TOut> {
    /**
     * Validates the pipeline configuration with the provided context and pipes.
     * Returns a list of validation errors or warnings.
     */
    validate(context: IPipelineContext<TIn, TOut>, pipes: IPipe<TIn, TOut>[]): Promise<string[]>;
}