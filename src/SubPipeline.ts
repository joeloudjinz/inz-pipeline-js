import {ISubPipeline} from './contracts/ISubPipeline';
import {IPipelineContext} from './contracts/IPipelineContext';
import {IPipe} from './contracts/IPipe';
import {PipelineBuilder} from './PipelineBuilder';
import {IPipelineStep} from "./contracts/IPipelineStep";

/**
 * Represents a sub-pipeline that can be executed as part of a parent pipeline.
 * Sub-pipelines allow for pipeline composition and reusability by encapsulating
 * a set of operations that can be reused across different pipelines.
 */
export class SubPipeline<TIn, TOut> implements ISubPipeline<TIn, TOut> {
    private readonly subPipelineBuilder: PipelineBuilder<TIn, TOut>;

    constructor(configure: (builder: PipelineBuilder<TIn, TOut>) => void) {
        this.subPipelineBuilder = new PipelineBuilder<TIn, TOut>();
        configure(this.subPipelineBuilder);
    }

    /**
     * Executes the sub-pipeline asynchronously with the provided context.
     * The sub-pipeline uses the same context as the parent pipeline, allowing
     * data to be shared between the parent and sub-pipeline operations.
     */
    public async execute(context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void> {
        // Execute the sub-pipeline with the same context and input as the parent
        await this.subPipelineBuilder
            .attachContext(context)
            .setSource(context.input)
            .flush(cancellationToken);
    }

    /**
     * Gets the pipes that are part of this sub-pipeline for validation purposes.
     */
    public getPipes(): IPipe<TIn, TOut>[] {
        // Get the steps from the sub-pipeline builder using the public getter
        const steps = this.subPipelineBuilder.getSteps();
        return steps.flatMap(step => this.extractPipesFromStep(step));
    }

    /**
     * Extracts pipes from a pipeline step, handling different step types.
     */
    private extractPipesFromStep(step: IPipelineStep<TIn, TOut>): IPipe<TIn, TOut>[] {
        if (step && typeof step.getPipes === 'function') {
            return step.getPipes();
        }
        return [];
    }
}