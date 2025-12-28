import {IErrorHandlingPolicy} from '../contracts/error-handling-policy.interface';
import {IPipe} from '../contracts/pipe.interface';
import {IPipelineContext} from '../contracts/pipeline-context.interface';
import {ErrorHandlingUtils} from './error-handling-utils';
import {ErrorHandlingConstants} from './error-handling-constants';

/**
 * Implements a retry policy with configurable attempts and delay.
 */
export class RetryPolicy<TIn, TOut> implements IErrorHandlingPolicy<TIn, TOut> {
    private readonly maxAttempts: number;
    private readonly baseDelay: number;
    private readonly maxDelay: number;
    private readonly useExponentialBackoff: boolean;
    private readonly shouldRetry?: (error: Error) => boolean;

    /**
     * Initializes a new instance of the RetryPolicy class.
     */
    constructor(
        maxAttempts: number = 3,
        baseDelay: number = 1000, // 1 second default
        maxDelay: number = 60000, // 1 minute default
        useExponentialBackoff: boolean = false,
        shouldRetry?: (error: Error) => boolean
    ) {
        this.maxAttempts = maxAttempts > 0 ? maxAttempts : 1;
        this.baseDelay = baseDelay > 0 ? baseDelay : 1000;
        this.maxDelay = maxDelay > 0 ? maxDelay : 60000;
        this.useExponentialBackoff = useExponentialBackoff;
        this.shouldRetry = shouldRetry;
    }

    public async execute(
        pipe: IPipe<TIn, TOut>,
        context: IPipelineContext<TIn, TOut>
    ): Promise<void> {
        let attempts = 0;
        let lastError: Error | undefined;

        while (attempts < this.maxAttempts) {
            try {
                await pipe.handle(context);
                return; // Success, exit the retry loop
            } catch (error) {
                lastError = error as Error;
                attempts++;

                // Check if we should retry this specific error
                if (this.shouldRetry && !this.shouldRetry(lastError)) {
                    // Don't retry, re-throw immediately
                    const message = ErrorHandlingConstants.NON_RETRYABLE_EXCEPTION.replace('%d', attempts.toString());
                    ErrorHandlingUtils.addErrorToContext(
                        context,
                        lastError,
                        pipe,
                        message,
                        attempts
                    );
                    throw lastError;
                }

                // If we've reached max attempts, re-throw the last error
                if (attempts >= this.maxAttempts) {
                    break;
                }

                // Calculate delay for this attempt
                let currentDelay = this.baseDelay;
                if (this.useExponentialBackoff) {
                    // Exponential backoff: baseDelay * (2 ^ attempt number)
                    const exponentialFactor = Math.pow(2, attempts - 1);
                    currentDelay = this.baseDelay * exponentialFactor;

                    // Cap the delay at the maximum allowed
                    if (currentDelay > this.maxDelay) {
                        currentDelay = this.maxDelay;
                    }
                }

                // Log the retry attempt
                console.warn(
                    `Pipe ${pipe.constructor.name} failed on attempt ${attempts}/${this.maxAttempts}, retrying in ${currentDelay}ms`,
                    lastError
                );

                // Add a delay before retry
                await this.delay(currentDelay);
            }
        }

        // If we get here, all retry attempts have been exhausted
        const message = ErrorHandlingConstants.PIPE_FAILED_AFTER_RETRIES.replace('%d', this.maxAttempts.toString());
        ErrorHandlingUtils.addErrorToContext(
            context,
            lastError || new Error('Unknown error after retries'),
            pipe,
            message,
            attempts
        );

        throw lastError;
    }

    /**
     * Creates a standard delay.
     */
    private async delay(delay: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }
}