// Demo pipe that demonstrates a resource dependency that doesn't exist
import {BasePipe, IPipelineContext} from "../../../src";
import {InputData} from "../models/input.model";
import {OutputData} from "../models/output.model";

export class GetMissingResourcePipe extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>, cancellationToken?: AbortSignal): Promise<void> {
        this.consolePrintPipeStartExecution(this.constructor.name);

        // This will fail at runtime, but validation should catch it
        const missingResource = context.getResource<string>("NonExistentResource");
        context.output.property1 = missingResource;

        this.consolePrintPipeFinishExecution(this.constructor.name);
    }

    getRequiredResources?(): string[] {
        return ["NonExistentResource"];
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
}