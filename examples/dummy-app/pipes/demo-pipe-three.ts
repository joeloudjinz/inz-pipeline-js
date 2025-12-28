import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";
import {DemoPipeline} from "../demo-pipeline";

export class DemoPipeThree extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);
        context.output.property2++;
        context.output.property3 = true;

        context.addResource(DemoPipeline.ResourceKeys.Resource3, "Resource THREE data");
        const resource2 = context.getResource<string>(DemoPipeline.ResourceKeys.Resource2);
        const updatedResource2 = resource2 + " [Updated in pipe 3]";
        context.updateResource(DemoPipeline.ResourceKeys.Resource2, updatedResource2);

        await this.delay(200);
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

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}