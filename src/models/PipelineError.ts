/**
 * Represents an error that occurred during pipeline execution.
 */
export class PipelineError {
  /**
   * The name of the pipe where the error occurred.
   */
  public pipeName?: string;

  /**
   * The error message.
   */
  public message: string;

  /**
   * The exception that caused the error.
   */
  public exception?: Error;

  /**
   * The timestamp when the error occurred.
   */
  public timestamp: number;

  /**
   * The attempt number when the error occurred (for retry scenarios).
   */
  public attemptNumber?: number;

  constructor(message: string, exception?: Error) {
    this.message = message;
    this.exception = exception;
    this.timestamp = Date.now();
  }
}