import {IPipelineContext} from './pipeline-context.interface';

/**
 * Defines the contract for a pipe in the pipeline. A pipe represents a single operation
 * that processes input data and produces output data within the pipeline.
 */
export interface IPipe<TIn, TOut> {
    /**
     * Handles the processing of the pipe within the pipeline context.
     * This method performs the specific operation that the pipe is designed for.
     */
    handle(context: IPipelineContext<TIn, TOut>): Promise<void>;

    /**
     * Gets the list of resource keys that this pipe requires to be present in the context
     * before execution. This allows for validation of required dependencies prior to execution.
     */
    getRequiredResources?(): string[];

    /**
     * Gets the list of resource keys that this pipe will provide to the context
     * after successful execution. This allows for validation of resource flows.
     */
    getProvidedResources?(): string[];
}