import {IPipelineValidator} from '../contracts/pipeline-validator.interface';
import {IPipelineContext} from '../contracts/pipeline-context.interface';
import {IPipe} from '../contracts/pipe.interface';

/**
 * Implements default pipeline validation logic.
 * Checks for common issues like missing resource dependencies.
 */
export class DefaultPipelineValidator<TIn, TOut> implements IPipelineValidator<TIn, TOut> {
    public async validate(
        context: IPipelineContext<TIn, TOut>,
        pipes: IPipe<TIn, TOut>[]
    ): Promise<string[]> {
        const errors: string[] = [];

        // Check for resource dependencies
        const providedResources = new Set<string>();
        const allRequiredResources = new Set<string>();

        for (const pipe of pipes) {
            // Collect all required resources
            const requiredResources = pipe.getRequiredResources?.() || [];
            for (const resource of requiredResources) {
                allRequiredResources.add(resource);
            }

            // Collect all provided resources
            const providedResourcesForPipe = pipe.getProvidedResources?.() || [];
            for (const resource of providedResourcesForPipe) {
                providedResources.add(resource);
            }
        }

        // Check if all required resources are provided by some pipe
        for (const requiredResource of allRequiredResources) {
            if (!providedResources.has(requiredResource)) {
                errors.push(`Required resource '${requiredResource}' is not provided by any pipe in the pipeline`);
            }
        }

        // Additional validation could go here
        // For example: checking for circular dependencies, invalid configurations, etc.

        return errors;
    }
}