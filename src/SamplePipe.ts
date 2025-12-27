import {BasePipe} from './BasePipe';
import {IPipelineContext} from './contracts/IPipelineContext';

/**
 * A sample pipe implementation for testing purposes.
 * This pipe simply adds a value to the output.
 */
export class SamplePipe extends BasePipe<{ value: number }, { result: number }> {
    private readonly increment: number;

    constructor(increment: number = 1) {
        super();
        this.increment = increment;
    }

    public async handle(
        context: IPipelineContext<{ value: number }, { result: number }>,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        // Check for cancellation
        if (cancellationToken?.aborted) {
            throw new Error('Operation was cancelled');
        }

        // Initialize output if it doesn't exist
        if (!context.output) {
            context.output = {result: 0};
        }

        // Perform the operation
        context.output.result += this.increment;

        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check for cancellation again after async work
        if (cancellationToken?.aborted) {
            throw new Error('Operation was cancelled');
        }
    }

    public getRequiredResources?(): string[] {
        return [];
    }

    public getProvidedResources?(): string[] {
        return ['sample-result'];
    }
}