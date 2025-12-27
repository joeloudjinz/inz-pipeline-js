import { IErrorHandlingPolicy } from '../contracts/IErrorHandlingPolicy';
import { IPipe } from '../contracts/IPipe';
import { IPipelineContext } from '../contracts/IPipelineContext';
import { PipelineError } from '../models/PipelineError';

/**
 * Implements a retry policy with configurable attempts and delay.
 */
export class RetryPolicy<TIn, TOut> implements IErrorHandlingPolicy<TIn, TOut> {
  private readonly maxAttempts: number;
  private readonly delay: number;
  private readonly maxDelay: number;
  private readonly useExponentialBackoff: boolean;
  private readonly shouldRetry?: (error: Error) => boolean;

  /**
   * Initializes a new instance of the RetryPolicy class.
   */
  constructor(
    maxAttempts: number = 3,
    delay: number = 1000, // 1 second default
    maxDelay: number = 60000, // 1 minute default
    useExponentialBackoff: boolean = false,
    shouldRetry?: (error: Error) => boolean
  ) {
    this.maxAttempts = maxAttempts > 0 ? maxAttempts : 1;
    this.delay = delay > 0 ? delay : 1000;
    this.maxDelay = maxDelay > 0 ? maxDelay : 60000;
    this.useExponentialBackoff = useExponentialBackoff;
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
        if (cancellationToken?.aborted) {
          throw new Error('Pipeline execution was cancelled');
        }

        await pipe.handle(context, cancellationToken);
        return; // Success, exit the retry loop
      } catch (error) {
        lastError = error as Error;
        attempts++;

        // Check if we should retry this specific error
        if (this.shouldRetry && !this.shouldRetry(lastError)) {
          // Don't retry, re-throw immediately
          context.hasPipeFailure = true;
          context.errors.push(lastError.message);
          context.pipelineErrors.push(new PipelineError(
            `Pipe failed after ${attempts} attempt(s) - non-retryable exception: ${lastError.message}`,
            lastError
          ));
          throw lastError;
        }

        // If we've reached max attempts, re-throw the last error
        if (attempts >= this.maxAttempts) {
          break;
        }

        // Calculate delay for this attempt
        let currentDelay = this.delay;
        if (this.useExponentialBackoff) {
          // Exponential backoff: delay * (2 ^ attempt number)
          const exponentialFactor = Math.pow(2, attempts - 1);
          currentDelay = this.delay * exponentialFactor;

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
    context.hasPipeFailure = true;
    context.errors.push(lastError?.message || 'Unknown error after retries');
    context.pipelineErrors.push(new PipelineError(
      `Pipe failed after ${this.maxAttempts} attempt(s): ${(lastError as Error)?.message}`,
      lastError
    ));
    
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