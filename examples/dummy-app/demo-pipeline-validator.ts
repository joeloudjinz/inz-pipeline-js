// Custom validator for demo purposes
import {IPipe, IPipelineContext, IPipelineValidator} from "../../src";
import {InputData} from "./models/input.model";
import {OutputData} from "./models/output.model";

export class DemoPipelineValidator implements IPipelineValidator<InputData, OutputData> {
    async validate(context: IPipelineContext<InputData, OutputData>, pipes: IPipe<InputData, OutputData>[]): Promise<string[]> {
        // Convert iterator to array for processing
        const pipeArray = Array.from(pipes);

        // Example validation: Check if there are too many pipes (arbitrary limit for demo)
        if (pipeArray.length > 5) {
            return [`Pipeline has ${pipeArray.length} pipes, which exceeds the demo limit of 5 pipes.`];
        }

        // Example validation: Check if any pipe has an extremely long name (another arbitrary check for demo)
        for (const pipe of pipeArray.filter(p => p.constructor.name.length > 50)) {
            return [`Pipe name '${pipe.constructor.name}' is too long (more than 50 characters).`];
        }

        // Simulate async work that could involve I/O or complex validation
        await this.delay(10);

        return [];
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}