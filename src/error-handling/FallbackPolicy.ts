import { IErrorHandlingPolicy } from '../contracts/IErrorHandlingPolicy';
import { IPipe } from '../contracts/IPipe';
import { IPipelineContext } from '../contracts/IPipelineContext';
import { ErrorHandlingUtils } from './ErrorHandlingUtils';
import { ErrorHandlingConstants } from './ErrorHandlingConstants';

/**
 * Implements a fallback policy that executes a fallback pipe when the primary pipe fails.
 */
export class FallbackPolicy<TIn, TOut> implements IErrorHandlingPolicy<TIn, TOut> {
  private readonly fallbackPipe: IPipe<TIn, TOut>;
  private readonly shouldFallback?: (error: Error) => boolean;

  /**
   * Initializes a new instance of the FallbackPolicy class.
   */
  constructor(
    fallbackPipe: IPipe<TIn, TOut>,
    shouldFallback?: (error: Error) => boolean
  ) {
    this.fallbackPipe = fallbackPipe;
    this.shouldFallback = shouldFallback;
  }

  public async execute(
    pipe: IPipe<TIn, TOut>,
    context: IPipelineContext<TIn, TOut>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation before proceeding
    ErrorHandlingUtils.checkAndHandleCancellation(cancellationToken, context, pipe);

    try {
      // Try to execute the primary pipe
      await pipe.handle(context, cancellationToken);
    } catch (primaryError) {
      const typedPrimaryError = primaryError as Error;

      // Check if we should execute the fallback for this specific error
      if (this.shouldFallback && !this.shouldFallback(typedPrimaryError)) {
        // Don't execute fallback, re-throw the primary error
        ErrorHandlingUtils.addErrorToContext(context, typedPrimaryError, pipe, ErrorHandlingConstants.PRIMARY_PIPE_FAILED_NO_FALLBACK);
        throw typedPrimaryError;
      }

      console.warn(`Primary pipe failed, executing fallback pipe: ${typedPrimaryError.message}`);

      try {
        // Execute the fallback pipe
        await this.fallbackPipe.handle(context, cancellationToken);

        // Log that fallback was successful
        console.info('Fallback pipe executed successfully');
      } catch (fallbackError) {
        const typedFallbackError = fallbackError as Error;

        // Both primary and fallback pipes failed
        const combinedErrorMessage = `Primary: ${typedPrimaryError.message}, Fallback: ${typedFallbackError.message}`;
        ErrorHandlingUtils.addErrorToContext(
          context,
          typedFallbackError,
          pipe,
          `${ErrorHandlingConstants.BOTH_PRIMARY_AND_FALLBACK_FAILED}: ${combinedErrorMessage}`
        );

        // Throw the fallback error since it's the last attempt
        throw fallbackError;
      }
    }
  }
}