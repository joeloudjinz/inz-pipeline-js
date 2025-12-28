import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";

export class FailingPipe extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);
        // Ensure the output exists before the exception
        if (!context.output) context.output = new OutputData();
        throw new Error("This pipe always fails");
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
}