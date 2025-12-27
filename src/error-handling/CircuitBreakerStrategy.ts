import { IErrorRecoveryStrategy } from '../contracts/IErrorRecoveryStrategy';
import { IPipe } from '../contracts/IPipe';
import { IPipelineContext } from '../contracts/IPipelineContext';
import { PipelineError } from '../models/PipelineError';

/**
 * Represents the state of the circuit breaker strategy.
 */
enum CircuitState {
  Closed = 'Closed',    // Normal operation
  Open = 'Open',        // Tripped, requests blocked
  HalfOpen = 'HalfOpen' // Testing if failure condition is resolved
}

/**
 * Implements a circuit breaker strategy for error recovery.
 */
export class CircuitBreakerStrategy<TIn, TOut> implements IErrorRecoveryStrategy<TIn, TOut> {
  private state: CircuitState = CircuitState.Closed;
  private failureCount: number = 0;
  private lastFailureTime?: number;
  
  private readonly failureThreshold: number;
  private readonly timeout: number;
  private readonly shouldHandle?: (error: Error) => boolean;

  /**
   * Initializes a new instance of the CircuitBreakerStrategy class.
   */
  constructor(
    failureThreshold: number = 5,
    timeout: number = 60000, // 1 minute default
    shouldHandle?: (error: Error) => boolean
  ) {
    this.failureThreshold = failureThreshold > 0 ? failureThreshold : 5;
    this.timeout = timeout > 0 ? timeout : 60000;
    this.shouldHandle = shouldHandle;
  }

  public async execute(
    pipe: IPipe<TIn, TOut>,
    context: IPipelineContext<TIn, TOut>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation before proceeding
    if (cancellationToken?.aborted) {
      throw new Error('Pipeline execution was cancelled');
    }

    // Check if circuit is open and timeout has not elapsed
    if (this.state === CircuitState.Open) {
      if (this.lastFailureTime && (Date.now() - this.lastFailureTime) < this.timeout) {
        // Circuit is still open, fail fast
        const error = new Error(`Circuit breaker strategy is OPEN. Request rejected for pipe ${pipe.constructor.name}`);
        context.hasPipeFailure = true;
        context.errors.push(error.message);
        context.pipelineErrors.push(new PipelineError(
          `Circuit breaker strategy OPEN: ${error.message}`,
          error
        ));
        throw error;
      } else {
        // Timeout has elapsed, move to half-open state to test
        this.state = CircuitState.HalfOpen;
      }
    }

    try {
      // Execute the pipe
      await pipe.handle(context, cancellationToken);
      
      // If successful and in half-open state, reset the circuit
      if (this.state === CircuitState.HalfOpen) {
        this.resetCircuit();
      }
    } catch (error) {
      const typedError = error as Error;
      
      // Check if this error should trigger the circuit breaker
      if (this.shouldHandle && !this.shouldHandle(typedError)) {
        // This error should not trigger the circuit breaker, re-throw directly
        context.hasPipeFailure = true;
        context.errors.push(typedError.message);
        context.pipelineErrors.push(new PipelineError(
          `Non-circuit-breaker error: ${typedError.message}`,
          typedError
        ));
        throw typedError;
      }

      // Increment failure count and update circuit state
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.Open;
        console.warn(`Circuit breaker strategy OPENED for pipe ${pipe.constructor.name} after ${this.failureCount} failures`);
      }

      // Add error to context
      context.hasPipeFailure = true;
      context.errors.push(typedError.message);
      context.pipelineErrors.push(new PipelineError(
        `Circuit breaker strategy failure: ${typedError.message}`,
        typedError
      ));
      
      throw typedError;
    }
  }

  /**
   * Resets the circuit breaker to closed state.
   */
  private resetCircuit(): void {
    this.state = CircuitState.Closed;
    this.failureCount = 0;
    this.lastFailureTime = undefined;
    console.info('Circuit breaker strategy RESET to CLOSED state');
  }

  /**
   * Gets the current state of the circuit breaker.
   */
  public getState(): CircuitState {
    return this.state;
  }
}