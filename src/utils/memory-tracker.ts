/**
 * Utility for cross-platform memory tracking in both Node.js and browser environments.
 */

/**
 * Represents memory usage metrics for the current environment.
 */
interface EnvironmentMemoryMetrics {
    /** The amount of memory currently used */
    used: number;
    /** The total available memory (if available) */
    total?: number;
    /** The memory limit (if available) */
    limit?: number;
}

/**
 * Extend the global Window interface to include the non-standard memory property
 * This is needed for TypeScript to recognize performance.memory in browser environments
 */
declare global {
    interface Performance {
        memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
        };
    }
}

/**
 * Checks if the current environment is Node.js
 * @returns True if running in a Node.js environment, false otherwise
 */
function isNodeEnvironment(): boolean {
    return typeof process !== 'undefined' &&
        process.versions &&
        process.versions.node !== undefined;
}

/**
 * Checks if the current environment is a browser with performance.memory API
 * @returns True if running in a browser with performance.memory API, false otherwise
 */
function hasBrowserMemoryAPI(): boolean {
    if (typeof performance === 'undefined') {
        return false;
    }

    // Use type assertion to access the non-standard memory property
    const perf = performance as Performance & { memory?: any };
    return perf.memory !== undefined &&
        typeof perf.memory.usedJSHeapSize === 'number';
}

/**
 * Gets memory usage in a Node.js environment
 * @returns Memory usage metrics for Node.js environment
 */
function getNodeMemoryUsage(): EnvironmentMemoryMetrics {
    if (isNodeEnvironment() && process.memoryUsage) {
        const memoryUsage = process.memoryUsage();
        return {
            used: memoryUsage.heapUsed,
            total: memoryUsage.heapTotal,
            limit: memoryUsage.heapTotal // Node.js doesn't have a strict limit, but heapTotal is the closest
        };
    }
    return {used: 0};
}

/**
 * Gets memory usage in a browser environment with performance.memory API
 * @returns Memory usage metrics for browser environment
 */
function getBrowserMemoryUsage(): EnvironmentMemoryMetrics {
    if (hasBrowserMemoryAPI()) {
        // Use type assertion to access the non-standard memory property
        const perf = performance as Performance & { memory?: any };
        const memory = perf.memory;
        return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
        };
    }
    return {used: 0};
}

/**
 * Gets memory usage in any environment, with fallbacks for unsupported environments
 * @returns Memory usage metrics appropriate for the current environment
 */
export function getMemoryUsage(): EnvironmentMemoryMetrics {
    // Try Node.js first
    if (isNodeEnvironment()) {
        return getNodeMemoryUsage();
    }

    // Then try browser memory API
    if (hasBrowserMemoryAPI()) {
        return getBrowserMemoryUsage();
    }

    // Fallback for environments without memory tracking support
    return {used: 0};
}

/**
 * Gets just the used memory in bytes, with fallback to 0 for unsupported environments
 * @returns The amount of used memory in bytes, or 0 if memory tracking is not supported
 */
export function getUsedMemoryBytes(): number {
    return getMemoryUsage().used || 0;
}