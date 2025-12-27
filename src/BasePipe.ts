import { IPipe } from './contracts/IPipe';
import { IPipelineContext } from './contracts/IPipelineContext';

/**
 * Abstract base class for pipe implementations.
 * Provides a default implementation for resource requirement methods.
 */
export abstract class BasePipe<TIn, TOut> implements IPipe<TIn, TOut> {
  /**
   * Handles the processing of the pipe within the pipeline context.
   * This method performs the specific operation that the pipe is designed for.
   */
  public abstract handle(context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void>;

  /**
   * Gets the list of resource keys that this pipe requires to be present in the context
   * before execution. This allows for validation of required dependencies prior to execution.
   */
  public getRequiredResources?(): string[] {
    return [];
  }

  /**
   * Gets the list of resource keys that this pipe will provide to the context
   * after successful execution. This allows for validation of resource flows.
   */
  public getProvidedResources?(): string[] {
    return [];
  }
}