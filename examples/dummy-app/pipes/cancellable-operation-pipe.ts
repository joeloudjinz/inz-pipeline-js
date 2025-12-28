// Demo pipe that demonstrates cancellation handling
import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";

export class CancellableOperationPipe extends BasePipe<InputData, OutputData> {
    private readonly operationName: string;
    private readonly duration: number;

    constructor(operationName: string, duration: number) {
        super();
        this.operationName = operationName;
        this.duration = duration;
    }

    async handle(context: IPipelineContext<InputData, OutputData>, cancellationToken?: AbortSignal): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);

        // Simulate a long-running operation that can be cancelled
        const startTime = Date.now();
        let elapsed = 0;

        while (elapsed < this.duration) {
            // Check for cancellation periodically
            if (cancellationToken?.aborted) {
                // Perform cleanup when cancelled
                context.output.property1 = "Operation cancelled with cleanup_executed";
                context.addResource(`CancellableOperationPipe_${this.operationName}_cleanup_status`, "cleanup_performed");
                throw new Error("Operation was cancelled");
            }

            await this.delay(100); // Small delay to allow checking for cancellation
            elapsed = Date.now() - startTime;
        }

        // If we reach here, the operation completed successfully
        context.output.property1 = `Operation ${this.operationName} completed successfully`;
        context.output.property2 = 42; // Set a specific value to indicate success

        this.consolePrintPipeFinishExecution(this.constructor.name);
    }

    getRequiredResources?(): string[] {
        return [];
    }

    getProvidedResources?(): string[] {
        return [];
    }

    private consolePrintPipeStartExecution(pipeName: string): void {
        console.log(`  [${pipeName}] - Start execution`);
    }

    private consolePrintPipeFinishExecution(pipeName: string): void {
        console.log(`  [${pipeName}] - Finish execution`);
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}