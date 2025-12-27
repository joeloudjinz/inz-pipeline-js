import {IPipe} from './IPipe';
import {IPipelineContext} from './IPipelineContext';

/**
 * Defines the contract for an error handling policy that can be applied to a pipe.
 * Error handling policies determine how to handle exceptions that occur during pipe execution.
 */
export interface IErrorHandlingPolicy<TIn, TOut> {
    /**
     * Executes the pipe with the error handling policy applied.
     * This method wraps the pipe execution with the appropriate error handling logic.
     */
    execute(pipe: IPipe<TIn, TOut>, context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void>;
}