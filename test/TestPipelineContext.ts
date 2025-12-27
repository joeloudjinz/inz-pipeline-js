import {IPipelineContext} from '../src/contracts/IPipelineContext';
import {PipelineError} from '../src/models/PipelineError';
import {PerformanceMetrics} from '../src/models/PerformanceMetrics';

/**
 * A concrete implementation of IPipelineContext for testing purposes.
 */
export class TestPipelineContext<TIn, TOut> implements IPipelineContext<TIn, TOut> {
    input: TIn;
    output: TOut;
    errors: string[] = [];
    pipelineErrors: PipelineError[] = [];
    performanceMetrics?: PerformanceMetrics;
    dataRepository: Map<string, any> = new Map();
    continueOnFailure: boolean = false;
    hasPipeFailure: boolean = false;
    errorHandlingOptions?: any;
    validationErrors: string[] = [];
    validationWarnings: string[] = [];
    isConfigurationValidated: boolean = false;

    constructor() {
        // Initialize with default values
        this.input = undefined as any;
        this.output = undefined as any;
    }

    getResource<T>(key: string): T {
        return this.dataRepository.get(key);
    }

    tryGetResource<T>(key: string, defaultValue?: T): { success: boolean; value: T | undefined } {
        if (this.dataRepository.has(key)) {
            return {success: true, value: this.dataRepository.get(key)};
        } else {
            return {success: false, value: defaultValue};
        }
    }

    addResource<T>(key: string, resource: T): void {
        if (this.dataRepository.has(key)) {
            throw new Error(`Resource with key ${key} already exists`);
        }
        this.dataRepository.set(key, resource);
    }

    tryAddResource<T>(key: string, resource: T): boolean {
        if (this.dataRepository.has(key)) {
            return false;
        }
        this.dataRepository.set(key, resource);
        return true;
    }

    updateResource<T>(key: string, resource: T): void {
        if (!this.dataRepository.has(key)) {
            throw new Error(`Resource with key ${key} does not exist`);
        }
        this.dataRepository.set(key, resource);
    }

    removeResource(key: string): boolean {
        return this.dataRepository.delete(key);
    }

    addError(error: string): void {
        this.errors.push(error);
        this.hasPipeFailure = true;
    }

    addPipelineError(pipeName: string, error: Error, attemptNumber?: number): void {
        const pipelineError = new PipelineError(
            error.message,
            error
        );
        pipelineError.pipeName = pipeName;
        pipelineError.attemptNumber = attemptNumber;
        this.pipelineErrors.push(pipelineError);
        this.hasPipeFailure = true;
    }

    getPerformanceMetricsSummary(): string {
        if (!this.performanceMetrics) {
            this.performanceMetrics = new PerformanceMetrics();
        }
        return JSON.stringify(this.performanceMetrics);
    }
}