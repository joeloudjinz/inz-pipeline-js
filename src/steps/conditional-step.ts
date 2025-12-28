import {IPipelineStep} from '../contracts/pipeline-step.interface';
import {IPipelineContext} from '../contracts/pipeline-context.interface';
import {IPipe} from '../contracts/pipe.interface';
import {PipeConfiguration} from '../configuration/pipe-configuration';
import {ErrorHandlingUtils} from '../error-handling/error-handling-utils';

/**
 * Represents a conditional step in the pipeline that executes a pipe only if a condition is met.
 */
export class ConditionalStep<TIn, TOut> implements IPipelineStep<TIn, TOut> {
    constructor(
        public readonly pipe: IPipe<TIn, TOut>,
        public readonly condition: (context: IPipelineContext<TIn, TOut>) => boolean,
        public readonly configuration: PipeConfiguration<TIn, TOut> = new PipeConfiguration<TIn, TOut>()
    ) {
    }

    /**
     * Executes the conditional step with the provided context.
     * The pipe will only be executed if the condition evaluates to true.
     */
    public async execute(context: IPipelineContext<TIn, TOut>): Promise<void> {
        // Check if the condition is met
        if (this.condition(context)) {
            try {
                // If there's an error handling policy, use it to execute the pipe
                if (this.configuration.errorHandlingPolicy) {
                    await this.configuration.errorHandlingPolicy.execute(this.pipe, context);
                }
                // If there's a recovery strategy, use it to execute the pipe
                else if (this.configuration.recoveryStrategy) {
                    await this.configuration.recoveryStrategy.execute(this.pipe, context);
                }
                // Otherwise, execute the pipe directly
                else {
                    await this.pipe.handle(context);
                }
            } catch (error) {
                // If continueOnFailure is enabled, log the error but don't throw
                if (context.continueOnFailure) {
                    ErrorHandlingUtils.handleContinueOnFailure(context, error as Error, this.pipe);
                } else {
                    // Set hasPipeFailure to true before re-throwing the error
                    ErrorHandlingUtils.addErrorToContext(context, error as Error, this.pipe);
                    // Otherwise, re-throw the error
                    throw error;
                }
            }
        }
    }

    /**
     * Gets the pipes that are part of this step for validation purposes.
     */
    public getPipes(): IPipe<TIn, TOut>[] {
        return [this.pipe];
    }
}