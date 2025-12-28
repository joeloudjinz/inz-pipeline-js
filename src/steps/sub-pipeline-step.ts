import {IPipelineStep} from '../contracts/pipeline-step.interface';
import {IPipelineContext} from '../contracts/pipeline-context.interface';
import {ISubPipeline} from '../contracts/sub-pipeline.interface';
import {ErrorHandlingUtils} from '../error-handling/error-handling-utils';

/**
 * Represents a sub-pipeline step in the pipeline that executes a nested pipeline.
 */
export class SubPipelineStep<TIn, TOut> implements IPipelineStep<TIn, TOut> {
    constructor(
        public readonly subPipeline: ISubPipeline<TIn, TOut>
    ) {
    }

    /**
     * Executes the sub-pipeline step with the provided context.
     */
    public async execute(context: IPipelineContext<TIn, TOut>, cancellationToken?: AbortSignal): Promise<void> {
        // Check for cancellation before executing the sub-pipeline
        ErrorHandlingUtils.checkAndHandleCancellation(cancellationToken, context);

        // Execute the sub-pipeline with the same context
        await this.subPipeline.execute(context, cancellationToken);
    }

    /**
     * Gets the pipes that are part of this step for validation purposes.
     * This includes pipes from the sub-pipeline.
     */
    public getPipes(): any[] { // Using any temporarily until we implement ISubPipeline properly
        return this.subPipeline.getPipes();
    }
}