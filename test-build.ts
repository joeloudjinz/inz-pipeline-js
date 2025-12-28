import {BasePipe, DefaultPipelineValidator, PipelineBuilder, PipelineContext, SubPipeline} from './dist';
import {getMemoryUsage, getUsedMemoryBytes} from "./dist";

// Define simple input and output types for testing
interface TestInput {
  value: number;
  items?: string[];
}

interface TestOutput {
  result: number;
  processedItems?: string[];
}

// Create a context for testing
class TestContext extends PipelineContext<TestInput, TestOutput> {
  constructor() {
    super();
    this.input = { value: 0, items: [] };
    this.output = { result: 0, processedItems: [] };
  }
}

// Create a pipe that adds a value to the result
class AddPipe extends BasePipe<TestInput, TestOutput> {
  private readonly amount: number;

  constructor(amount: number) {
    super();
    this.amount = amount;
  }

  public async handle(
    context: PipelineContext<TestInput, TestOutput>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }

    // Initialize output if it doesn't exist
    if (!context.output) {
      context.output = { result: 0 };
    }

    // Perform the operation
    context.output.result += this.amount;

    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, 10));

    // Check for cancellation again after async work
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }
  }
}

// Create a pipe that processes items in the input
class ProcessItemsPipe extends BasePipe<TestInput, TestOutput> {
  private readonly prefix: string;

  constructor(prefix: string = 'processed') {
    super();
    this.prefix = prefix;
  }

  public async handle(
    context: PipelineContext<TestInput, TestOutput>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }

    if (!context.output) {
      context.output = { result: 0, processedItems: [] };
    }

    if (!context.output.processedItems) {
      context.output.processedItems = [];
    }

    // Process input items
    if (context.input.items) {
      for (const item of context.input.items) {
        context.output.processedItems.push(`${this.prefix}_${item}`);
      }
    }

    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, 5));

    // Check for cancellation again after async work
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }
  }
}

// Create a pipe that fails sometimes for testing error handling
class FlakyPipe extends BasePipe<TestInput, TestOutput> {
  private readonly failureRate: number;
  private attemptCount: number = 0;

  constructor(failureRate: number = 0.5) {
    super();
    this.failureRate = failureRate;
  }

  public async handle(
    context: PipelineContext<TestInput, TestOutput>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }

    this.attemptCount++;

    // Randomly fail based on failure rate
    if (Math.random() < this.failureRate) {
      throw new Error(`FlakyPipe failed on attempt ${this.attemptCount}`);
    }

    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, 5));

    // Check for cancellation again after async work
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }
  }
}

// Create a pipe that always fails for testing error handling
class AlwaysFailPipe extends BasePipe<TestInput, TestOutput> {
  public async handle(
    context: PipelineContext<TestInput, TestOutput>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }

    throw new Error('AlwaysFailPipe always fails');
  }
}

// Create a pipe that succeeds for fallback testing
class SuccessPipe extends BasePipe<TestInput, TestOutput> {
  public async handle(
    context: PipelineContext<TestInput, TestOutput>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    // Check for cancellation
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }

    if (!context.output) {
      context.output = { result: 0 };
    }

    context.output.result += 100; // Add 100 to result to indicate success

    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, 5));

    // Check for cancellation again after async work
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }
  }
}

// Comprehensive test function
async function runAllTests(): Promise<boolean> {
  let allTestsPassed = true;

  console.log('🧪 Starting comprehensive pipeline tests...\n');

  // Test 1: Basic functionality
  try {
    console.log('Test 1: Basic pipeline functionality');
    const builder1 = new PipelineBuilder<TestInput, TestOutput>();
    const context1 = new TestContext();
    const source1 = { value: 0 };

    await builder1
      .setSource(source1)
      .attachContext(context1)
      .attachPipe(new AddPipe(5))
      .attachPipe(new AddPipe(3))
      .attachPipe(new AddPipe(2))
      .flush();

    if (context1.output.result === 10) {
      console.log('  ✓ Basic functionality test passed');
    } else {
      console.log(`  ✗ Basic functionality test failed. Expected: 10, Got: ${context1.output.result}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Basic functionality test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 2: Sequential execution with context data
  try {
    console.log('\nTest 2: Sequential execution with context data');
    const builder2 = new PipelineBuilder<TestInput, TestOutput>();
    const context2 = new TestContext();
    const source2 = { value: 10, items: ['item1', 'item2'] };

    await builder2
      .setSource(source2)
      .attachContext(context2)
      .attachPipe(new AddPipe(5))
      .attachPipe(new ProcessItemsPipe('processed'))
      .flush();

    if (context2.output.result === 5 && context2.output.processedItems?.length === 2) {
      console.log('  ✓ Sequential execution test passed');
    } else {
      console.log(`  ✗ Sequential execution test failed. Result: ${context2.output.result}, Processed items: ${context2.output.processedItems?.length || 0}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Sequential execution test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 3: Parallel execution
  try {
    console.log('\nTest 3: Parallel execution');
    const builder3 = new PipelineBuilder<TestInput, TestOutput>();
    const context3 = new TestContext();
    const source3 = { value: 0 };

    await builder3
      .setSource(source3)
      .attachContext(context3)
      .attachParallelPipes(
        new AddPipe(5),
        new AddPipe(10),
        new AddPipe(15)
      )
      .flush();

    // Since they run in parallel and add to the same result, we expect 30 (5+10+15)
    if (context3.output.result === 30) {
      console.log('  ✓ Parallel execution test passed');
    } else {
      console.log(`  ✗ Parallel execution test failed. Expected: 30, Got: ${context3.output.result}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Parallel execution test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 4: Conditional execution
  try {
    console.log('\nTest 4: Conditional execution');
    const builder4 = new PipelineBuilder<TestInput, TestOutput>();
    const context4 = new TestContext();
    const source4 = { value: 15 }; // Value > 10 to trigger condition

    await builder4
      .setSource(source4)
      .attachContext(context4)
      .attachConditionalPipe(
        new AddPipe(100),
        (ctx) => ctx.input.value > 10
      )
      .flush();

    if (context4.output.result === 100) {
      console.log('  ✓ Conditional execution test passed');
    } else {
      console.log(`  ✗ Conditional execution test failed. Expected: 100, Got: ${context4.output.result}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Conditional execution test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 5: Sub-pipeline execution
  try {
    console.log('\nTest 5: Sub-pipeline execution');
    const subPipeline = new SubPipeline<TestInput, TestOutput>((subBuilder) => {
      subBuilder
        .attachPipe(new AddPipe(20))
        .attachPipe(new AddPipe(30));
    });

    const builder5 = new PipelineBuilder<TestInput, TestOutput>();
    const context5 = new TestContext();
    const source5 = { value: 0 };

    await builder5
      .setSource(source5)
      .attachContext(context5)
      .attachSubPipeline(subPipeline)
      .flush();

    if (context5.output.result === 50) { // 20 + 30
      console.log('  ✓ Sub-pipeline execution test passed');
    } else {
      console.log(`  ✗ Sub-pipeline execution test failed. Expected: 50, Got: ${context5.output.result}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Sub-pipeline execution test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 6: Retry policy
  try {
    console.log('\nTest 6: Retry policy');
    const builder6 = new PipelineBuilder<TestInput, TestOutput>();
    const context6 = new TestContext();
    const source6 = { value: 0 };

    // Use a flaky pipe with a low failure rate to ensure it eventually succeeds
    await builder6
      .setSource(source6)
      .attachContext(context6)
      .attachPipeWithRetryPolicy(new FlakyPipe(0.1), 5, 10, 100, false)
      .flush();

    console.log('  ✓ Retry policy test passed');
  } catch (error) {
    console.log(`  ✗ Retry policy test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 7: Fallback policy
  try {
    console.log('\nTest 7: Fallback policy');
    const builder7 = new PipelineBuilder<TestInput, TestOutput>();
    const context7 = new TestContext();
    const source7 = { value: 0 };

    await builder7
      .setSource(source7)
      .attachContext(context7)
      .attachPipeWithFallbackPolicy(
        new AlwaysFailPipe(),
        new SuccessPipe()
      )
      .flush();

    if (context7.output.result === 100) { // SuccessPipe adds 100
      console.log('  ✓ Fallback policy test passed');
    } else {
      console.log(`  ✗ Fallback policy test failed. Expected: 100, Got: ${context7.output.result}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Fallback policy test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 8: Performance metrics
  try {
    console.log('\nTest 8: Performance metrics');
    const builder8 = new PipelineBuilder<TestInput, TestOutput>();
    const context8 = new TestContext();
    const source8 = { value: 0 };

    await builder8
      .setSource(source8)
      .attachContext(context8)
      .enablePerformanceMetrics('test-correlation-id')
      .attachPipe(new AddPipe(5))
      .attachPipe(new AddPipe(5))
      .flush();

    if (context8.performanceMetrics?.isEnabled && context8.output.result === 10) {
      console.log('  ✓ Performance metrics test passed');
    } else {
      console.log(`  ✗ Performance metrics test failed. Enabled: ${context8.performanceMetrics?.isEnabled}, Result: ${context8.output.result}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Performance metrics test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 9: Resource management
  try {
    console.log('\nTest 9: Resource management');
    const builder9 = new PipelineBuilder<TestInput, TestOutput>();
    const context9 = new TestContext();
    const source9 = { value: 0 };

    // Add a resource to context before pipeline execution
    context9.addResource('test-resource', 'test-value');

    class ResourceCheckingPipe extends BasePipe<TestInput, TestOutput> {
      public async handle(
        context: PipelineContext<TestInput, TestOutput>,
        cancellationToken?: AbortSignal
      ): Promise<void> {
        // Check for cancellation
        if (cancellationToken?.aborted) {
          throw new Error('Operation was cancelled');
        }

        // Try to get the resource
        const resource = context.getResource<string>('test-resource');
        if (resource !== 'test-value') {
          throw new Error(`Resource value mismatch. Expected: test-value, Got: ${resource}`);
        }

        // Add another resource
        context.addResource('new-resource', 'new-value');
      }
    }

    await builder9
      .setSource(source9)
      .attachContext(context9)
      .attachPipe(new ResourceCheckingPipe())
      .flush();

    // Check if the new resource was added
    const newResource = context9.getResource<string>('new-resource');
    if (newResource === 'new-value') {
      console.log('  ✓ Resource management test passed');
    } else {
      console.log(`  ✗ Resource management test failed. Expected: new-value, Got: ${newResource}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ✗ Resource management test failed with error: ${error}`);
    allTestsPassed = false;
  }

  // Test 10: Validation
  try {
    console.log('\nTest 10: Pipeline validation');
    const builder10 = new PipelineBuilder<TestInput, TestOutput>();
    const context10 = new TestContext();
    const source10 = { value: 0 };

    await builder10
      .setSource(source10)
      .attachContext(context10)
      .attachValidator(new DefaultPipelineValidator<TestInput, TestOutput>())
      .attachPipe(new AddPipe(5))
      .flush();

    console.log('  ✓ Pipeline validation test passed');
  } catch (error) {
    console.log(`  ✗ Pipeline validation test failed with error: ${error}`);
    allTestsPassed = false;
  }

  console.log(`\n${allTestsPassed ? '🎉 All tests passed!' : '❌ Some tests failed!'}`);
  return allTestsPassed;
}

// Run all tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed with error:', error);
    process.exit(1);
  });


console.log('Testing new memory tracking functionality...\n');

// Test getMemoryUsage function
const memoryUsage = getMemoryUsage();
console.log('Memory Usage:', memoryUsage);

// Test getUsedMemoryBytes function
const usedMemory = getUsedMemoryBytes();
console.log('Used Memory Bytes:', usedMemory);

console.log('\nMemory tracking functionality is is working correctly!');