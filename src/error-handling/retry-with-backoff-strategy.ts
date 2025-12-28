import {IErrorRecoveryStrategy} from '../contracts/error-recovery-strategy.interface';
import {IPipe} from '../contracts/pipe.interface';
import {IPipelineContext} from '../contracts/pipeline-context.interface';
import {ErrorHandlingUtils} from './error-handling-utils';
import {ErrorHandlingConstants} from './error-handling-constants';

/**
 * Implements a retry with backoff strategy for error recovery.
 */
export class RetryWithBackoffStrategy<TIn, TOut> implements IErrorRecoveryStrategy<TIn, TOut> {
    private readonly maxAttempts: number;
    private readonly initialDelay: number;
    private readonly maxDelay: number;
    private readonly shouldRetry?: (error: Error) => boolean;

    /**
     * Initializes a new instance of the RetryWithBackoffStrategy class.
     */
    constructor(
        maxAttempts: number = 3,
        initialDelay: number = 1000, // 1 second default
        maxDelay: number = 60000, // 1 minute default
        shouldRetry?: (error: Error) => boolean
    ) {
        this.maxAttempts = maxAttempts > 0 ? maxAttempts : 1;
        this.initialDelay = initialDelay > 0 ? initialDelay : 1000;
        this.maxDelay = maxDelay > 0 ? maxDelay : 60000;
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

                // Calculate delay for this attempt using exponential backoff
                // Delay = initialDelay * (2 ^ (attempt - 1)), capped at maxDelay
                let currentDelay = this.initialDelay * Math.pow(2, attempts - 1);
                if (currentDelay > this.maxDelay) {
                    currentDelay = this.maxDelay;
                }

                // Log the retry attempt
                console.warn(
                    `Recovery strategy: Pipe ${pipe.constructor.name} failed on attempt ${attempts}/${this.maxAttempts}, retrying in ${currentDelay}ms`,
                    lastError
                );

                // Add a delay before retry
                await this.delay(currentDelay);
            }
        }

        // If we get here, all retry attempts have been exhausted
        const message = ErrorHandlingConstants.RECOVERY_STRATEGY_FAILED.replace('%d', this.maxAttempts.toString());
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