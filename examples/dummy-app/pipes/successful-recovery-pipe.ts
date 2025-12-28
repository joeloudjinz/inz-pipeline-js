// Example pipe for recovery strategy demonstration
import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";

export class SuccessfulRecoveryPipe extends BasePipe<InputData, OutputData> {
    private executionCount = 0;

    async handle(context: IPipelineContext<InputData, OutputData>, cancellationToken?: AbortSignal): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);

        this.executionCount++;

        // Fail the first attempt, succeed on subsequent attempts
        if (this.executionCount === 1) {
            console.log(`  ${this.constructor.name} failing on attempt ${this.executionCount} (this will be recovered by strategy)...`);
            throw new Error(`Simulated failure on attempt ${this.executionCount}`);
        }

        console.log(`  ${this.constructor.name} succeeded on attempt ${this.executionCount}!`);
        // Ensure the output exists before modifying it
        if (!context.output) context.output = new OutputData();
        context.output.property1 = "Recovery was successful";
        await this.delay(100, cancellationToken);
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