import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";
import {DemoPipeline} from "../demo-pipeline";

export class DemoPipeFive extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>, cancellationToken?: AbortSignal): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);
        context.output.property2++;
        context.output.property4 = [...context.output.property4, "Data 2"];
        const tryGetResource4Result = context.tryGetResource<string>(DemoPipeline.ResourceKeys.Resource4);
        if (tryGetResource4Result.success) {
            context.removeResource(DemoPipeline.ResourceKeys.Resource4);
        }

        context.addResource(DemoPipeline.ResourceKeys.Resource5, `Resource FIVE data after removing resource 4 data [${tryGetResource4Result.value}]`);
        await this.delay(200, cancellationToken);
        this.consolePrintPipeFinishExecution(this.constructor.name);
    }

    getRequiredResources?(): string[] {
        return [DemoPipeline.ResourceKeys.Resource4];
    }

    getProvidedResources?(): string[] {
        return [DemoPipeline.ResourceKeys.Resource5];
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