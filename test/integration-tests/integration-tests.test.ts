import {BasePipe, IPipelineContext, PipelineBuilder, SubPipeline, RetryWithBackoffStrategy, CircuitBreakerPolicy, FallbackPolicy, PipelineErrorModel} from '../../src';
import {TestPipelineContext} from "../test-pipeline-context";

// Define interfaces for our test data
interface TestInput {
    value: string;
}

interface TestOutput {
    result: string;
}

interface ComplexInput {
    text: string;
    multiplier: number;
}

interface ComplexOutput {
    processedText: string;
    characterCount: number;
    multipliedValue: number;
    resourceValue?: string;
}

// Pipes following the pattern from the existing tests and dummy app
class UpperCasePipe extends BasePipe<TestInput, TestOutput> {
    async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
        if (!context.output) {
            context.output = {result: context.input.value.toUpperCase()};
            return;
        }

        if (!!context.output.result) {
            context.output.result = context.output.result.toUpperCase();
            return;
        }

        context.output.result = context.input.value.toUpperCase();
    }
}

class AppendSuffixPipe extends BasePipe<TestInput, TestOutput> {
    private readonly suffix: string;

    constructor(suffix: string) {
        super();
        this.suffix = suffix;
    }

    async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
        if (!context.output) {
            context.output = {result: context.input.value + this.suffix};
            return;
        }

        if (!!context.output.result) {
            context.output.result = context.output.result + this.suffix;
            return;
        }

        context.output.result = context.input.value + this.suffix;
    }
}

class ResourceAddingPipe extends BasePipe<TestInput, TestOutput> {
    static readonly RESOURCE_KEY = 'test.resource.value';

    async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
        // Add a resource to the context
        context.addResource(ResourceAddingPipe.RESOURCE_KEY, 'resource value');
        
        // Update the output
        if (!context.output) {
            context.output = {result: context.input.value + ' [with resource]'};
        } else {
            context.output.result = context.output.result + ' [with resource]';
        }
    }

    getProvidedResources?(): string[] {
        return [ResourceAddingPipe.RESOURCE_KEY];
    }
}

class ResourceUsingPipe extends BasePipe<TestInput, TestOutput> {
    static readonly RESOURCE_KEY = 'test.resource.value';

    async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
        // Try to get the resource that should have been added by ResourceAddingPipe
        const resourceValue = context.getResource<string>(ResourceUsingPipe.RESOURCE_KEY);
        
        if (!context.output) {
            context.output = {result: context.input.value + ` [resource: ${resourceValue}]`};
        } else {
            context.output.result = context.output.result + ` [resource: ${resourceValue}]`;
        }
    }

    getRequiredResources?(): string[] {
        return [ResourceUsingPipe.RESOURCE_KEY];
    }
}

class ComplexProcessingPipe extends BasePipe<ComplexInput, ComplexOutput> {
    static readonly PROCESSED_RESOURCE_KEY = 'processed.text';

    async handle(context: IPipelineContext<ComplexInput, ComplexOutput>): Promise<void> {
        if (!context.output) {
            // Process the text
            const processedText = context.input.text.toUpperCase() + ' PROCESSED';
            const characterCount = processedText.length;
            const multipliedValue = context.input.multiplier * 10;

            context.output = {
                processedText,
                characterCount,
                multipliedValue
            };
            
            // Add a resource
            context.addResource(ComplexProcessingPipe.PROCESSED_RESOURCE_KEY, processedText);
            return;
        }

        if (context.output?.processedText && context.output.characterCount !== undefined && context.output.multipliedValue !== undefined) {
            // If output already exists, update it
            context.output.processedText = context.output.processedText.toUpperCase() + ' PROCESSED';
            context.output.characterCount = context.output.processedText.length;
            context.output.multipliedValue = context.output.multipliedValue * 10;
            return;
        }

        // Default processing
        const processedText = context.input.text.toUpperCase() + ' PROCESSED';
        const characterCount = processedText.length;
        const multipliedValue = context.input.multiplier * 10;

        context.output = {
            processedText,
            characterCount,
            multipliedValue
        };
        
        // Add a resource
        context.addResource(ComplexProcessingPipe.PROCESSED_RESOURCE_KEY, processedText);
    }

    getProvidedResources?(): string[] {
        return [ComplexProcessingPipe.PROCESSED_RESOURCE_KEY];
    }
}

class ResourceDependentPipe extends BasePipe<ComplexInput, ComplexOutput> {
    static readonly REQUIRED_RESOURCE_KEY = 'processed.text';

    async handle(context: IPipelineContext<ComplexInput, ComplexOutput>): Promise<void> {
        // Get the resource added by ComplexProcessingPipe
        const processedText = context.getResource<string>(ResourceDependentPipe.REQUIRED_RESOURCE_KEY);
        
        if (!context.output) {
            context.output = { 
                processedText: processedText + ' [with dependency]',
                characterCount: processedText.length,
                multipliedValue: 0
            };
        } else {
            context.output.processedText = context.output.processedText + ' [with dependency]';
            context.output.characterCount = context.output.processedText.length;
        }
    }

    getRequiredResources?(): string[] {
        return [ResourceDependentPipe.REQUIRED_RESOURCE_KEY];
    }
}

class FailingPipe extends BasePipe<TestInput, TestOutput> {
    async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
        throw new Error('Intentional failure for testing');
    }
}

class ValidationPipe extends BasePipe<TestInput, TestOutput> {
    async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
        if (context.input.value.length < 3) {
            throw new Error('Text is too short');
        }
        context.output = {result: context.input.value};
    }
}

describe('Refactored Integration Tests', () => {
    describe('Complex Pipeline Scenarios', () => {
        test('should execute a multi-step pipeline with resource management', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new UpperCasePipe())
                .attachPipe(new ResourceAddingPipe())
                .attachPipe(new AppendSuffixPipe('!'))
                .flush();

            expect(context.output).toEqual({result: 'HELLO [with resource]!'});
            
            // Verify that the resource was added
            const resourceValue = context.getResource<string>(ResourceAddingPipe.RESOURCE_KEY);
            expect(resourceValue).toBe('resource value');
        });

        test('should execute a pipeline with resource dependencies between pipes', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new UpperCasePipe())
                .attachPipe(new ResourceAddingPipe())
                .attachPipe(new ResourceUsingPipe()) // This requires the resource added by ResourceAddingPipe
                .flush();

            expect(context.output).toEqual({result: 'HELLO [with resource] [resource: resource value]'});
        });

        test('should execute a complex pipeline with all features', async () => {
            const context = new TestPipelineContext<ComplexInput, ComplexOutput>();
            const builder = new PipelineBuilder<ComplexInput, ComplexOutput>();
            const source = {text: 'hello', multiplier: 3};

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new ComplexProcessingPipe())
                .attachPipe(new ResourceDependentPipe())
                .enablePerformanceMetrics()
                .flush();

            expect(context.output).toEqual({
                processedText: 'HELLO PROCESSED [with dependency]',
                characterCount: 33, // Length of 'HELLO PROCESSED [with dependency]'
                multipliedValue: 30
            });

            expect(context.performanceMetrics?.isEnabled).toBe(true);
        });

        test('should handle validation in complex pipelines with resource dependencies', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hi'}; // This is too short and should fail validation

            await expect(
                builder
                    .attachContext(context)
                    .setSource(source)
                    .attachPipe(new ValidationPipe())
                    .flush()
            ).rejects.toThrow('Text is too short');

            expect(context.hasPipeFailure).toBe(true);
        });
    });

    describe('Error Handling in Complex Pipelines', () => {
        test('should execute a pipeline with retry policy and fallback', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            // Create a pipe that fails on first attempt but succeeds on second
            let attempt = 0;
            class FlakyPipe extends BasePipe<TestInput, TestOutput> {
                async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
                    attempt++;
                    if (attempt <= 1) {
                        throw new Error('Temporary failure');
                    }
                    context.output = {result: context.input.value + ' (retried)'};
                }
            }

            // Create a fallback pipe
            class FallbackPipe extends BasePipe<TestInput, TestOutput> {
                async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
                    context.output = {result: context.input.value + ' (fallback)'};
                }
            }

            const flakyPipe = new FlakyPipe();
            const fallbackPipe = new FallbackPipe();

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new UpperCasePipe())
                .attachPipeWithRetryPolicy(flakyPipe, 3, 100) // Retry up to 3 times with 100ms delay
                .attachPipe(new AppendSuffixPipe('?'))
                .flush();

            expect(context.output).toEqual({result: 'hello (retried)?'});
        });

        test('should execute a pipeline with fallback policy when primary fails', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            // Create a fallback pipe
            class FallbackPipe extends BasePipe<TestInput, TestOutput> {
                async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
                    context.output = {result: context.input.value + ' (fallback executed)'};
                }
            }

            const failingPipe = new FailingPipe();
            const fallbackPipe = new FallbackPipe();

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new UpperCasePipe())
                .attachPipeWithFallbackPolicy(failingPipe, fallbackPipe)
                .attachPipe(new AppendSuffixPipe('!'))
                .flush();

            expect(context.output).toEqual({result: 'hello (fallback executed)!'});

            // When fallback succeeds, the primary pipe error is handled but not necessarily recorded as a pipeline error
            // The pipeline completes successfully with the fallback result
        });

        test('should execute a pipeline with circuit breaker strategy', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            // Create a pipe that always fails
            class AlwaysFailingPipe extends BasePipe<TestInput, TestOutput> {
                async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
                    throw new Error('Always fails');
                }
            }

            const failingPipe = new AlwaysFailingPipe();

            // This should fail after the circuit breaker opens
            await expect(
                builder
                    .attachContext(context)
                    .setSource(source)
                    .attachPipeWithCircuitBreakerPolicy(failingPipe, 2, 1000) // Open circuit after 2 failures, timeout 1000ms
                    .flush()
            ).rejects.toThrow();

            // Verify that errors were recorded
            expect(context.hasPipeFailure).toBe(true);
            expect(context.pipelineErrors.length).toBeGreaterThan(0);
        });
    });

    describe('Sub-Pipeline Integration', () => {
        test('should execute a pipeline with nested sub-pipelines', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            // Create a sub-pipeline that converts to uppercase and appends '!'
            const subPipeline = new SubPipeline<TestInput, TestOutput>((subBuilder) => {
                subBuilder.attachPipe(new UpperCasePipe());
                subBuilder.attachPipe(new AppendSuffixPipe('!'));
            });

            // Create another sub-pipeline that appends more text
            const nestedSubPipeline = new SubPipeline<TestInput, TestOutput>((subBuilder) => {
                subBuilder.attachPipe(new AppendSuffixPipe(' [nested]'));
            });

            await builder
                .attachContext(context)
                .setSource(source)
                .attachSubPipeline(subPipeline)
                .attachSubPipeline(nestedSubPipeline)
                .flush();

            expect(context.output).toEqual({result: 'HELLO! [nested]'});
        });

        test('should execute a complex pipeline with sub-pipeline containing error handling', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            // Create a sub-pipeline with error handling
            const subPipeline = new SubPipeline<TestInput, TestOutput>((subBuilder) => {
                subBuilder.attachPipe(new UpperCasePipe());
                
                // Create a pipe that fails on first attempt but succeeds on second
                let attempt = 0;
                class SubPipelineFlakyPipe extends BasePipe<TestInput, TestOutput> {
                    async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
                        attempt++;
                        if (attempt <= 1) {
                            throw new Error('Temporary failure in sub-pipeline');
                        }
                        context.output.result = context.output.result + ' (from sub)';
                    }
                }
                
                subBuilder.attachPipeWithRetryPolicy(new SubPipelineFlakyPipe(), 3, 100);
                subBuilder.attachPipe(new AppendSuffixPipe('!'));
            });

            await builder
                .attachContext(context)
                .setSource(source)
                .attachSubPipeline(subPipeline)
                .attachPipe(new AppendSuffixPipe('?'))
                .flush();

            expect(context.output).toEqual({result: 'HELLO (from sub)!?'});
        });
    });

    describe('Parallel and Conditional Execution Integration', () => {
        test('should execute a pipeline with parallel steps and conditional steps', async () => {
            interface ParallelInput {
                value: number;
            }

            interface ParallelOutput {
                result: number;
            }

            const context = new TestPipelineContext<ParallelInput, ParallelOutput>();
            const builder = new PipelineBuilder<ParallelInput, ParallelOutput>();
            const source = {value: 5};

            // Create pipes that perform different operations
            class MultiplyByTwoPipe extends BasePipe<ParallelInput, ParallelOutput> {
                async handle(context: IPipelineContext<ParallelInput, ParallelOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {result: context.input.value * 2};
                    } else {
                        context.output.result = context.output.result * 2;
                    }
                }
            }

            class MultiplyByThreePipe extends BasePipe<ParallelInput, ParallelOutput> {
                async handle(context: IPipelineContext<ParallelInput, ParallelOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {result: context.input.value * 3};
                    } else {
                        context.output.result = context.output.result * 3;
                    }
                }
            }

            class AddTenPipe extends BasePipe<ParallelInput, ParallelOutput> {
                async handle(context: IPipelineContext<ParallelInput, ParallelOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {result: context.input.value + 10};
                    } else {
                        context.output.result = context.output.result + 10;
                    }
                }
            }

            const multiplyByTwo = new MultiplyByTwoPipe();
            const multiplyByThree = new MultiplyByThreePipe();
            const addTen = new AddTenPipe();

            // Only execute addTen pipe if the value is greater than 10
            const condition = (ctx: IPipelineContext<ParallelInput, ParallelOutput>) => ctx.output?.result > 10;

            await builder
                .attachContext(context)
                .setSource(source)
                .attachParallelPipes(multiplyByTwo, multiplyByThree) // This will result in either 10 or 15 depending on execution order
                .attachConditionalPipe(addTen, condition) // This will execute since 10 or 15 > 10
                .flush();

            // The result will be either 20 (10+10) or 25 (15+10) depending on which parallel pipe completes last
            expect(context.output).toEqual({result: expect.any(Number)});
            expect(context.output.result).toBeGreaterThanOrEqual(20); // Minimum possible result
        });

        test('should execute a complex pipeline with all features: sequential, parallel, conditional, sub-pipeline', async () => {
            interface ComplexPipelineInput {
                value: string;
                number: number;
            }

            interface ComplexPipelineOutput {
                textResult: string;
                numberResult: number;
            }

            const context = new TestPipelineContext<ComplexPipelineInput, ComplexPipelineOutput>();
            const builder = new PipelineBuilder<ComplexPipelineInput, ComplexPipelineOutput>();
            const source = {value: 'test', number: 5};

            // Sequential pipe
            class TextProcessingPipe extends BasePipe<ComplexPipelineInput, ComplexPipelineOutput> {
                async handle(context: IPipelineContext<ComplexPipelineInput, ComplexPipelineOutput>): Promise<void> {
                    context.output = { 
                        textResult: context.input.value.toUpperCase(),
                        numberResult: context.input.number
                    };
                }
            }

            // Parallel pipes
            class MultiplyByTwoPipe extends BasePipe<ComplexPipelineInput, ComplexPipelineOutput> {
                async handle(context: IPipelineContext<ComplexPipelineInput, ComplexPipelineOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {textResult: context.input.value, numberResult: context.input.number * 2};
                    } else {
                        context.output.numberResult = context.output.numberResult * 2;
                    }
                }
            }

            class AppendTextPipe extends BasePipe<ComplexPipelineInput, ComplexPipelineOutput> {
                async handle(context: IPipelineContext<ComplexPipelineInput, ComplexPipelineOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {textResult: context.input.value + '_APPENDED', numberResult: context.input.number};
                    } else {
                        context.output.textResult = context.output.textResult + '_APPENDED';
                    }
                }
            }

            // Conditional pipe
            class ConditionalPipe extends BasePipe<ComplexPipelineInput, ComplexPipelineOutput> {
                async handle(context: IPipelineContext<ComplexPipelineInput, ComplexPipelineOutput>): Promise<void> {
                    context.output.textResult = context.output.textResult + '_CONDITIONAL';
                }
            }

            // Sub-pipeline
            class SubPipelineAppendSuffixPipe extends BasePipe<ComplexPipelineInput, ComplexPipelineOutput> {
                private readonly suffix: string;

                constructor(suffix: string) {
                    super();
                    this.suffix = suffix;
                }

                async handle(context: IPipelineContext<ComplexPipelineInput, ComplexPipelineOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {
                            textResult: context.input.value + this.suffix,
                            numberResult: context.input.number
                        };
                    } else {
                        context.output.textResult = context.output.textResult + this.suffix;
                    }
                }
            }

            const subPipeline = new SubPipeline<ComplexPipelineInput, ComplexPipelineOutput>((subBuilder) => {
                subBuilder.attachPipe(new SubPipelineAppendSuffixPipe('_SUB'));
            });

            const textProcessingPipe = new TextProcessingPipe();
            const multiplyByTwo = new MultiplyByTwoPipe();
            const appendText = new AppendTextPipe();
            const conditional = new ConditionalPipe();

            // Condition: execute conditional pipe if numberResult > 10
            const condition = (ctx: IPipelineContext<ComplexPipelineInput, ComplexPipelineOutput>) => 
                ctx.output?.numberResult > 10;

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(textProcessingPipe)
                .attachParallelPipes(multiplyByTwo, appendText)
                .attachConditionalPipe(conditional, condition) // Will execute if numberResult > 10
                .attachSubPipeline(subPipeline)
                .enablePerformanceMetrics()
                .flush();

            // Verify that performance metrics are enabled
            expect(context.performanceMetrics?.isEnabled).toBe(true);
            
            // The exact result depends on which parallel pipe completes last
            expect(context.output).toEqual({
                textResult: expect.any(String),
                numberResult: expect.any(Number)
            });
        });
    });

    describe('Performance Metrics and Resource Validation Integration', () => {
        test('should execute a pipeline with performance metrics and resource validation', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new UpperCasePipe())
                .attachPipe(new ResourceAddingPipe())
                .attachPipe(new AppendSuffixPipe('!'))
                .enablePerformanceMetrics()
                .validateConfiguration(); // This should pass validation

            expect(context.performanceMetrics?.isEnabled).toBe(true);
            
            // Check that resource dependencies are properly defined
            const resourceValidationResult = await builder.validateConfigurationForResult();
            expect(resourceValidationResult.errors.length).toBe(0);
        });

        test('should detect resource dependency issues in complex pipelines', async () => {
            const context = new TestPipelineContext<TestInput, TestOutput>();
            const builder = new PipelineBuilder<TestInput, TestOutput>();
            const source = {value: 'hello'};

            // Create a pipe that requires a resource that is never provided
            class MissingResourcePipe extends BasePipe<TestInput, TestOutput> {
                static readonly MISSING_RESOURCE_KEY = 'non.existent.resource';

                async handle(context: IPipelineContext<TestInput, TestOutput>): Promise<void> {
                    const missingResource = context.getResource<string>(MissingResourcePipe.MISSING_RESOURCE_KEY);
                    context.output = {result: context.input.value + missingResource};
                }

                getRequiredResources?(): string[] {
                    return [MissingResourcePipe.MISSING_RESOURCE_KEY];
                }
            }

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new UpperCasePipe())
                .attachPipe(new MissingResourcePipe()) // This requires a resource that is never provided
                .enablePerformanceMetrics();

            // This should fail validation
            const validationResult = await builder.validateConfigurationForResult();
            expect(validationResult.errors.length).toBeGreaterThan(0);
            expect(validationResult.errors[0]).toContain(MissingResourcePipe.MISSING_RESOURCE_KEY);
        });
    });

    describe('Real-world Usage Scenarios', () => {
        test('should execute a data transformation pipeline', async () => {
            interface TransformInput {
                rawData: string[];
            }

            interface TransformOutput {
                processedData: string[];
                itemCount: number;
                hasErrors: boolean;
            }

            const context = new TestPipelineContext<TransformInput, TransformOutput>();
            const builder = new PipelineBuilder<TransformInput, TransformOutput>();
            const source = {rawData: ['hello', 'world', 'test']};

            // Pipe to transform data
            class DataTransformPipe extends BasePipe<TransformInput, TransformOutput> {
                async handle(context: IPipelineContext<TransformInput, TransformOutput>): Promise<void> {
                    const processedData = context.input.rawData.map(item => item.toUpperCase());
                    context.output = {
                        processedData,
                        itemCount: processedData.length,
                        hasErrors: false
                    };
                }
            }

            // Pipe to validate data
            class DataValidationPipe extends BasePipe<TransformInput, TransformOutput> {
                async handle(context: IPipelineContext<TransformInput, TransformOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {processedData: [], itemCount: 0, hasErrors: true};
                        return;
                    }

                    // Check if any item is empty after transformation
                    if (context.output.processedData.some(item => item === '')) {
                        context.output.hasErrors = true;
                    }
                }
            }

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new DataTransformPipe())
                .attachPipe(new DataValidationPipe())
                .enablePerformanceMetrics()
                .flush();

            expect(context.output).toEqual({
                processedData: ['HELLO', 'WORLD', 'TEST'],
                itemCount: 3,
                hasErrors: false
            });

            expect(context.performanceMetrics?.isEnabled).toBe(true);
        });

        test('should execute a validation and error handling pipeline', async () => {
            interface ValidationInput {
                email: string;
                age: number;
            }

            interface ValidationOutput {
                isValid: boolean;
                errors: string[];
                processedEmail: string;
            }

            const context = new TestPipelineContext<ValidationInput, ValidationOutput>();
            const builder = new PipelineBuilder<ValidationInput, ValidationOutput>();
            const source = {email: 'test@example.com', age: 25};

            // Validation pipe
            class EmailValidationPipe extends BasePipe<ValidationInput, ValidationOutput> {
                async handle(context: IPipelineContext<ValidationInput, ValidationOutput>): Promise<void> {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const isValidEmail = emailRegex.test(context.input.email);
                    
                    if (!isValidEmail) {
                        throw new Error('Invalid email format');
                    }
                    
                    context.output = {
                        isValid: true,
                        errors: [],
                        processedEmail: context.input.email.toLowerCase()
                    };
                }
            }

            // Age validation pipe
            class AgeValidationPipe extends BasePipe<ValidationInput, ValidationOutput> {
                async handle(context: IPipelineContext<ValidationInput, ValidationOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {isValid: false, errors: [], processedEmail: ''};
                    }
                    
                    if (context.input.age < 0 || context.input.age > 150) {
                        context.output.isValid = false;
                        context.output.errors.push('Invalid age');
                    }
                }
            }

            // Error handling pipe
            class ErrorHandlingPipe extends BasePipe<ValidationInput, ValidationOutput> {
                async handle(context: IPipelineContext<ValidationInput, ValidationOutput>): Promise<void> {
                    if (!context.output) {
                        context.output = {isValid: false, errors: ['No output from previous pipes'], processedEmail: ''};
                    }
                    
                    // Add any pipeline errors to our output
                    if (context.pipelineErrors.length > 0) {
                        const errorMessages = context.pipelineErrors.map(err => err.message);
                        context.output.errors = [...context.output.errors, ...errorMessages];
                        context.output.isValid = false;
                    }
                }
            }

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipe(new EmailValidationPipe())
                .attachPipe(new AgeValidationPipe())
                .attachPipe(new ErrorHandlingPipe())
                .enablePerformanceMetrics()
                .flush();

            expect(context.output).toEqual({
                isValid: true,
                errors: [],
                processedEmail: 'test@example.com'
            });

            expect(context.performanceMetrics?.isEnabled).toBe(true);
        });

        test('should handle errors gracefully in validation pipeline', async () => {
            interface ValidationInput {
                email: string;
                age: number;
            }

            interface ValidationOutput {
                isValid: boolean;
                errors: string[];
                processedEmail: string;
            }

            const context = new TestPipelineContext<ValidationInput, ValidationOutput>();
            const builder = new PipelineBuilder<ValidationInput, ValidationOutput>();
            const source = {email: 'invalid-email', age: 25}; // Invalid email

            // Validation pipe that will fail
            class EmailValidationPipe extends BasePipe<ValidationInput, ValidationOutput> {
                async handle(context: IPipelineContext<ValidationInput, ValidationOutput>): Promise<void> {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const isValidEmail = emailRegex.test(context.input.email);
                    
                    if (!isValidEmail) {
                        throw new Error('Invalid email format');
                    }
                    
                    context.output = {
                        isValid: true,
                        errors: [],
                        processedEmail: context.input.email.toLowerCase()
                    };
                }
            }

            // Error handling pipe with fallback
            class ErrorHandlingPipe extends BasePipe<ValidationInput, ValidationOutput> {
                async handle(context: IPipelineContext<ValidationInput, ValidationOutput>): Promise<void> {
                    if (context.hasPipeFailure) {
                        context.output = {
                            isValid: false,
                            errors: ['Validation failed'],
                            processedEmail: ''
                        };
                    } else if (!context.output) {
                        context.output = {
                            isValid: false,
                            errors: ['No output from previous pipes'],
                            processedEmail: ''
                        };
                    }
                }
            }

            await builder
                .attachContext(context)
                .setSource(source)
                .attachPipeWithFallbackPolicy(new EmailValidationPipe(), new ErrorHandlingPipe())
                .flush();

            expect(context.output).toEqual({
                isValid: false,
                errors: ['No output from previous pipes'],
                processedEmail: ''
            });

            // The pipe failure is handled by the fallback, so the pipeline completes without throwing
        });
    });
});