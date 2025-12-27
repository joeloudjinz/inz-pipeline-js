/**
 * Represents memory usage metrics for pipeline execution.
 */
export class MemoryMetrics {
  /**
   * The amount of memory in bytes at the start of pipeline execution.
   */
  public initialMemoryBytes: number = 0;

  /**
   * The amount of memory in bytes at the end of pipeline execution.
   */
  public finalMemoryBytes: number = 0;

  /**
   * The peak amount of memory in bytes used during pipeline execution.
   */
  public peakMemoryBytes: number = 0;

  /**
   * The total amount of memory in bytes allocated during pipeline execution.
   */
  public allocatedBytes: number = 0;

  /**
   * The increase in memory usage from start to end of pipeline execution.
   */
  public get memoryIncrease(): number {
    return this.finalMemoryBytes - this.initialMemoryBytes;
  }
}