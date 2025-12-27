import {IErrorHandlingPolicy} from '../contracts/IErrorHandlingPolicy';
import {IErrorRecoveryStrategy} from '../contracts/IErrorRecoveryStrategy';

/**
 * Represents the configuration for a single pipe in the pipeline, including error handling policies.
 */
export class PipeConfiguration<TIn, TOut> {
    /**
     * Gets or sets the error handling policy for this pipe.
     */
    public errorHandlingPolicy?: IErrorHandlingPolicy<TIn, TOut>;

    /**
     * Gets or sets whether the pipeline should continue executing subsequent pipes even if this pipe fails.
     */
    public continueOnFailure: boolean = false;

    /**
     * Gets or sets the timeout for this pipe execution.
     */
    public timeout?: number;

    /**
     * Gets or sets the maximum number of attempts for this pipe (for retry scenarios).
     */
    public maxAttempts: number = 1;

    /**
     * Gets or sets the recovery strategy for this pipe.
     */
    public recoveryStrategy?: IErrorRecoveryStrategy<TIn, TOut>;

    /**
     * Gets or sets custom metadata for this pipe configuration.
     */
    public metadata: { [key: string]: any } = {};
}