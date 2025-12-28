import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";
import {DemoPipeline} from "../demo-pipeline";

export class DemoPipeFive extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);
        context.output.property2++;
        context.output.property4 = [...context.output.property4, "Data 2"];
        const tryGetResource4Result = context.tryGetResource<string>(DemoPipeline.ResourceKeys.Resource4);
        if (tryGetResource4Result.success) {
            context.removeResource(DemoPipeline.ResourceKeys.Resource4);
        }

        context.addResource(DemoPipeline.ResourceKeys.Resource5, `Resource FIVE data after removing resource 4 data [${tryGetResource4Result.value}]`);
        await this.delay(200);
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

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}