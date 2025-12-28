import {IPipelineStep} from '../contracts/pipeline-step.interface';
import {IPipelineContext} from '../contracts/pipeline-context.interface';
import {IPipe} from '../contracts/pipe.interface';
import {PipeConfiguration} from '../configuration/pipe-configuration';
import {ErrorHandlingUtils} from '../error-handling/error-handling-utils';

/**
 * Represents a parallel step in the pipeline that executes multiple pipes concurrently.
 */
export class ParallelStep<TIn, TOut> implements IPipelineStep<TIn, TOut> {
    private readonly configurations: PipeConfiguration<TIn, TOut>[];

    constructor(
        public readonly pipes: IPipe<TIn, TOut>[],
        configurations?: PipeConfiguration<TIn, TOut>[]
    ) {
        this.configurations = configurations || pipes.map(() => new PipeConfiguration<TIn, TOut>());

        // Ensure we have the same number of configurations as pipes
        if (this.configurations.length !== this.pipes.length) {
            throw new Error('Number of configurations must match number of pipes');
        }
    }

    /**
     * Executes the parallel step with the provided context.
     * All pipes in the step will be executed concurrently.
     */
    public async execute(context: IPipelineContext<TIn, TOut>): Promise<void> {
        // Create an array of promises for each pipe execution
        const promises = this.pipes.map((pipe, index) => {
            return this.executePipe(pipe, this.configurations[index], context);
        });

        // Execute all pipes in parallel
        await Promise.all(promises);
    }

    /**
     * Gets the pipes that are part of this step for validation purposes.
     */
    public getPipes(): IPipe<TIn, TOut>[] {
        return [...this.pipes]; // Return a copy to prevent external modification
    }

    /**
     * Helper method to execute a single pipe with its configuration
     */
    private async executePipe(
        pipe: IPipe<TIn, TOut>,
        config: PipeConfiguration<TIn, TOut>,
        context: IPipelineContext<TIn, TOut>
    ): Promise<void> {
        try {
            // If there's an error handling policy, use it to execute the pipe
            if (config.errorHandlingPolicy) {
                await config.errorHandlingPolicy.execute(pipe, context);
            }
            // If there's a recovery strategy, use it to execute the pipe
            else if (config.recoveryStrategy) {
                await config.recoveryStrategy.execute(pipe, context);
            }
            // Otherwise, execute the pipe directly
            else {
                await pipe.handle(context);
            }
        } catch (error) {
            // If continueOnFailure is enabled, log the error but don't throw
            if (context.continueOnFailure) {
                ErrorHandlingUtils.handleContinueOnFailure(context, error as Error, pipe);
            } else {
                // Set hasPipeFailure to true before re-throwing the error
                ErrorHandlingUtils.addErrorToContext(context, error as Error, pipe);
                // Otherwise, re-throw the error
                throw error;
            }
        }
    }
}