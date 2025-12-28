const { PipelineBuilder, PipelineContext, BasePipe } = require('./dist');

// Define simple input and output types for testing
class TestInput {
  constructor(value) {
    this.value = value;
  }
}

class TestOutput {
  constructor(result) {
    this.result = result;
  }
}

// Create a simple context for testing
class TestContext extends PipelineContext {
  constructor() {
    super();
    this.input = new TestInput(0);
    this.output = new TestOutput(0);
  }
}

// Create a simple pipe for testing
class AddPipe extends BasePipe {
  constructor(amount) {
    super();
    this.amount = amount;
  }

  async handle(context, cancellationToken) {
    // Check for cancellation
    if (cancellationToken?.aborted) {
      throw new Error('Operation was cancelled');
    }

    // Initialize output if it doesn't exist
    if (!context.output) {
      context.output = new TestOutput(0);
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

// Test the pipeline
async function testPipeline() {
  console.log('Testing pipeline functionality...');

  const builder = new PipelineBuilder();
  const context = new TestContext();
  const source = new TestInput(0);

  await builder
    .setSource(source)
    .attachContext(context)
    .attachPipe(new AddPipe(5))
    .attachPipe(new AddPipe(3))
    .attachPipe(new AddPipe(2))
    .flush();

  console.log('Pipeline completed successfully!');
  console.log('Final result:', context.output.result); // Should be 10 (5 + 3 + 2)

  if (context.output.result === 10) {
    console.log('✓ Test passed!');
  } else {
    console.log('✗ Test failed!');
  }
}

// Run the test
testPipeline().catch(console.error);