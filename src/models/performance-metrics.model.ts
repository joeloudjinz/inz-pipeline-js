import {MemoryMetricsModel} from './memory-metrics.model';

/**
 * Represents performance metrics for pipeline execution.
 */
export class PerformanceMetricsModel {
    /**
     * Indicates whether performance metrics collection is enabled.
     */
    public isEnabled: boolean = false;

    /**
     * A unique identifier for correlating metrics across distributed systems.
     */
    public correlationId?: string;

    /**
     * The start time of pipeline execution in milliseconds since epoch.
     */
    public startTime?: number;

    /**
     * The end time of pipeline execution in milliseconds since epoch.
     */
    public endTime?: number;

    /**
     * The total duration of pipeline execution in milliseconds.
     */
    public totalDurationMs?: number;

    /**
     * Memory metrics for the pipeline execution.
     */
    public memoryMetrics?: MemoryMetricsModel;

    /**
     * Duration of execution for each individual pipe, keyed by pipe name.
     */
    public pipeDurations: { [key: string]: number } = {};

    /**
     * Custom metrics that can be added by pipes during execution.
     */
    public customMetrics: { [key: string]: any } = {};
}