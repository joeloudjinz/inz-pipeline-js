import {PipelineBuilder} from '../../src/pipeline-builder';
import {TestPipelineContext} from '../test-pipeline-context';
import {BasePipe} from '../../src/base-pipe';

// Mock pipe for testing
class TestPipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 2};
    }
}

// Mock pipe that adds to the result
class AddPipe extends BasePipe<{ value: number }, { result: number }> {
    private readonly addValue: number;

    constructor(addValue: number) {
        super();
        this.addValue = addValue;
    }

    async handle(context: any): Promise<void> {
        if (!context.output) {
            context.output = {result: context.input.value + this.addValue};
        } else {
            context.output.result += this.addValue;
        }
    }
}

describe('PipelineBuilder - Conditional Pipes', () => {
    let builder: PipelineBuilder<{ value: number }, { result: number }>;
    let context: TestPipelineContext<{ value: number }, { result: number }>;
    let source: { value: number };

    beforeEach(() => {
        builder = new PipelineBuilder<{ value: number }, { result: number }>();
        context = new TestPipelineContext<{ value: number }, { result: number }>();
        source = {value: 5};
    });

    test('should execute conditional pipe when condition is true', async () => {
        const testPipe = new TestPipe();
        const condition = (ctx: any) => ctx.input.value > 0;

        builder.attachContext(context).setSource(source).attachConditionalPipe(testPipe, condition);

        await builder.flush();

        expect(context.output).toEqual({result: 10}); // 5 * 2
    });

    test('should skip conditional pipe when condition is false', async () => {
        const testPipe = new TestPipe();
        const condition = (ctx: any) => ctx.input.value < 0;

        builder.attachContext(context).setSource(source).attachConditionalPipe(testPipe, condition);

        await builder.flush();

        // Since the pipe wasn't executed, output should remain undefined
        expect(context.output).toBeUndefined();
    });

    test('should continue pipeline execution after conditional pipe when condition is false', async () => {
        const addPipe = new AddPipe(10);
        const conditionalPipe = new TestPipe();
        const condition = (ctx: any) => ctx.input.value < 0; // This will be false for value 5

        builder.attachContext(context).setSource(source)
            .attachConditionalPipe(conditionalPipe, condition)
            .attachPipe(addPipe);

        await builder.flush();

        // The conditional pipe should not execute, but the add pipe should
        expect(context.output).toEqual({result: 15}); // 5 + 10
    });

    test('should execute conditional pipe and continue pipeline when condition is true', async () => {
        const addPipe = new AddPipe(10);
        const conditionalPipe = new TestPipe(); // 5 * 2 = 10
        const condition = (ctx: any) => ctx.input.value > 0; // This will be true for value 5

        builder.attachContext(context).setSource(source)
            .attachConditionalPipe(conditionalPipe, condition)
            .attachPipe(addPipe); // 10 + 10 = 20

        await builder.flush();

        // The conditional pipe should execute, and then the add pipe should add to the result
        expect(context.output).toEqual({result: 20});
    });

    test('should work with conditional pipe that has configuration', async () => {
        const testPipe = new TestPipe();
        const condition = (ctx: any) => ctx.input.value > 0;

        // We'll test that the conditional pipe can be attached with configuration
        // by simply verifying it executes correctly
        builder.attachContext(context).setSource(source).attachConditionalPipe(testPipe, condition);

        await builder.flush();

        expect(context.output).toEqual({result: 10}); // 5 * 2
    });
});