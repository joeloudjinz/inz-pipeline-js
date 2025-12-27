import {IErrorRecoveryStrategy} from '../contracts/IErrorRecoveryStrategy';
import {IPipe} from '../contracts/IPipe';
import {IPipelineContext} from '../contracts/IPipelineContext';
import {ErrorHandlingUtils} from './ErrorHandlingUtils';
import {ErrorHandlingConstants} from './ErrorHandlingConstants';

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
        context: IPipelineContext<TIn, TOut>,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        let attempts = 0;
        let lastError: Error | undefined;

        while (attempts < this.maxAttempts) {
            try {
                // Check for cancellation before each attempt
                ErrorHandlingUtils.checkAndHandleCancellation(cancellationToken, context, pipe);

                await pipe.handle(context, cancellationToken);
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

                // Add a delay before retry, but also check for cancellation during the delay
                try {
                    await this.delayWithCancellation(currentDelay, cancellationToken);
                } catch (cancelError) {
                    // If cancellation occurred during the delay, re-throw
                    throw cancelError;
                }
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
     * Creates a delay that can be interrupted by a cancellation token.
     */
    private async delayWithCancellation(delay: number, cancellationToken?: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                resolve();
            }, delay);

            if (cancellationToken) {
                cancellationToken.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Pipeline execution was cancelled during retry delay'));
                });
            }
        });
    }
}