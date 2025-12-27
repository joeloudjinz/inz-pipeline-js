import {IPipelineContext} from './contracts/IPipelineContext';
import {PerformanceMetrics} from './models/PerformanceMetrics';
import {PipelineError} from './models/PipelineError';
import {ErrorHandlingOptions} from './configuration/ErrorHandlingOptions';

/**
 * Represents the context that flows through the pipeline, carrying data and state between pipes.
 * This class provides input/output data, error handling, logging, and metrics capabilities.
 */
export abstract class PipelineContext<TIn, TOut> implements IPipelineContext<TIn, TOut> {
    /**
     * Internal data repository for storing arbitrary data that needs to be shared between pipes
     * within the pipeline execution. Uses Map for key-value storage.
     */
    private readonly dataRepository: Map<string, any> = new Map();

    /**
     * Gets or sets the input data for the pipeline. This is the data that flows through the pipeline
     * and is processed by each pipe.
     */
    public input: TIn = undefined as unknown as TIn;

    /**
     * Gets or sets the output data for the pipeline. This is the final result produced by the pipeline.
     */
    public output: TOut = undefined as unknown as TOut;

    /**
     * Gets or sets a value indicating whether any pipe in the pipeline has failed.
     */
    public hasPipeFailure: boolean = false;

    /**
     * Gets or sets the list of errors that occurred during pipeline execution.
     */
    public errors: string[] = [];

    /**
     * Gets or sets the list of detailed pipeline errors that occurred during execution,
     * including exception information and timestamps.
     */
    public pipelineErrors: PipelineError[] = [];

    /**
     * Gets or sets a value indicating whether the pipeline should continue executing
     * subsequent pipes even if one pipe fails.
     */
    public continueOnFailure: boolean = false;

    /**
     * Gets or sets the performance metrics for the pipeline execution, including
     * execution times, resource usage, and other performance indicators.
     */
    public performanceMetrics?: PerformanceMetrics;

    /**
     * Gets or sets the error handling options for the pipeline, including
     * default policies, recovery strategies, and error handling behavior.
     */
    public errorHandlingOptions?: ErrorHandlingOptions<TIn, TOut>;

    /**
     * Gets or sets the list of validation errors that occurred during pipeline validation.
     */
    public validationErrors: string[] = [];

    /**
     * Gets or sets the list of validation warnings that occurred during pipeline validation.
     */
    public validationWarnings: string[] = [];

    /**
     * Gets or sets a value indicating whether the pipeline configuration has been validated.
     */
    public isConfigurationValidated: boolean = false;

    /**
     * Gets a resource from the context's data repository by its key.
     */
    public getResource<T>(key: string): T {
        if (!this.dataRepository.has(key)) {
            throw new Error(`Resource with key '${key}' was not found in the context.`);
        }
        return this.dataRepository.get(key) as T;
    }

    /**
     * Tries to get a resource from the context's data repository by its key.
     */
    public tryGetResource<T>(key: string, defaultValue?: T): { success: boolean; value: T | undefined } {
        if (this.dataRepository.has(key)) {
            return {success: true, value: this.dataRepository.get(key) as T};
        }
        return {success: false, value: defaultValue};
    }

    /**
     * Adds a resource to the context's data repository.
     */
    public addResource<T>(key: string, value: T): void {
        if (this.dataRepository.has(key)) {
            throw new Error(`A resource with key '${key}' already exists in the context.`);
        }
        this.dataRepository.set(key, value);
    }

    /**
     * Tries to add a resource to the context's data repository.
     */
    public tryAddResource<T>(key: string, value: T): boolean {
        if (this.dataRepository.has(key)) {
            return false;
        }
        this.dataRepository.set(key, value);
        return true;
    }

    /**
     * Updates an existing resource in the context's data repository.
     */
    public updateResource<T>(key: string, value: T): void {
        if (!this.dataRepository.has(key)) {
            throw new Error(`Resource with key '${key}' was not found in the context.`);
        }
        this.dataRepository.set(key, value);
    }

    /**
     * Removes a resource from the context's data repository.
     */
    public removeResource(key: string): boolean {
        return this.dataRepository.delete(key);
    }

    /**
     * Gets a summary of the performance metrics as a formatted string.
     */
    public getPerformanceMetricsSummary(): string {
        if (!this.performanceMetrics || !this.performanceMetrics.isEnabled) {
            return "Performance metrics are not enabled.";
        }

        let summary = "=== Performance Metrics Summary ===\n";
        summary += `Correlation ID: ${this.performanceMetrics.correlationId}\n`;
        summary += `Start Time: ${this.performanceMetrics.startTime ? new Date(this.performanceMetrics.startTime).toISOString() : 'N/A'}\n`;
        summary += `End Time: ${this.performanceMetrics.endTime ? new Date(this.performanceMetrics.endTime).toISOString() : 'N/A'}\n`;
        summary += `Total Duration: ${this.performanceMetrics.totalDurationMs ? this.performanceMetrics.totalDurationMs.toFixed(2) : 0} ms\n`;

        if (this.performanceMetrics.memoryMetrics) {
            const memMetrics = this.performanceMetrics.memoryMetrics;
            summary += `Initial Memory: ${this.formatBytes(memMetrics.initialMemoryBytes)}\n`;
            summary += `Final Memory: ${this.formatBytes(memMetrics.finalMemoryBytes)}\n`;
            summary += `Peak Memory: ${this.formatBytes(memMetrics.peakMemoryBytes)}\n`;
            summary += `Allocated Bytes: ${this.formatBytes(memMetrics.allocatedBytes)}\n`;
            summary += `Memory Increase: ${this.formatBytes(memMetrics.memoryIncrease)}\n`;
        }

        if (this.performanceMetrics.pipeDurations && Object.keys(this.performanceMetrics.pipeDurations).length > 0) {
            summary += "Pipe Durations:\n";
            for (const [pipeName, duration] of Object.entries(this.performanceMetrics.pipeDurations)) {
                summary += `  - ${pipeName}: ${duration.toFixed(2)} ms\n`;
            }
        }

        if (this.performanceMetrics.customMetrics && Object.keys(this.performanceMetrics.customMetrics).length > 0) {
            summary += "Custom Metrics:\n";
            for (const [metricName, value] of Object.entries(this.performanceMetrics.customMetrics)) {
                summary += `  - ${metricName}: ${value}\n`;
            }
        }

        return summary;
    }

    /**
     * Formats a byte value into a human-readable string (e.g., KB, MB, GB).
     */
    private formatBytes(bytes: number): string {
        const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
        let counter = 0;
        let number = bytes;

        while (Math.round(number / 1024) >= 1) {
            number /= 1024;
            counter++;
        }

        return `${number.toFixed(1)} ${suffixes[counter]}`;
    }
}