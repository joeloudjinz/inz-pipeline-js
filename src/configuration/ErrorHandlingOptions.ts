import { IErrorRecoveryStrategy } from '../contracts/IErrorRecoveryStrategy';

/**
 * Represents the error handling options for the entire pipeline.
 */
export class ErrorHandlingOptions<TIn, TOut> {
  /**
   * Gets or sets whether the pipeline should continue executing subsequent pipes even if one pipe fails.
   */
  public continueOnFailure: boolean = false;

  /**
   * Gets or sets the global recovery strategy for the entire pipeline.
   */
  public recoveryStrategy?: IErrorRecoveryStrategy<TIn, TOut>;

  /**
   * Gets or sets custom metadata for the error handling options.
   */
  public metadata: { [key: string]: any } = {};
}