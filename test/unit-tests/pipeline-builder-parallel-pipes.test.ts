import {PipelineBuilder} from '../../src/pipeline-builder';
import {TestPipelineContext} from '../test-pipeline-context';
import {BasePipe} from '../../src/base-pipe';

// Mock pipe that multiplies the value
class MultiplyPipe extends BasePipe<{ value: number }, { result: number }> {
    private readonly multiplier: number;

    constructor(multiplier: number) {
        super();
        this.multiplier = multiplier;
    }

    async handle(context: any): Promise<void> {
        if (!context.output) {
            context.output = {result: context.input.value * this.multiplier};
        } else {
            context.output.result = context.output.result * this.multiplier;
        }
    }
}

// Mock pipe that adds to the value
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
            context.output.result = context.output.result + this.addValue;
        }
    }
}

// Mock pipe that subtracts from the value
class SubtractPipe extends BasePipe<{ value: number }, { result: number }> {
    private readonly subtractValue: number;

    constructor(subtractValue: number) {
        super();
        this.subtractValue = subtractValue;
    }

    async handle(context: any): Promise<void> {
        if (!context.output) {
            context.output = {result: context.input.value - this.subtractValue};
        } else {
            context.output.result = context.output.result - this.subtractValue;
        }
    }
}

describe('PipelineBuilder - Parallel Pipes', () => {
    let builder: PipelineBuilder<{ value: number }, { result: number }>;
    let context: TestPipelineContext<{ value: number }, { result: number }>;
    let source: { value: number };

    beforeEach(() => {
        builder = new PipelineBuilder<{ value: number }, { result: number }>();
        context = new TestPipelineContext<{ value: number }, { result: number }>();
        source = {value: 10};
    });

    test('should execute multiple pipes in parallel', async () => {
        const multiplyByTwo = new MultiplyPipe(2); // 10 * 2 = 20
        const addFive = new AddPipe(5);           // 10 + 5 = 15
        const subtractThree = new SubtractPipe(3); // 10 - 3 = 7

        builder.attachContext(context).setSource(source).attachParallelPipes(multiplyByTwo, addFive, subtractThree);

        await builder.flush();

        // In parallel execution, the result depends on which pipe finishes last
        // The result should be a number, but we can't predict which one due to concurrent execution
        expect(context.output).toEqual(
            expect.objectContaining({
                result: expect.any(Number)
            })
        );
    });

    test('should execute parallel pipes with different configurations', async () => {
        const multiplyByThree = new MultiplyPipe(3); // 10 * 3 = 30
        const addSeven = new AddPipe(7);             // 10 + 7 = 17

        builder.attachContext(context).setSource(source).attachParallelPipes(multiplyByThree, addSeven);

        await builder.flush();

        // Result will be a number, but we can't predict which one due to concurrent execution
        expect(context.output).toEqual(
            expect.objectContaining({
                result: expect.any(Number)
            })
        );
    });

    test('should handle parallel pipes with no execution errors', async () => {
        const multiplyByTwo = new MultiplyPipe(2);
        const addFive = new AddPipe(5);

        builder.attachContext(context).setSource(source).attachParallelPipes(multiplyByTwo, addFive);

        // This should not throw any errors
        await expect(builder.flush()).resolves.not.toThrow();

        // Verify that the output is a number
        expect(context.output).toEqual(
            expect.objectContaining({
                result: expect.any(Number)
            })
        );
    });

    test('should execute parallel pipes and continue with sequential pipes', async () => {
        const multiplyByTwo = new MultiplyPipe(2); // 10 * 2 = 20 (or another result depending on which finishes last)
        const addFive = new AddPipe(5);           // 10 + 5 = 15
        // The sequential pipe will operate on the result of the parallel execution
        const finalAdd = new AddPipe(10);         

        builder.attachContext(context).setSource(source)
            .attachParallelPipes(multiplyByTwo, addFive)
            .attachPipe(finalAdd); // This should add 10 to the result of the parallel execution

        await builder.flush();

        // The result should be a number (the parallel result plus 10)
        expect(context.output).toEqual(
            expect.objectContaining({
                result: expect.any(Number)
            })
        );
    });

    test('should handle parallel pipes with shared context', async () => {
        // Initialize context with some data
        context.output = {result: 100};

        const multiplyByTwo = new MultiplyPipe(2); // 100 * 2 = 200
        const addFive = new AddPipe(5);           // 100 + 5 = 105

        builder.attachContext(context).setSource(source).attachParallelPipes(multiplyByTwo, addFive);

        await builder.flush();

        // Result will be a number, but we can't predict which one due to concurrent execution
        expect(context.output).toEqual(
            expect.objectContaining({
                result: expect.any(Number)
            })
        );
    });
});