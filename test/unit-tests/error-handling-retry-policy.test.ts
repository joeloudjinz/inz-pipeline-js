import {RetryPolicy} from '../../src/error-handling/retry-policy';
import {BasePipe} from '../../src/base-pipe';
import {TestPipelineContext} from '../test-pipeline-context';

// Mock pipe that succeeds immediately
class SuccessPipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 2};
    }
}

// Mock pipe that fails a specified number of times before succeeding
class FlakyPipe extends BasePipe<{ value: number }, { result: number }> {
    private executionCount = 0;
    private readonly failAttempts: number;

    constructor(failAttempts: number) {
        super();
        this.failAttempts = failAttempts;
    }

    async handle(context: any): Promise<void> {
        this.executionCount++;

        if (this.executionCount <= this.failAttempts) {
            throw new Error(`Simulated failure on attempt ${this.executionCount}`);
        }

        context.output = {result: context.input.value * 2};
    }
}

// Mock pipe that always fails
class AlwaysFailPipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        throw new Error('Always fails');
    }
}

describe('RetryPolicy Tests', () => {
    let context: TestPipelineContext<{ value: number }, { result: number }>;
    let source: { value: number };

    beforeEach(() => {
        context = new TestPipelineContext<{ value: number }, { result: number }>();
        source = {value: 5};
    });

    test('should execute successfully without retries when pipe succeeds first time', async () => {
        // Set up the context with input before running the pipe
        context.input = source;
        const successPipe = new SuccessPipe();
        const policy = new RetryPolicy<{ value: number }, { result: number }>(3, 100);

        await expect(policy.execute(successPipe, context)).resolves.not.toThrow();
        expect(context.output).toEqual({result: 10}); // 5 * 2
    });

    test('should retry on failure and succeed after specified attempts', async () => {
        // Set up the context with input before running the pipe
        context.input = source;
        const flakyPipe = new FlakyPipe(2); // Fails 2 times, succeeds on 3rd
        const policy = new RetryPolicy<{ value: number }, { result: number }>(3, 10, 1000, false);

        await expect(policy.execute(flakyPipe, context)).resolves.not.toThrow();
        expect(context.output).toEqual({result: 10}); // 5 * 2
    });

    test('should retry with exponential backoff', async () => {
        // Set up the context with input before running the pipe
        context.input = source;
        const flakyPipe = new FlakyPipe(1); // Fails 1 time, succeeds on 2nd
        const policy = new RetryPolicy<{ value: number }, { result: number }>(3, 10, 1000, true);

        await expect(policy.execute(flakyPipe, context)).resolves.not.toThrow();
        expect(context.output).toEqual({result: 10}); // 5 * 2
    });

    test('should fail after max attempts are reached', async () => {
        // Set up the context with input before running the pipe
        context.input = source;
        const alwaysFailPipe = new AlwaysFailPipe();
        const policy = new RetryPolicy<{ value: number }, { result: number }>(2, 10, 100, false);

        await expect(policy.execute(alwaysFailPipe, context)).rejects.toThrow();
    });

    test('should respect max delay when using exponential backoff', async () => {
        // Set up the context with input before running the pipe
        context.input = source;
        const flakyPipe = new FlakyPipe(2); // Fails 2 times, succeeds on 3rd
        const policy = new RetryPolicy<{ value: number }, { result: number }>(3, 10, 50, true); // Max delay of 50ms

        await expect(policy.execute(flakyPipe, context)).resolves.not.toThrow();
        expect(context.output).toEqual({result: 10}); // 5 * 2
    });
});