import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";
import {DemoPipeline} from "../demo-pipeline";

export class DemoPipeTwo extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>, cancellationToken?: AbortSignal): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);
        context.output.property2++;
        const tryAddResourceOneResult = context.tryAddResource(DemoPipeline.ResourceKeys.Resource1, "Resource one data");
        if (!tryAddResourceOneResult) {
            this.consolePrintForPipe(this.constructor.name, "Resource one data not added");
            context.updateResource(DemoPipeline.ResourceKeys.Resource1, "Resource one data [Updated]");
        } else {
            this.consolePrintForPipe(this.constructor.name, "Resource one data was added again");
        }

        context.addResource(DemoPipeline.ResourceKeys.Resource2, "Resource TWO data");

        await this.delay(200, cancellationToken);
        this.consolePrintPipeFinishExecution(this.constructor.name);
    }

    getRequiredResources?(): string[] {
        return [DemoPipeline.ResourceKeys.Resource1];
    }

    getProvidedResources?(): string[] {
        return [DemoPipeline.ResourceKeys.Resource2];
    }

    private consolePrintForPipe(pipeName: string, message: string): void {
        console.log(`  [${pipeName}] - ${message}`);
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