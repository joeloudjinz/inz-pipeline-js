import {IPipelineBuilder} from './contracts/IPipelineBuilder';
import {IPipelineContext} from './contracts/IPipelineContext';
import {IPipe} from './contracts/IPipe';
import {ISubPipeline} from './contracts/ISubPipeline';
import {IErrorRecoveryStrategy} from './contracts/IErrorRecoveryStrategy';
import {IPipelineValidator} from './contracts/IPipelineValidator';
import {IPipelineStep} from './contracts/IPipelineStep';
import {SequentialStep} from './steps/SequentialStep';
import {ConditionalStep} from './steps/ConditionalStep';
import {ParallelStep} from './steps/ParallelStep';
import {SubPipelineStep} from './steps/SubPipelineStep';
import {PipeConfiguration} from './configuration/PipeConfiguration';
import {ErrorHandlingOptions} from './configuration/ErrorHandlingOptions';
import {RetryPolicy} from './error-handling/RetryPolicy';
import {CircuitBreakerPolicy} from './error-handling/CircuitBreakerPolicy';
import {FallbackPolicy} from './error-handling/FallbackPolicy';
import {RetryWithBackoffStrategy} from './error-handling/RetryWithBackoffStrategy';
import {CircuitBreakerStrategy} from './error-handling/CircuitBreakerStrategy';
import {DefaultPipelineValidator} from './validation/DefaultPipelineValidator';
import {PerformanceMetrics} from './models/PerformanceMetrics';
import {MemoryMetrics} from './models/MemoryMetrics';

/**
 * The PipelineBuilder is a fluent API class that orchestrates the execution of a pipeline of operations.
 * It allows you to configure and execute a sequence of operations (pipes) that process input data of type TIn
 * and produce output data of type TOut.
 */
export class PipelineBuilder<TIn, TOut> implements IPipelineBuilder<TIn, TOut> {
    protected steps: IPipelineStep<TIn, TOut>[] = [];
    private context?: IPipelineContext<TIn, TOut>;
    private source?: TIn;
    private compiledSteps?: IPipelineStep<TIn, TOut>[];
    private validator?: IPipelineValidator<TIn, TOut>;

    /**
     * Gets the steps in the pipeline for validation purposes.
     */
    public getSteps(): IPipelineStep<TIn, TOut>[] {
        return [...this.steps]; // Return a copy to prevent external modification
    }

    /**
     * Attaches a context to the pipeline. The context holds the input data, output data, and other state
     * that is passed between pipes in the pipeline.
     */
    attachContext(context: IPipelineContext<TIn, TOut>): IPipelineBuilder<TIn, TOut> {
        this.context = context;
        return this;
    }

    /**
     * Sets the source input data for the pipeline. This data will be passed to the first pipe in the pipeline.
     */
    setSource(source: TIn): IPipelineBuilder<TIn, TOut> {
        this.source = source;
        return this;
    }

    /**
     * Attaches a pipe to the pipeline. Pipes are executed sequentially in the order they are attached.
     */
    attachPipe(pipe: IPipe<TIn, TOut>): IPipelineBuilder<TIn, TOut> {
        const config = new PipeConfiguration<TIn, TOut>();
        this.steps.push(new SequentialStep<TIn, TOut>(pipe, config));
        return this;
    }

    /**
     * Attaches a pipe to the pipeline with specific error handling configuration.
     * Pipes are executed sequentially in the order they are attached.
     */
    attachPipeWithConfig(pipe: IPipe<TIn, TOut>, configuration: PipeConfiguration<TIn, TOut>): IPipelineBuilder<TIn, TOut> {
        this.steps.push(new SequentialStep<TIn, TOut>(pipe, configuration));
        return this;
    }

    /**
     * Attaches a conditional pipe to the pipeline. This pipe will only be executed if the provided condition evaluates to true.
     */
    attachConditionalPipe(
        pipe: IPipe<TIn, TOut>,
        condition: (context: IPipelineContext<TIn, TOut>) => boolean
    ): IPipelineBuilder<TIn, TOut> {
        const config = new PipeConfiguration<TIn, TOut>();
        this.steps.push(new ConditionalStep<TIn, TOut>(pipe, condition, config));
        return this;
    }

    /**
     * Attaches a conditional pipe to the pipeline with specific error handling configuration.
     * This pipe will only be executed if the provided condition evaluates to true.
     */
    attachConditionalPipeWithConfig(
        pipe: IPipe<TIn, TOut>,
        condition: (context: IPipelineContext<TIn, TOut>) => boolean,
        configuration: PipeConfiguration<TIn, TOut>
    ): IPipelineBuilder<TIn, TOut> {
        this.steps.push(new ConditionalStep<TIn, TOut>(pipe, condition, configuration));
        return this;
    }

    /**
     * Attaches a set of pipes to run in parallel. All pipes in the set will be executed concurrently.
     */
    attachParallelPipes(...pipes: IPipe<TIn, TOut>[]): IPipelineBuilder<TIn, TOut> {
        this.steps.push(new ParallelStep<TIn, TOut>(pipes));
        return this;
    }

    /**
     * Attaches a sub-pipeline to the current pipeline. Sub-pipelines allow for pipeline composition and reusability.
     */
    attachSubPipeline(subPipeline: ISubPipeline<TIn, TOut>): IPipelineBuilder<TIn, TOut> {
        this.steps.push(new SubPipelineStep<TIn, TOut>(subPipeline));
        return this;
    }

    /**
     * Attaches a pipe to the pipeline with a retry policy.
     */
    attachPipeWithRetryPolicy(
        pipe: IPipe<TIn, TOut>,
        maxAttempts: number = 3,
        delay: number = 1000,
        maxDelay: number = 60000,
        useExponentialBackoff: boolean = false,
        shouldRetry?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut> {
        const policy = new RetryPolicy<TIn, TOut>(maxAttempts, delay, maxDelay, useExponentialBackoff, shouldRetry);
        const configuration = new PipeConfiguration<TIn, TOut>();
        configuration.errorHandlingPolicy = policy;
        this.steps.push(new SequentialStep<TIn, TOut>(pipe, configuration));
        return this;
    }

    /**
     * Attaches a pipe to the pipeline with a circuit breaker policy.
     */
    attachPipeWithCircuitBreakerPolicy(
        pipe: IPipe<TIn, TOut>,
        failureThreshold: number = 5,
        timeout: number = 60000,
        shouldHandle?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut> {
        const policy = new CircuitBreakerPolicy<TIn, TOut>(failureThreshold, timeout, shouldHandle);
        const configuration = new PipeConfiguration<TIn, TOut>();
        configuration.errorHandlingPolicy = policy;
        this.steps.push(new SequentialStep<TIn, TOut>(pipe, configuration));
        return this;
    }

    /**
     * Attaches a pipe to the pipeline with a fallback policy.
     */
    attachPipeWithFallbackPolicy(
        pipe: IPipe<TIn, TOut>,
        fallbackPipe: IPipe<TIn, TOut>,
        shouldFallback?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut> {
        const policy = new FallbackPolicy<TIn, TOut>(fallbackPipe, shouldFallback);
        const configuration = new PipeConfiguration<TIn, TOut>();
        configuration.errorHandlingPolicy = policy;
        this.steps.push(new SequentialStep<TIn, TOut>(pipe, configuration));
        return this;
    }

    /**
     * Attaches a pipe to the pipeline with a circuit breaker recovery strategy.
     */
    attachPipeWithCircuitBreakerStrategy(
        pipe: IPipe<TIn, TOut>,
        failureThreshold: number = 5,
        timeout: number = 60000,
        shouldHandle?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut> {
        const strategy = new CircuitBreakerStrategy<TIn, TOut>(failureThreshold, timeout, shouldHandle);
        const configuration = new PipeConfiguration<TIn, TOut>();
        configuration.recoveryStrategy = strategy;
        this.steps.push(new SequentialStep<TIn, TOut>(pipe, configuration));
        return this;
    }

    /**
     * Attaches a pipe to the pipeline with a retry with backoff recovery strategy.
     */
    attachPipeWithRetryStrategy(
        pipe: IPipe<TIn, TOut>,
        maxAttempts: number = 3,
        initialDelay: number = 1000,
        maxDelay: number = 60000,
        shouldRetry?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut> {
        const strategy = new RetryWithBackoffStrategy<TIn, TOut>(maxAttempts, initialDelay, maxDelay, shouldRetry);
        const configuration = new PipeConfiguration<TIn, TOut>();
        configuration.recoveryStrategy = strategy;
        this.steps.push(new SequentialStep<TIn, TOut>(pipe, configuration));
        return this;
    }

    /**
     * Sets a global recovery strategy for the entire pipeline.
     */
    withRecoveryStrategy(strategy: IErrorRecoveryStrategy<TIn, TOut>): IPipelineBuilder<TIn, TOut> {
        if (this.context) {
            if (!this.context.errorHandlingOptions) {
                this.context.errorHandlingOptions = new ErrorHandlingOptions<TIn, TOut>();
            }
            this.context.errorHandlingOptions.recoveryStrategy = strategy;
        }
        return this;
    }

    /**
     * Sets global error handling options for the entire pipeline.
     */
    withErrorHandlingOptions(options: ErrorHandlingOptions<TIn, TOut>): IPipelineBuilder<TIn, TOut> {
        if (this.context) {
            this.context.continueOnFailure = options.continueOnFailure;
            this.context.errorHandlingOptions = options;
        }
        return this;
    }

    /**
     * Enables performance metrics collection for the pipeline. This will track execution times,
     * resource usage, and other performance indicators.
     */
    enablePerformanceMetrics(correlationId?: string): IPipelineBuilder<TIn, TOut> {
        if (this.context) {
            if (!this.context.performanceMetrics) {
                this.context.performanceMetrics = new PerformanceMetrics();
            }
            this.context.performanceMetrics.isEnabled = true;
            if (correlationId) {
                this.context.performanceMetrics.correlationId = correlationId;
            }
        }
        return this;
    }

    /**
     * Disables performance metrics collection for the pipeline. This will prevent tracking
     * execution times, resource usage, and other performance indicators.
     */
    disablePerformanceMetrics(): IPipelineBuilder<TIn, TOut> {
        if (this.context) {
            if (!this.context.performanceMetrics) {
                this.context.performanceMetrics = new PerformanceMetrics();
            }
            this.context.performanceMetrics.isEnabled = false;
        }
        return this;
    }

    /**
     * Validates the current pipeline configuration to ensure that all required components are properly set up.
     */
    async validateConfiguration(): Promise<void> {
        if (!this.context) {
            throw new Error("Context must be attached, call attachContext()");
        }

        if (!this.source) {
            throw new Error("Source must be set, call setSource()");
        }

        if (this.steps.length === 0) {
            throw new Error("At least one step must be attached to the pipeline");
        }

        // Basic validation for each step
        for (let i = 0; i < this.steps.length; i++) {
            if (!this.steps[i]) {
                throw new Error(`Pipeline step at index ${i} is null and cannot be executed`);
            }
        }

        // Perform detailed validation using the attached validator if available
        const pipes = this.steps.flatMap(step => this.extractPipesFromStep(step));
        if (this.validator) {
            const validationResults = await this.validator.validate(this.context, pipes);
            this.context.validationErrors.push(...validationResults.filter(e => !e.startsWith("WARNING:")));
            this.context.validationWarnings.push(...validationResults
                .filter(e => e.startsWith("WARNING:"))
                .map(e => e.substring(8))); // Remove "WARNING:" prefix
        } else {
            // Use default validation if no custom validator is attached
            const defaultValidator = new DefaultPipelineValidator<TIn, TOut>();
            const validationResults = await defaultValidator.validate(this.context, pipes);
            this.context.validationErrors.push(...validationResults.filter(e => !e.startsWith("WARNING:")));
            this.context.validationWarnings.push(...validationResults
                .filter(e => e.startsWith("WARNING:"))
                .map(e => e.substring(8))); // Remove "WARNING:" prefix
        }

        this.context.isConfigurationValidated = true;

        // Throw if there are validation errors
        if (this.context.validationErrors.length > 0) {
            const errorMessages = this.context.validationErrors.join("; ");
            throw new Error(`Pipeline configuration validation failed: ${errorMessages}`);
        }
    }

    /**
     * Performs validation on the pipeline configuration and returns any validation
     * errors and warnings without throwing an exception.
     */
    async validateConfigurationForResult(): Promise<{ errors: string[]; warnings: string[] }> {
        if (!this.context) {
            throw new Error("Context must be attached, call attachContext()");
        }

        if (!this.source) {
            throw new Error("Source must be set, call setSource()");
        }

        if (this.steps.length === 0) {
            throw new Error("At least one step must be attached to the pipeline");
        }

        const pipes = this.steps.flatMap(step => this.extractPipesFromStep(step));

        if (this.validator) {
            const validationResults = await this.validator.validate(this.context, pipes);
            const errors = validationResults.filter(e => !e.startsWith("WARNING:"));
            const warnings = validationResults
                .filter(e => e.startsWith("WARNING:"))
                .map(e => e.substring(8)); // Remove "WARNING:" prefix
            return {errors, warnings};
        } else {
            // Use default validation if no custom validator is attached
            const defaultValidator = new DefaultPipelineValidator<TIn, TOut>();
            const validationResults = await defaultValidator.validate(this.context, pipes);
            const errors = validationResults.filter(e => !e.startsWith("WARNING:"));
            const warnings = validationResults
                .filter(e => e.startsWith("WARNING:"))
                .map(e => e.substring(8)); // Remove "WARNING:" prefix
            return {errors, warnings};
        }
    }

    /**
     * Attaches a validator to the pipeline to perform detailed validation
     * before pipeline execution.
     */
    attachValidator(validator: IPipelineValidator<TIn, TOut>): IPipelineBuilder<TIn, TOut> {
        this.validator = validator;
        return this;
    }

    /**
     * Executes the pipeline with the configured context, source data, and pipes.
     * This method will validate the configuration and then execute all attached pipes in the specified order.
     */
    async flush(cancellationToken?: AbortSignal): Promise<void> {
        await this.validateConfiguration();
        await this.executeInternal(cancellationToken);
    }

    /**
     * Extracts pipes from a pipeline step, handling different step types.
     */
    private extractPipesFromStep(step: IPipelineStep<TIn, TOut>): IPipe<TIn, TOut>[] {
        // Use type guards to determine the step type and extract pipes accordingly
        if (this.isParallelStep(step)) {
            return [...(step as ParallelStep<TIn, TOut>).pipes]; // Return a copy to prevent external modification
        } else if (this.isSequentialStep(step) || this.isConditionalStep(step)) {
            if (this.isSequentialStep(step)) {
                return [(step as SequentialStep<TIn, TOut>).pipe];
            } else {
                return [(step as ConditionalStep<TIn, TOut>).pipe];
            }
        } else {
            // For other step types (like SubPipelineStep) that implement getPipes
            return step.getPipes();
        }
    }

    private async executeInternal(cancellationToken?: AbortSignal): Promise<void> {
        if (!this.context) {
            throw new Error("Context must be attached before execution");
        }

        if (!this.source) {
            throw new Error("Source must be set before execution");
        }

        const startTime = Date.now();

        // Always apply the source to the context's input to ensure
        // data passed via setSource is available to the pipes
        this.context.input = this.source;

        // Initialize performance metrics if not already initialized
        if (!this.context.performanceMetrics) {
            this.context.performanceMetrics = new PerformanceMetrics();
            this.context.performanceMetrics.isEnabled = true;
        }

        // Set start time and initial memory metrics if performance tracking is enabled
        if (this.context.performanceMetrics.isEnabled) {
            this.context.performanceMetrics.startTime = startTime;
            if (!this.context.performanceMetrics.memoryMetrics) {
                this.context.performanceMetrics.memoryMetrics = new MemoryMetrics();
            }
            this.context.performanceMetrics.memoryMetrics.initialMemoryBytes = this.getMemoryUsage();
            if (!this.context.performanceMetrics.correlationId) {
                this.context.performanceMetrics.correlationId = this.generateCorrelationId();
            }
        }

        this.compiledSteps = this.steps;

        for (const step of this.compiledSteps) {
            if (cancellationToken?.aborted) {
                throw new Error("Pipeline execution was cancelled");
            }

            const stepStartTime = Date.now();
            await step.execute(this.context, cancellationToken);
            const stepEndTime = Date.now();

            // Track individual step execution time if performance metrics are enabled
            if (this.context.performanceMetrics?.isEnabled && this.context.performanceMetrics.pipeDurations) {
                // Use the constructor name of the first pipe in the step as the key
                const pipeName = this.extractStepName(step);
                this.context.performanceMetrics.pipeDurations[pipeName] = stepEndTime - stepStartTime;
            }
        }

        const endTime = Date.now();
        const totalDuration = endTime - startTime;

        if (this.context.performanceMetrics?.isEnabled) {
            this.context.performanceMetrics.endTime = endTime;
            this.context.performanceMetrics.totalDurationMs = totalDuration;

            if (this.context.performanceMetrics.memoryMetrics) {
                this.context.performanceMetrics.memoryMetrics.finalMemoryBytes = this.getMemoryUsage();
            }
        }

        console.log(`Pipeline completed in ${totalDuration}ms`);
    }

    /**
     * Extracts a name for the step to use in performance metrics.
     */
    private extractStepName(step: IPipelineStep<TIn, TOut>): string {
        // Use type guards to determine the step type and extract the name accordingly
        if (this.isSequentialStep(step)) {
            return (step as SequentialStep<TIn, TOut>).pipe.constructor.name;
        } else if (this.isConditionalStep(step)) {
            return `${(step as ConditionalStep<TIn, TOut>).pipe.constructor.name}_Conditional`;
        } else if (this.isParallelStep(step)) {
            return `Parallel_${(step as ParallelStep<TIn, TOut>).pipes.map(p => p.constructor.name).join('_')}`;
        } else if (this.isSubPipelineStep(step)) {
            return 'SubPipeline';
        }
        return 'UnknownStep';
    }

    /**
     * Type guard to check if a step is a SequentialStep
     */
    private isSequentialStep(step: IPipelineStep<TIn, TOut>): step is SequentialStep<TIn, TOut> {
        return step instanceof SequentialStep;
    }

    /**
     * Type guard to check if a step is a ConditionalStep
     */
    private isConditionalStep(step: IPipelineStep<TIn, TOut>): step is ConditionalStep<TIn, TOut> {
        return step instanceof ConditionalStep;
    }

    /**
     * Type guard to check if a step is a ParallelStep
     */
    private isParallelStep(step: IPipelineStep<TIn, TOut>): step is ParallelStep<TIn, TOut> {
        return step instanceof ParallelStep;
    }

    /**
     * Type guard to check if a step is a SubPipelineStep
     */
    private isSubPipelineStep(step: IPipelineStep<TIn, TOut>): step is SubPipelineStep<TIn, TOut> {
        return step instanceof SubPipelineStep;
    }

    private getMemoryUsage(): number {
        // In a Node.js environment, we could use process.memoryUsage()
        // For browser compatibility, we'll return 0 for now
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return 0;
    }

    private generateCorrelationId(): string {
        // Generate a simple correlation ID
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}