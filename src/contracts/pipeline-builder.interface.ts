import {IPipe} from './pipe.interface';
import {IPipelineContext} from './pipeline-context.interface';
import {ISubPipeline} from './sub-pipeline.interface';
import {IErrorRecoveryStrategy} from './error-recovery-strategy.interface';
import {IPipelineValidator} from './pipeline-validator.interface';
import {PipeConfiguration} from '../configuration/pipe-configuration';
import {ErrorHandlingOptions} from '../configuration/error-handling-options';

/**
 * Defines the contract for building and executing a pipeline of operations.
 * The pipeline processes input data of type TIn and produces output data of type TOut.
 */
export interface IPipelineBuilder<TIn, TOut> {
    /**
     * Attaches a context to the pipeline. The context holds the input data, output data, and other state
     * that is passed between pipes in the pipeline.
     */
    attachContext(context: IPipelineContext<TIn, TOut>): IPipelineBuilder<TIn, TOut>;

    /**
     * Sets the source input data for the pipeline. This data will be passed to the first pipe in the pipeline.
     */
    setSource(source: TIn): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a pipe to the pipeline. Pipes are executed sequentially in the order they are attached.
     */
    attachPipe(pipe: IPipe<TIn, TOut>): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a pipe to the pipeline with specific error handling configuration.
     * Pipes are executed sequentially in the order they are attached.
     */
    attachPipeWithConfig(pipe: IPipe<TIn, TOut>, configuration: PipeConfiguration<TIn, TOut>): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a conditional pipe to the pipeline. This pipe will only be executed if the provided condition evaluates to true.
     */
    attachConditionalPipe(
        pipe: IPipe<TIn, TOut>,
        condition: (context: IPipelineContext<TIn, TOut>) => boolean
    ): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a conditional pipe to the pipeline with specific error handling configuration.
     * This pipe will only be executed if the provided condition evaluates to true.
     */
    attachConditionalPipeWithConfig(
        pipe: IPipe<TIn, TOut>,
        condition: (context: IPipelineContext<TIn, TOut>) => boolean,
        configuration: PipeConfiguration<TIn, TOut>
    ): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a set of pipes to run in parallel. All pipes in the set will be executed concurrently.
     */
    attachParallelPipes(...pipes: IPipe<TIn, TOut>[]): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a sub-pipeline to the current pipeline. Sub-pipelines allow for pipeline composition and reusability.
     */
    attachSubPipeline(subPipeline: ISubPipeline<TIn, TOut>): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a pipe to the pipeline with a retry policy.
     */
    attachPipeWithRetryPolicy(
        pipe: IPipe<TIn, TOut>,
        maxAttempts?: number,
        delay?: number,
        maxDelay?: number,
        useExponentialBackoff?: boolean,
        shouldRetry?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a pipe to the pipeline with a circuit breaker policy.
     */
    attachPipeWithCircuitBreakerPolicy(
        pipe: IPipe<TIn, TOut>,
        failureThreshold?: number,
        timeout?: number,
        shouldHandle?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a pipe to the pipeline with a fallback policy.
     */
    attachPipeWithFallbackPolicy(
        pipe: IPipe<TIn, TOut>,
        fallbackPipe: IPipe<TIn, TOut>,
        shouldFallback?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a pipe to the pipeline with a circuit breaker recovery strategy.
     */
    attachPipeWithCircuitBreakerStrategy(
        pipe: IPipe<TIn, TOut>,
        failureThreshold?: number,
        timeout?: number,
        shouldHandle?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut>;

    /**
     * Attaches a pipe to the pipeline with a retry with backoff recovery strategy.
     */
    attachPipeWithRetryStrategy(
        pipe: IPipe<TIn, TOut>,
        maxAttempts?: number,
        initialDelay?: number,
        maxDelay?: number,
        shouldRetry?: (error: Error) => boolean
    ): IPipelineBuilder<TIn, TOut>;

    /**
     * Sets a global recovery strategy for the entire pipeline.
     */
    withRecoveryStrategy(strategy: IErrorRecoveryStrategy<TIn, TOut>): IPipelineBuilder<TIn, TOut>;

    /**
     * Sets global error handling options for the entire pipeline.
     */
    withErrorHandlingOptions(options: ErrorHandlingOptions<TIn, TOut>): IPipelineBuilder<TIn, TOut>;

    /**
     * Enables performance metrics collection for the pipeline. This will track execution times,
     * resource usage, and other performance indicators.
     */
    enablePerformanceMetrics(correlationId?: string): IPipelineBuilder<TIn, TOut>;

    /**
     * Disables performance metrics collection for the pipeline. This will prevent tracking
     * execution times, resource usage, and other performance indicators.
     */
    disablePerformanceMetrics(): IPipelineBuilder<TIn, TOut>;

    /**
     * Validates the current pipeline configuration to ensure that all required components are properly set up.
     */
    validateConfiguration(): Promise<void>;

    /**
     * Performs validation on the pipeline configuration and returns any validation
     * errors and warnings without throwing an exception.
     */
    validateConfigurationForResult(): Promise<{ errors: string[]; warnings: string[] }>;

    /**
     * Attaches a validator to the pipeline to perform detailed validation
     * before pipeline execution.
     */
    attachValidator(validator: IPipelineValidator<TIn, TOut>): IPipelineBuilder<TIn, TOut>;

    /**
     * Executes the pipeline with the configured context, source data, and pipes.
     * This method will validate the configuration and then execute all attached pipes in the specified order.
     */
    flush(): Promise<void>;
}