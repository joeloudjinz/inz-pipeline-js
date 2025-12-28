import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";

export class FallbackPipe extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>): Promise<void> {
        this.consolePrintPipeStartExecution("FallbackPipe");
        if (!context.output) context.output = new OutputData();
        context.output.property1 = "Fallback executed successfully";
        await this.delay(100);
        this.consolePrintPipeFinishExecution("FallbackPipe");
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
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}