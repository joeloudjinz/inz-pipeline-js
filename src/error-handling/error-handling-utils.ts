import {IPipelineContext} from '../contracts/pipeline-context.interface';
import {PipelineErrorModel} from '../models/pipeline-error.model';
import {IPipe} from '../contracts/pipe.interface';
import {ErrorHandlingConstants} from './error-handling-constants';

/**
 * Utility class for standardized error handling across the pipeline.
 */
export class ErrorHandlingUtils {
    /**
     * Standardized method to handle errors by adding them to the context.
     * @param context The pipeline context
     * @param error The error that occurred
     * @param pipe The pipe where the error occurred (optional)
     * @param messagePrefix A prefix to add to the error message (optional)
     * @param attemptNumber The attempt number when the error occurred (optional)
     */
    public static addErrorToContext<TIn, TOut>(
        context: IPipelineContext<TIn, TOut>,
        error: Error,
        pipe?: IPipe<TIn, TOut>,
        messagePrefix?: string,
        attemptNumber?: number
    ): void {
        context.hasPipeFailure = true;

        const errorMessage = messagePrefix ? `${messagePrefix}: ${error.message}` : error.message;
        context.errors.push(errorMessage);

        const pipelineError = new PipelineErrorModel(errorMessage, error);
        pipelineError.pipeName = pipe?.constructor.name;
        pipelineError.attemptNumber = attemptNumber;

        context.pipelineErrors.push(pipelineError);
    }

    /**
     * Standardized method to handle errors when continueOnFailure is enabled.
     * @param context The pipeline context
     * @param error The error that occurred
     * @param pipe The pipe where the error occurred
     * @param messagePrefix A prefix to add to the error message (optional)
     * @param attemptNumber The attempt number when the error occurred (optional)
     */
    public static handleContinueOnFailure<TIn, TOut>(
        context: IPipelineContext<TIn, TOut>,
        error: Error,
        pipe: IPipe<TIn, TOut>,
        messagePrefix?: string,
        attemptNumber?: number
    ): void {
        ErrorHandlingUtils.addErrorToContext(context, error, pipe, messagePrefix, attemptNumber);
    }

    /**
     * Standardized method to handle cancellation errors.
     * @param context The pipeline context
     * @param pipe The pipe where the cancellation occurred
     */
    public static handleCancellation<TIn, TOut>(
        context: IPipelineContext<TIn, TOut>,
        pipe?: IPipe<TIn, TOut>
    ): void {
        const cancellationError = new Error(ErrorHandlingConstants.PIPELINE_EXECUTION_CANCELLED);
        ErrorHandlingUtils.addErrorToContext(context, cancellationError, pipe);
        throw cancellationError;
    }

    /**
     * Standardized method to check for cancellation and throw if cancelled.
     * @param cancellationToken The cancellation token
     * @param context The pipeline context
     * @param pipe The pipe where the check is happening
     */
    public static checkAndHandleCancellation<TIn, TOut>(
        cancellationToken: AbortSignal | undefined,
        context: IPipelineContext<TIn, TOut>,
        pipe?: IPipe<TIn, TOut>
    ): void {
        if (cancellationToken?.aborted) {
            ErrorHandlingUtils.handleCancellation(context, pipe);
        }
    }
}