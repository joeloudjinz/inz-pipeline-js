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
     * The total heap size in bytes at the start of pipeline execution (Node.js specific).
     * This represents the total size of the heap allocated by the V8 engine.
     */
    public initialTotalHeapSizeBytes?: number;

    /**
     * The total heap size in bytes at the end of pipeline execution (Node.js specific).
     * This represents the total size of the heap allocated by the V8 engine.
     */
    public finalTotalHeapSizeBytes?: number;

    /**
     * The heap size limit in bytes (Node.js specific).
     * This represents the maximum heap size that can be allocated by the V8 engine.
     */
    public heapSizeLimitBytes?: number;

    /**
     * The used JS heap size in bytes at the start of pipeline execution (Browser specific).
     * This represents the amount of memory currently used by the JavaScript heap.
     * Note: Only available in browsers that support the performance.memory API.
     */
    public initialUsedJSHeapSizeBytes?: number;

    /**
     * The used JS heap size in bytes at the end of pipeline execution (Browser specific).
     * This represents the amount of memory currently used by the JavaScript heap.
     * Note: Only available in browsers that support the performance.memory API.
     */
    public finalUsedJSHeapSizeBytes?: number;

    /**
     * The total JS heap size in bytes at the start of pipeline execution (Browser specific).
     * This represents the total size of the JavaScript heap.
     * Note: Only available in browsers that support the performance.memory API.
     */
    public initialTotalJSHeapSizeBytes?: number;

    /**
     * The total JS heap size in bytes at the end of pipeline execution (Browser specific).
     * This represents the total size of the JavaScript heap.
     * Note: Only available in browsers that support the performance.memory API.
     */
    public finalTotalJSHeapSizeBytes?: number;

    /**
     * The JS heap size limit in bytes (Browser specific, where available).
     * This represents the maximum size of the JavaScript heap.
     * Note: Only available in browsers that support the performance.memory API.
     */
    public jsHeapSizeLimitBytes?: number;

    /**
     * The increase in memory usage from start to end of pipeline execution.
     */
    public get memoryIncrease(): number {
        return this.finalMemoryBytes - this.initialMemoryBytes;
    }
}