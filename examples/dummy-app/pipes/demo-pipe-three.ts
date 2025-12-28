import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";
import {DemoPipeline} from "../demo-pipeline";

export class DemoPipeThree extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>, cancellationToken?: AbortSignal): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);
        context.output.property2++;
        context.output.property3 = true;

        context.addResource(DemoPipeline.ResourceKeys.Resource3, "Resource THREE data");
        const resource2 = context.getResource<string>(DemoPipeline.ResourceKeys.Resource2);
        const updatedResource2 = resource2 + " [Updated in pipe 3]";
        context.updateResource(DemoPipeline.ResourceKeys.Resource2, updatedResource2);

        await this.delay(200, cancellationToken);
        this.consolePrintPipeFinishExecution(this.constructor.name);
    }

    getRequiredResources?(): string[] {
        return [DemoPipeline.ResourceKeys.Resource2];
    }

    getProvidedResources?(): string[] {
        return [DemoPipeline.ResourceKeys.Resource3];
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