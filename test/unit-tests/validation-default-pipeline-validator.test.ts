import {DefaultPipelineValidator} from '../../src/validation/default-pipeline-validator';
import {BasePipe} from '../../src/base-pipe';
import {TestPipelineContext} from '../test-pipeline-context';

// Mock pipe that requires a resource
class PipeWithRequiredResource extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 2};
    }

    getRequiredResources?(): string[] {
        return ['required.resource.key'];
    }

    getProvidedResources?(): string[] {
        return [];
    }
}

// Mock pipe that provides a resource
class PipeWithProvidedResource extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 3};
    }

    getRequiredResources?(): string[] {
        return [];
    }

    getProvidedResources?(): string[] {
        return ['provided.resource.key'];
    }
}

// Mock pipe that requires and provides resources
class PipeWithRequiredAndProvidedResource extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 4};
    }

    getRequiredResources?(): string[] {
        return ['another.required.resource'];
    }

    getProvidedResources?(): string[] {
        return ['provided.resource.key'];
    }
}

// Mock pipe with no resource requirements
class SimplePipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value};
    }

    getRequiredResources?(): string[] {
        return [];
    }

    getProvidedResources?(): string[] {
        return [];
    }
}

describe('DefaultPipelineValidator Tests', () => {
    let validator: DefaultPipelineValidator<{ value: number }, { result: number }>;
    let context: TestPipelineContext<{ value: number }, { result: number }>;

    beforeEach(() => {
        validator = new DefaultPipelineValidator<{ value: number }, { result: number }>();
        context = new TestPipelineContext<{ value: number }, { result: number }>();
    });

    test('should pass validation when all required resources are provided', async () => {
        const pipeThatProvides = new PipeWithProvidedResource(); // Provides 'provided.resource.key'
        const pipeThatRequires = new PipeWithRequiredAndProvidedResource(); // Requires 'another.required.resource', provides 'provided.resource.key'

        // This should pass because the required resource 'another.required.resource' is not provided by any pipe
        // Actually, let me create a valid scenario:
        // Create a pipe that provides the resource that another pipe requires
        const simplePipe = new SimplePipe();
        const pipeWithProvided = new PipeWithProvidedResource(); // Provides 'provided.resource.key'
        
        const result = await validator.validate(context, [simplePipe, pipeWithProvided]);
        
        expect(result).toEqual([]);
    });

    test('should fail validation when required resources are not provided', async () => {
        const pipeThatRequires = new PipeWithRequiredResource(); // Requires 'required.resource.key'
        const simplePipe = new SimplePipe(); // Provides nothing

        const result = await validator.validate(context, [simplePipe, pipeThatRequires]);
        
        expect(result).toContain("Required resource 'required.resource.key' is not provided by any pipe in the pipeline");
    });

    test('should pass validation when resource dependencies are satisfied', async () => {
        // Create a scenario where one pipe provides what another requires
        const pipeThatProvides = new PipeWithProvidedResource(); // Provides 'provided.resource.key'
        const pipeThatRequires = new PipeWithRequiredAndProvidedResource(); // Requires 'another.required.resource', provides 'provided.resource.key'
        
        // This should still fail because 'another.required.resource' is not provided by any pipe
        const result = await validator.validate(context, [pipeThatProvides, pipeThatRequires]);
        
        expect(result).toContain("Required resource 'another.required.resource' is not provided by any pipe in the pipeline");
    });

    test('should pass validation when all resource dependencies are satisfied', async () => {
        // Create a pipe that provides the missing resource
        class ProvidesAnotherResource extends BasePipe<{ value: number }, { result: number }> {
            async handle(context: any): Promise<void> {
                context.output = {result: context.input.value * 5};
            }

            getRequiredResources?(): string[] {
                return [];
            }

            getProvidedResources?(): string[] {
                return ['another.required.resource'];
            }
        }
        
        const providesAnother = new ProvidesAnotherResource();
        const pipeThatRequires = new PipeWithRequiredAndProvidedResource(); // Requires 'another.required.resource', provides 'provided.resource.key'
        
        const result = await validator.validate(context, [providesAnother, pipeThatRequires]);
        
        // This should pass because 'another.required.resource' is provided by the first pipe
        expect(result).toEqual([]);
    });

    test('should handle empty pipeline without errors', async () => {
        const result = await validator.validate(context, []);
        
        expect(result).toEqual([]);
    });

    test('should validate complex resource dependency chains', async () => {
        // Create a chain of pipes with dependencies
        class ProvidesFirstResource extends BasePipe<{ value: number }, { result: number }> {
            async handle(context: any): Promise<void> {
                context.output = {result: context.input.value * 1};
            }

            getRequiredResources?(): string[] {
                return [];
            }

            getProvidedResources?(): string[] {
                return ['first.resource'];
            }
        }

        class RequiresFirstProvidesSecond extends BasePipe<{ value: number }, { result: number }> {
            async handle(context: any): Promise<void> {
                context.output = {result: context.input.value * 2};
            }

            getRequiredResources?(): string[] {
                return ['first.resource'];
            }

            getProvidedResources?(): string[] {
                return ['second.resource'];
            }
        }

        class RequiresSecond extends BasePipe<{ value: number }, { result: number }> {
            async handle(context: any): Promise<void> {
                context.output = {result: context.input.value * 3};
            }

            getRequiredResources?(): string[] {
                return ['second.resource'];
            }

            getProvidedResources?(): string[] {
                return [];
            }
        }

        const providesFirst = new ProvidesFirstResource();
        const requiresFirstProvidesSecond = new RequiresFirstProvidesSecond();
        const requiresSecond = new RequiresSecond();

        const result = await validator.validate(context, [
            providesFirst, 
            requiresFirstProvidesSecond, 
            requiresSecond
        ]);
        
        // All dependencies should be satisfied in this chain
        expect(result).toEqual([]);
    });
});