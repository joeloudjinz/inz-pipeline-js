import {PipelineBuilder, RetryWithBackoffStrategy, SubPipeline} from '../../src';
import {DemoPipeOne} from "./pipes/demo-pipe-one";
import {DemoPipeTwo} from "./pipes/demo-pipe-two";
import {DemoPipeThree} from "./pipes/demo-pipe-three";
import {DemoPipeFour} from "./pipes/demo-pipe-four";
import {DemoPipeFive} from "./pipes/demo-pipe-five";
import {DemoPipeSix} from "./pipes/demo-pipe-six";
import {DemoPipeSeven} from "./pipes/demo-pipe-seven";
import {FlakyPipe} from "./pipes/flaky-pipe";
import {FailingPipe} from "./pipes/failing-pipe";
import {FallbackPipe} from "./pipes/fallback-pipe";
import {SuccessfulRecoveryPipe} from "./pipes/successful-recovery-pipe";
import {GetMissingResourcePipe} from "./pipes/get-missing-resource-pipe";
import {SlowDemoPipe} from "./pipes/slow-demo-pipe";
import {DemoPipelineValidator} from "./demo-pipeline-validator";
import {CancellableOperationPipe} from "./pipes/cancellable-operation-pipe";
import {Context} from "./pipeline-context";
import {InputData, OutputData} from "./models";

export class DemoPipeline {
    public static readonly ResourceKeys = {
        Resource1: "keys.resource.1",
        Resource2: "keys.resource.2",
        Resource3: "keys.resource.3",
        Resource4: "keys.resource.4",
        Resource5: "keys.resource.5",
        Resource6: "keys.resource.6",
        Resource7: "keys.resource.7"
    };

    public async run(): Promise<void> {
        // pipeline with performance metrics enabled
        console.log("=== Pipeline with Performance Metrics Enabled ===");
        await this.runPipelineWithMetrics();

        console.log("\n" + '='.repeat(60) + "\n");

        // pipeline with performance metrics disabled
        console.log("=== Pipeline with Performance Metrics Disabled ===");
        await this.runPipelineWithoutMetrics();

        console.log("\n" + '='.repeat(60) + "\n");

        // pipeline with error handling
        console.log("=== Pipeline with Error Handling Features ===");
        await this.runPipelineWithErrorHandling();

        console.log("\n" + '='.repeat(60) + "\n");

        // pipeline with validation features
        console.log("=== Pipeline with Validation Features ===");
        await this.runPipelineWithValidation();

        console.log("\n" + '='.repeat(60) + "\n");

        // pipeline with cancellation features
        console.log("=== Pipeline with Cancellation Features ===");
        await this.runPipelineWithCancellation();

        console.log("\n" + '='.repeat(60) + "\n");

        // pipeline with cancellable pipe features
        console.log("=== Pipeline with CancellablePipe Features ===");
        await this.runPipelineWithCancellablePipe();
    }

    private async runPipelineWithMetrics(): Promise<void> {
        const builder = new PipelineBuilder<InputData, OutputData>();
        const context = new Context();
        const source = new InputData();
        const condition = true;
        const subPipeline = new SubPipeline<InputData, OutputData>((subBuilder) =>
            subBuilder
                .attachPipe(new DemoPipeFive())
                .attachPipe(new DemoPipeSix())
        );

        // Enable performance metrics with a custom correlation ID
        await builder
            .setSource(source)
            .attachContext(context)
            .enablePerformanceMetrics("sample-correlation-id-123")
            .attachPipe(new DemoPipeOne())
            .attachParallelPipes(new DemoPipeTwo(), new DemoPipeThree())
            .attachConditionalPipe(new DemoPipeFour(), () => condition)
            .attachSubPipeline(subPipeline)
            .attachPipe(new DemoPipeSeven())
            .flush();

        console.log("Final Output");
        console.log("Property1: " + context.output.property1);
        console.log("Property2: " + context.output.property2);
        console.log("Property3: " + context.output.property3);
        console.log("Property4: " + context.output.property4.join(", "));

        console.log();
        console.log("Performance Metrics:");
        console.log(context.getPerformanceMetricsSummary());

        console.log("\nIndividual Metrics:");
        console.log(`Total Duration: ${context.performanceMetrics?.totalDurationMs?.toFixed(2) ?? 0} ms`);
        console.log(`Memory Increase: ${this.formatBytes(context.performanceMetrics?.memoryMetrics?.memoryIncrease ?? 0)}`);
        console.log(`Peak Memory Usage: ${this.formatBytes(context.performanceMetrics?.memoryMetrics?.peakMemoryBytes ?? 0)}`);
        console.log(`Number of Pipe Executions Tracked: ${Object.keys(context.performanceMetrics?.pipeDurations ?? {}).length}`);
    }

    private async runPipelineWithoutMetrics(): Promise<void> {
        const builder = new PipelineBuilder<InputData, OutputData>();
        const context = new Context();
        const source = new InputData();
        const condition = true;
        const subPipeline = new SubPipeline<InputData, OutputData>((subBuilder) =>
            subBuilder
                .attachPipe(new DemoPipeFive())
                .attachPipe(new DemoPipeSix())
        );

        await builder
            .setSource(source)
            .attachContext(context)
            .disablePerformanceMetrics()
            .attachPipe(new DemoPipeOne())
            .attachParallelPipes(new DemoPipeTwo(), new DemoPipeThree())
            .attachConditionalPipe(new DemoPipeFour(), () => condition)
            .attachSubPipeline(subPipeline)
            .attachPipe(new DemoPipeSeven())
            .flush();

        console.log("Final Output");
        console.log("Property1: " + context.output.property1);
        console.log("Property2: " + context.output.property2);
        console.log("Property3: " + context.output.property3);
        console.log("Property4: " + context.output.property4.join(", "));

        console.log();
        console.log(`Performance Metrics Enabled: ${context.performanceMetrics?.isEnabled}`);
        console.log(`Number of Pipe Executions Tracked: ${Object.keys(context.performanceMetrics?.pipeDurations ?? {}).length}`);
        console.log("Performance metrics collection was disabled, so no detailed metrics were tracked.");
    }

    private async runPipelineWithErrorHandling(): Promise<void> {
        let builder = new PipelineBuilder<InputData, OutputData>();
        let context = new Context();
        const source = new InputData();

        // Example of using retry policy
        console.log("Running pipeline with retry policy...");
        await builder
            .setSource(source)
            .attachContext(context)
            .attachPipeWithRetryPolicy(new FlakyPipe(), 3, 500)
            .flush();

        console.log(`Pipeline completed with output property2: ${context.output.property2}`);

        // Example of using fallback policy
        console.log("\nRunning pipeline with fallback policy...");
        const fallbackContext = new Context();
        await new PipelineBuilder<InputData, OutputData>()
            .setSource(source)
            .attachContext(fallbackContext)
            .attachPipeWithFallbackPolicy(new FailingPipe(), new FallbackPipe())
            .flush();

        console.log(`Fallback pipeline completed with property1: ${fallbackContext.output.property1}`);

        // Example of using circuit breaker policy
        console.log("\nRunning pipeline with circuit breaker policy...");
        const circuitBreakerContext = new Context();
        try {
            await new PipelineBuilder<InputData, OutputData>()
                .setSource(source)
                .attachContext(circuitBreakerContext)
                .attachPipeWithCircuitBreakerPolicy(new FailingPipe(), 2, 1000)
                .flush();
        } catch (ex: any) {
            console.log(`Circuit breaker pipeline failed as expected: ${ex.message}`);
        }

        // Show any errors that occurred
        if (circuitBreakerContext.pipelineErrors.length > 0) {
            console.log(`Circuit breaker pipeline had ${circuitBreakerContext.pipelineErrors.length} error(s):`);
            for (const error of circuitBreakerContext.pipelineErrors) {
                console.log(`  - ${error.pipeName}: ${error.message}`);
            }
        }

        // Example of using circuit breaker recovery strategy
        console.log("\nRunning pipeline with circuit breaker recovery strategy...");
        const circuitBreakerStrategyContext = new Context();
        await new PipelineBuilder<InputData, OutputData>()
            .setSource(source)
            .attachContext(circuitBreakerStrategyContext)
            .attachPipeWithCircuitBreakerStrategy(new SuccessfulRecoveryPipe(), 2, 100)
            .flush();

        console.log(`Circuit breaker strategy pipeline completed with property1: ${circuitBreakerStrategyContext.output.property1}`);

        // Example of using retry with backoff recovery strategy
        console.log("\nRunning pipeline with retry with backoff recovery strategy...");
        const retryStrategyContext = new Context();
        await new PipelineBuilder<InputData, OutputData>()
            .setSource(source)
            .attachContext(retryStrategyContext)
            .attachPipeWithRetryStrategy(new SuccessfulRecoveryPipe(), 3, 100)
            .flush();

        console.log(`Retry strategy pipeline completed with property1: ${retryStrategyContext.output.property1}`);

        // Example of using global recovery strategy
        console.log("\nRunning pipeline with global recovery strategy...");
        const globalStrategyContext = new Context();
        await new PipelineBuilder<InputData, OutputData>()
            .setSource(source)
            .attachContext(globalStrategyContext)
            .withRecoveryStrategy(new RetryWithBackoffStrategy<InputData, OutputData>(2, 100, 60000))
            .attachPipe(new SuccessfulRecoveryPipe())
            .flush();

        console.log(`Global recovery strategy pipeline completed with property1: ${globalStrategyContext.output.property1}`);
    }

    private async runPipelineWithValidation(): Promise<void> {
        const builder = new PipelineBuilder<InputData, OutputData>();
        const context = new Context();
        const source = new InputData();

        // Demonstrate pipeline validation with valid resource dependencies
        console.log("Testing pipeline with valid resource dependencies...");
        try {
            const validationResult = await builder
                .setSource(source)
                .attachContext(context)
                .attachPipe(new DemoPipeOne()) // Provides Resource1
                .attachPipe(new DemoPipeTwo()) // Requires Resource1, provides Resource2
                .attachPipe(new DemoPipeThree()) // Requires Resource2
                .validateConfigurationForResult(); // Get validation results without throwing

            if (validationResult.errors.length > 0) {
                console.log(`Validation errors: ${validationResult.errors.join(", ")}`);
            } else {
                console.log("Validation passed! Executing pipeline...");
                await builder.flush();
                console.log(`Pipeline executed successfully. Property2: ${context.output.property2}`);
            }
        } catch (ex: any) {
            console.log(`Validation failed: ${ex.message}`);
        }

        console.log();

        // Demonstrate pipeline validation with missing resource dependency
        console.log("Testing pipeline with missing resource dependency...");
        const builder2 = new PipelineBuilder<InputData, OutputData>();
        const context2 = new Context();
        const source2 = new InputData();

        try {
            // This will fail validation because GetMissingResourcePipe requires a resource that is never provided
            const pipeWithMissingResource = new GetMissingResourcePipe();
            const validationResult2 = await builder2
                .setSource(source2)
                .attachContext(context2)
                .attachPipe(pipeWithMissingResource)
                .validateConfigurationForResult();

            if (validationResult2.errors.length > 0) {
                console.log(`Validation correctly caught the error: ${validationResult2.errors[0]}`);
            } else {
                console.log("Unexpected: Validation passed when it should have failed");
            }
        } catch (ex: any) {
            console.log(`Validation correctly caught the error: ${ex.message}`);
        }

        console.log();

        // Demonstrate custom validator
        console.log("Testing pipeline with custom validator...");
        const builder3 = new PipelineBuilder<InputData, OutputData>();
        const context3 = new Context();
        const source3 = new InputData();
        const validator = new DemoPipelineValidator();

        // First test with a normal pipeline (should pass custom validation)
        try {
            const validationResult3 = await builder3
                .setSource(source3)
                .attachContext(context3)
                .attachPipe(new DemoPipeOne())
                .attachPipe(new DemoPipeTwo())
                .attachPipe(new DemoPipeThree())
                .attachValidator(validator)
                .validateConfigurationForResult();

            if (validationResult3.errors.length > 0) {
                console.log(`Custom validator errors for normal pipeline: ${validationResult3.errors.join(", ")}`);
            } else {
                console.log("Custom validator: Normal pipeline passed validation as expected.");
            }
        } catch (ex: any) {
            console.log(`Custom validator test: ${ex.message}`);
        }

        console.log();

        // Test with a pipeline that has many pipes to trigger the custom validation rule
        console.log("Testing custom validator with pipeline that has many pipes (will exceed limit)...");
        const builder4 = new PipelineBuilder<InputData, OutputData>();
        const context4 = new Context();
        const source4 = new InputData();

        try {
            const validationResult4 = await builder4
                .setSource(source4)
                .attachContext(context4)
                .attachPipe(new DemoPipeOne()) // 1
                .attachPipe(new DemoPipeTwo()) // 2
                .attachPipe(new DemoPipeThree()) // 3
                .attachPipe(new DemoPipeFour()) // 4
                .attachPipe(new DemoPipeFive()) // 5
                .attachPipe(new DemoPipeSix()) // 6 - This exceeds our limit of 5
                .attachValidator(validator)
                .validateConfigurationForResult();

            if (validationResult4.errors.length > 0) {
                console.log(`Custom validator correctly caught the error: ${validationResult4.errors[0]}`);
            } else {
                console.log("Custom validator: Unexpectedly passed validation");
            }
        } catch (ex: any) {
            console.log(`Custom validator test: ${ex.message}`);
        }
    }

    private async runPipelineWithCancellation(): Promise<void> {
        const builder = new PipelineBuilder<InputData, OutputData>();
        const context = new Context();
        const source = new InputData();

        console.log("Testing pipeline without cancellation (cancellation feature removed)...");
        console.log("Starting pipeline that will run to completion...");

        await builder
            .setSource(source)
            .attachContext(context)
            .attachPipe(new SlowDemoPipe()) // This pipe has a delay
            .attachPipe(new DemoPipeOne())
            .flush();

        console.log("Pipeline completed successfully (cancellation feature has been removed)");
    }

    private async runPipelineWithCancellablePipe(): Promise<void> {
        const builder = new PipelineBuilder<InputData, OutputData>();
        const context = new Context();
        const source = new InputData();

        console.log("Testing pipeline with cancellable pipe implementation (cancellation feature removed)...");
        console.log("Starting pipeline with a cancellable operation that will run to completion...");

        // The cancellable pipe will now run to completion since cancellation is no longer supported
        await builder
            .setSource(source)
            .attachContext(context)
            .attachPipe(new CancellableOperationPipe("LongRunningOperation", 1000)) // 1-second operation
            .attachPipe(new DemoPipeOne())
            .flush();

        console.log("Pipeline completed successfully (cancellation feature has been removed)");
        if (context.output) {
            console.log(`Output after execution: ${context.output.property1}`);
        }

        console.log();

        // Demonstrate successful completion
        console.log("Testing successful completion of cancellable pipe...");
        const builder2 = new PipelineBuilder<InputData, OutputData>();
        const context2 = new Context();

        await builder2
            .setSource(source)
            .attachContext(context2)
            .attachPipe(new CancellableOperationPipe("SuccessfulOperation", 500)) // 0.5-second operation
            .flush();

        console.log(`Pipeline completed successfully. Property2: ${context2.output?.property2 ?? 0}`);
        console.log(`Output string: ${context2.output?.property1 ?? "null"}`);
    }

    private formatBytes(bytes: number): string {
        const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
        let counter = 0;
        let number = bytes;

        while (Math.round(number / 1024) >= 1) {
            number /= 1024;
            counter++;
        }

        return `${number.toFixed(1)} ${suffixes[counter]}`;
    }
}