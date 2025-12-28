// Demo pipe that takes time to execute to demonstrate cancellation
import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";

export class SlowDemoPipe extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>, cancellationToken?: AbortSignal): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);

        // Simulate a long-running operation that respects cancellation
        for (let i = 0; i < 10; i++) {
            // Check for cancellation periodically
            if (cancellationToken?.aborted) {
                throw new Error("Operation was cancelled");
            }
            await this.delay(200, cancellationToken); // Simulate work
        }

        context.output.property2 += 5; // Add to distinguish from normal pipes

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

    private async delay(ms: number, cancellationToken?: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (cancellationToken?.aborted) {
                    reject(new Error("Operation was cancelled"));
                } else {
                    resolve();
                }
            }, ms);

            if (cancellationToken) {
                cancellationToken.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error("Operation was cancelled"));
                });
            }
        });
    }
}