import {PerformanceMetrics} from '../models/PerformanceMetrics';
import {PipelineError} from '../models/PipelineError';
import {ErrorHandlingOptions} from '../configuration/ErrorHandlingOptions';

/**
 * Defines the contract for the context that flows through the pipeline, carrying data and state between pipes.
 * This interface provides access to input/output data, error handling, logging, and tracing capabilities.
 */
export interface IPipelineContext<TIn, TOut> {
    /**
     * Gets or sets the input data for the pipeline. This is the data that flows through the pipeline
     * and is processed by each pipe.
     */
    input: TIn;

    /**
     * Gets or sets the output data for the pipeline. This is the final result produced by the pipeline.
     */
    output: TOut;

    /**
     * Gets or sets a value indicating whether any pipe in the pipeline has failed.
     */
    hasPipeFailure: boolean;

    /**
     * Gets or sets the list of errors that occurred during pipeline execution.
     */
    errors: string[];

    /**
     * Gets or sets the list of detailed pipeline errors that occurred during execution,
     * including exception information and timestamps.
     */
    pipelineErrors: PipelineError[];

    /**
     * Gets or sets a value indicating whether the pipeline should continue executing
     * subsequent pipes even if one pipe fails.
     */
    continueOnFailure: boolean;

    /**
     * Gets or sets the performance metrics for the pipeline execution, including
     * execution times, resource usage, and other performance indicators.
     */
    performanceMetrics?: PerformanceMetrics;

    /**
     * Gets or sets the error handling options for the pipeline, including
     * default policies, recovery strategies, and error handling behavior.
     */
    errorHandlingOptions?: ErrorHandlingOptions<TIn, TOut>;

    /**
     * Gets or sets the list of validation errors that occurred during pipeline validation.
     */
    validationErrors: string[];

    /**
     * Gets or sets the list of validation warnings that occurred during pipeline validation.
     */
    validationWarnings: string[];

    /**
     * Gets or sets a value indicating whether the pipeline configuration has been validated.
     */
    isConfigurationValidated: boolean;

    /**
     * Gets a resource from the context's data repository by its key.
     */
    getResource<T>(key: string): T;

    /**
     * Tries to get a resource from the context's data repository by its key.
     */
    tryGetResource<T>(key: string, defaultValue?: T): { success: boolean; value: T | undefined };

    /**
     * Adds a resource to the context's data repository.
     */
    addResource<T>(key: string, value: T): void;

    /**
     * Tries to add a resource to the context's data repository.
     */
    tryAddResource<T>(key: string, value: T): boolean;

    /**
     * Updates an existing resource in the context's data repository.
     */
    updateResource<T>(key: string, value: T): void;

    /**
     * Removes a resource from the context's data repository.
     */
    removeResource(key: string): boolean;

    /**
     * Gets a summary of the performance metrics as a formatted string.
     */
    getPerformanceMetricsSummary(): string;
}