/**
 * Constants for error handling messages and prefixes
 */
export class ErrorHandlingConstants {
    // Circuit Breaker Policy
    public static readonly CIRCUIT_BREAKER_OPEN: string = 'Circuit breaker OPEN';
    public static readonly NON_CIRCUIT_BREAKER_ERROR: string = 'Non-circuit-breaker error';
    public static readonly CIRCUIT_BREAKER_FAILURE: string = 'Circuit breaker failure';

    // Circuit Breaker Strategy
    public static readonly CIRCUIT_BREAKER_STRATEGY_OPEN: string = 'Circuit breaker strategy OPEN';
    public static readonly CIRCUIT_BREAKER_STRATEGY_FAILURE: string = 'Circuit breaker strategy failure';

    // Fallback Policy
    public static readonly PRIMARY_PIPE_FAILED_NO_FALLBACK: string = 'Primary pipe failed but fallback not executed';
    public static readonly BOTH_PRIMARY_AND_FALLBACK_FAILED: string = 'Both primary and fallback pipes failed';

    // Retry Policy
    public static readonly NON_RETRYABLE_EXCEPTION: string = 'Pipe failed after %d attempt(s) - non-retryable exception';
    public static readonly PIPE_FAILED_AFTER_RETRIES: string = 'Pipe failed after %d attempt(s)';

    // Retry With Backoff Strategy
    public static readonly RECOVERY_STRATEGY_FAILED: string = 'Recovery strategy failed after %d attempt(s)';

    // General
    public static readonly PIPELINE_EXECUTION_CANCELLED: string = 'Pipeline execution was cancelled';
}